/**
 * Authentication Controller for Snowfun Nepal application
 * 
 * Handles user registration, login, token refresh, and password management.
 * Implements JWT-based authentication with role-based access control.
 */

import { getRepository } from 'typeorm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { createError } from '../middleware/errorHandler.js';

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
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, fullName, phone, roleId } = req.body;
    
    const userRepository = getRepository(User);
    const roleRepository = getRepository(Role);

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists'
      });
    }

    // Verify role exists (default to PSR if not specified and not admin)
    let role;
    if (roleId) {
      role = await roleRepository.findOne({ where: { id: roleId } });
      if (!role) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid role specified'
        });
      }
    } else {
      // Default role is PSR (ID: 2)
      role = await roleRepository.findOne({ where: { id: Role.ROLES.PSR } });
    }

    // Create new user
    const user = userRepository.create({
      email,
      password_hash: password, // Will be hashed by @BeforeInsert hook
      fullName,
      phone,
      role
    });

    // Save user to database
    await userRepository.save(user);

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      role: user.role
    });

    // Return user data and tokens
    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
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
 * Login user
 * @route POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    const userRepository = getRepository(User);

    // Find user by email, explicitly select password_hash
    const user = await userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'fullName', 'password_hash', 'phone', 'createdAt', 'updatedAt'],
      relations: ['role']
    });

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      role: user.role
    });

    // Return user data and tokens
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
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
 * Refresh access token using refresh token
 * @route POST /api/auth/refresh-token
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken, 
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token'
      });
    }

    // Get user from database
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.id },
      relations: ['role']
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }

    // Generate new tokens
    const tokens = generateTokens({
      id: user.id,
      role: user.role
    });

    // Return new tokens
    return res.status(200).json({
      message: 'Token refreshed successfully',
      ...tokens
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @middleware authMiddleware - Requires authentication
 */
export const getProfile = async (req, res, next) => {
  try {
    // User is already attached to req by authMiddleware
    const userRepository = getRepository(User);
    
    // Get fresh user data from database
    const user = await userRepository.findOne({
      where: { id: req.user.id },
      relations: ['role']
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Return user profile
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role.roleName,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change user password
 * @route POST /api/auth/change-password
 * @middleware authMiddleware - Requires authentication
 */
export const changePassword = async (req, res, next) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    
    const userRepository = getRepository(User);

    // Find user by id, explicitly select password_hash
    const user = await userRepository.findOne({
      where: { id: req.user.id },
      select: ['id', 'password_hash']
    });

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password_hash = newPassword; // Will be hashed by @BeforeUpdate hook
    await userRepository.save(user);

    return res.status(200).json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset (sends email with reset link)
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const userRepository = getRepository(User);
    
    // Check if user exists
    const user = await userRepository.findOne({ where: { email } });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        message: 'If your email is registered, you will receive a password reset link'
      });
    }

    // Generate password reset token
    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_RESET_SECRET || process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // TODO: Send email with reset link
    // This would typically involve an email service integration
    // For now, just return the token for development purposes
    
    return res.status(200).json({
      message: 'If your email is registered, you will receive a password reset link',
      // Only include token in development environment
      ...(process.env.NODE_ENV !== 'production' && { resetToken })
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using reset token
 * @route POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Token and new password are required'
      });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(
        token, 
        process.env.JWT_RESET_SECRET || process.env.JWT_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired reset token'
      });
    }

    // Get user from database
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.id } });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Update password
    user.password_hash = newPassword; // Will be hashed by @BeforeUpdate hook
    await userRepository.save(user);

    return res.status(200).json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  refreshToken,
  getProfile,
  changePassword,
  forgotPassword,
  resetPassword
};
