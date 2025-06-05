/**
 * Authentication Routes for Snowfun Nepal application
 * 
 * Defines all authentication-related endpoints including registration,
 * login, token refresh, password management, and profile access.
 */

import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[a-zA-Z]/)
      .withMessage('Password must contain at least one letter')
      .matches(/\d/)
      .withMessage('Password must contain at least one number'),
    body('fullName')
      .notEmpty()
      .withMessage('Full name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    body('roleId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Role ID must be a positive integer')
  ],
  authController.register
);

/**
 * @route POST /api/auth/login
 * @desc Login user and return tokens
 * @access Public
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  authController.login
);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post(
  '/refresh-token',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
  ],
  authController.refreshToken
);

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authMiddleware, authController.getProfile);

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post(
  '/change-password',
  authMiddleware,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/[a-zA-Z]/)
      .withMessage('New password must contain at least one letter')
      .matches(/\d/)
      .withMessage('New password must contain at least one number')
      .custom((value, { req }) => {
        if (value === req.body.currentPassword) {
          throw new Error('New password cannot be the same as current password');
        }
        return true;
      })
  ],
  authController.changePassword
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset (sends email with reset link)
 * @access Public
 */
router.post(
  '/forgot-password',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
  ],
  authController.forgotPassword
);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password using reset token
 * @access Public
 */
router.post(
  '/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/[a-zA-Z]/)
      .withMessage('New password must contain at least one letter')
      .matches(/\d/)
      .withMessage('New password must contain at least one number')
  ],
  authController.resetPassword
);

export default router;
