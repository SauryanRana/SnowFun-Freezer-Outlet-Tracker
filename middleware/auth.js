/**
 * Authentication middleware for Snowfun Nepal application
 * 
 * This middleware verifies JWT tokens from the Authorization header,
 * fetches the corresponding user from the database, and attaches
 * the user object to the request for downstream route handlers.
 */

import jwt from 'jsonwebtoken';
import { getRepository } from 'typeorm';
import User from '../models/User.js';

/**
 * Middleware to authenticate requests using JWT
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Check if Authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. No token provided.'
      });
    }

    // Extract token from Authorization header (Bearer token)
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authentication format. Expected "Bearer [token]".'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database to ensure they still exist and are active
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.id },
      relations: ['role'] // Include the user's role for RBAC
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User no longer exists or access has been revoked.'
      });
    }

    // Attach user object to request for use in route handlers
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role.role_name
    };

    // Continue to next middleware or route handler
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authentication token.'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token has expired. Please login again.'
      });
    }

    // For any other errors, pass to the global error handler
    next(error);
  }
};

export default authMiddleware;
