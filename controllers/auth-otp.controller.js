/**
 * OTP Authentication Controller for Snowfun Nepal application
 * 
 * Handles mobile number-based authentication with OTP verification.
 * Supports Nepali phone numbers, OTP generation, verification, and user registration/login.
 */

import { getRepository } from 'typeorm';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import axios from 'axios';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { createError } from '../middleware/errorHandler.js';

// In-memory OTP storage (replace with Redis in production)
const otpStore = new Map();

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Format Nepali phone number to standard format
 * @param {string} phone - Phone number input
 * @returns {string} Formatted phone number
 */
const formatNepaliPhone = (phone) => {
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Check if number starts with Nepal country code
  if (cleaned.startsWith('977')) {
    // If it doesn't have the + prefix, add it
    return `+${cleaned}`;
  }
  
  // If it starts with 0, replace with Nepal country code
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
    return `+977${cleaned}`;
  }
  
  // If it's a 10-digit number without country code, add Nepal country code
  if (cleaned.length === 10) {
    return `+977${cleaned}`;
  }
  
  // Return as is if it doesn't match known patterns
  return phone;
};

/**
 * Store OTP with expiration (5 minutes)
 * @param {string} phone - Phone number
 * @param {string} otp - Generated OTP
 */
const storeOTP = (phone, otp) => {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes from now
  otpStore.set(phone, { otp, expiresAt });
  
  // Set timeout to automatically delete expired OTPs
  setTimeout(() => {
    if (otpStore.has(phone) && otpStore.get(phone).expiresAt <= Date.now()) {
      otpStore.delete(phone);
    }
  }, 5 * 60 * 1000);
};

/**
 * Verify stored OTP
 * @param {string} phone - Phone number
 * @param {string} otp - OTP to verify
 * @returns {boolean} True if OTP is valid
 */
const verifyOTP = (phone, otp) => {
  if (!otpStore.has(phone)) {
    return false;
  }
  
  const storedData = otpStore.get(phone);
  
  // Check if OTP has expired
  if (storedData.expiresAt <= Date.now()) {
    otpStore.delete(phone);
    return false;
  }
  
  // Check if OTP matches
  if (storedData.otp !== otp) {
    return false;
  }
  
  // OTP is valid, remove it from store to prevent reuse
  otpStore.delete(phone);
  return true;
};

/**
 * Send OTP via SMS
 * @param {string} phone - Phone number to send OTP to
 * @param {string} otp - OTP to send
 * @returns {Promise<boolean>} Success status
 */
const sendOTPviaSMS = async (phone, otp) => {
  try {
    // Replace with your preferred SMS gateway for Nepal
    // This is a placeholder implementation
    const smsGatewayUrl = process.env.SMS_GATEWAY_URL;
    const smsApiKey = process.env.SMS_API_KEY;
    
    if (!smsGatewayUrl || !smsApiKey) {
      console.warn('SMS gateway not configured. OTP:', otp);
      return true; // Return true in development without actual sending
    }
    
    // Example implementation with a generic SMS API
    const response = await axios.post(smsGatewayUrl, {
      apiKey: smsApiKey,
      to: phone,
      message: `Your Snowfun Nepal verification code is: ${otp}. Valid for 5 minutes.`,
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Failed to send OTP SMS:', error);
    return false;
  }
};

/**
 * Generate JWT tokens for authentication
 * @param {Object} user - User object with id and role
 * @returns {Object} Access and refresh tokens
 */
const generateTokens = (user) => {
  // Create access token (short-lived)
  const accessToken = jwt.sign(
    { 
      id: user.id,
      role: user.role.roleName 
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Create refresh token (longer-lived)
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    accessToken,
    refreshToken
  };
};

/**
 * Send OTP to phone number
 * @route POST /api/auth/send-otp
 */
export const sendOTP = async (req, res, next) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone } = req.body;
    const formattedPhone = formatNepaliPhone(phone);
    
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP
    storeOTP(formattedPhone, otp);
    
    // Send OTP via SMS
    const smsSent = await sendOTPviaSMS(formattedPhone, otp);
    
    if (!smsSent) {
      return res.status(500).json({
        error: 'Failed to send OTP',
        message: 'Could not send verification code. Please try again.'
      });
    }
    
    // In development, return OTP for testing
    const otpResponse = process.env.NODE_ENV === 'production' 
      ? { message: 'OTP sent successfully' }
      : { message: 'OTP sent successfully', otp }; // Only in development
    
    return res.status(200).json({
      ...otpResponse,
      phone: formattedPhone
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP and login/register user
 * @route POST /api/auth/verify-otp
 */
export const verifyOTPAndLogin = async (req, res, next) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, otp, fullName } = req.body;
    const formattedPhone = formatNepaliPhone(phone);
    
    // Verify OTP
    const isValidOTP = verifyOTP(formattedPhone, otp);
    
    if (!isValidOTP) {
      return res.status(401).json({
        error: 'Invalid OTP',
        message: 'The verification code is invalid or has expired.'
      });
    }
    
    const userRepository = getRepository(User);
    const roleRepository = getRepository(Role);
    
    // Check if user exists
    let user = await userRepository.findOne({ 
      where: { phone: formattedPhone },
      relations: ['role']
    });
    
    if (!user) {
      // If user doesn't exist and fullName is provided, register new user
      if (!fullName) {
        return res.status(400).json({
          error: 'Registration Required',
          message: 'User not found. Please provide your full name to register.',
          requiresRegistration: true
        });
      }
      
      // Get default PSR role
      const psrRole = await roleRepository.findOne({ where: { id: Role.ROLES.PSR } });
      
      if (!psrRole) {
        return res.status(500).json({
          error: 'Server Error',
          message: 'Could not assign user role.'
        });
      }
      
      // Create new user with phone number
      user = userRepository.create({
        phone: formattedPhone,
        fullName,
        role: psrRole,
        // Generate random password for account security
        password_hash: Math.random().toString(36).slice(-10)
      });
      
      await userRepository.save(user);
    }
    
    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      role: user.role
    });
    
    // Return user data and tokens
    return res.status(200).json({
      message: 'Authentication successful',
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role.roleName
      },
      ...tokens
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Link phone number to existing account
 * @route POST /api/auth/link-phone
 */
export const linkPhoneToAccount = async (req, res, next) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, email, password } = req.body;
    const formattedPhone = formatNepaliPhone(phone);
    
    const userRepository = getRepository(User);
    
    // Find user by email
    const user = await userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'fullName', 'password_hash', 'phone']
    });
    
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found with this email.'
      });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid password.'
      });
    }
    
    // Check if phone is already linked to another account
    const existingPhoneUser = await userRepository.findOne({
      where: { phone: formattedPhone }
    });
    
    if (existingPhoneUser && existingPhoneUser.id !== user.id) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'This phone number is already linked to another account.'
      });
    }
    
    // Update user with phone number
    user.phone = formattedPhone;
    await userRepository.save(user);
    
    return res.status(200).json({
      message: 'Phone number linked successfully',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  sendOTP,
  verifyOTPAndLogin,
  linkPhoneToAccount
};
