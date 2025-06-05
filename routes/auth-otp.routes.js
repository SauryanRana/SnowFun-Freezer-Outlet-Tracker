/**
 * OTP Authentication Routes for Snowfun Nepal application
 * 
 * Defines all mobile number authentication-related endpoints including
 * sending OTP, verifying OTP, and linking phone numbers to accounts.
 */

import express from 'express';
import { body } from 'express-validator';
import * as authOtpController from '../controllers/auth-otp.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route POST /api/auth/send-otp
 * @desc Send OTP to phone number
 * @access Public
 */
router.post(
  '/send-otp',
  [
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^(\+977|977|0)?[9][6-9]\d{8}$/)
      .withMessage('Please provide a valid Nepali phone number')
  ],
  authOtpController.sendOTP
);

/**
 * @route POST /api/auth/verify-otp
 * @desc Verify OTP and login/register user
 * @access Public
 */
router.post(
  '/verify-otp',
  [
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^(\+977|977|0)?[9][6-9]\d{8}$/)
      .withMessage('Please provide a valid Nepali phone number'),
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
      .isNumeric()
      .withMessage('OTP must contain only numbers'),
    body('fullName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters')
  ],
  authOtpController.verifyOTPAndLogin
);

/**
 * @route POST /api/auth/link-phone
 * @desc Link phone number to existing account
 * @access Private
 */
router.post(
  '/link-phone',
  authMiddleware,
  [
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^(\+977|977|0)?[9][6-9]\d{8}$/)
      .withMessage('Please provide a valid Nepali phone number'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .optional()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
  ],
  authOtpController.linkPhoneToAccount
);

export default router;
