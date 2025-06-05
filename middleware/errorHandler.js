/**
 * Global error handler middleware for Snowfun Nepal application
 * 
 * This middleware catches all errors thrown or passed to next() throughout
 * the application and formats them into consistent error responses.
 * It handles different error types and provides appropriate status codes.
 */

import { ValidationError } from 'express-validator';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

/**
 * Express error handling middleware
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const errorHandler = (err, req, res, next) => {
  // Set default status code and error message
  let statusCode = 500;
  let message = 'Internal server error';
  let errors = null;
  
  // Log the error (always log the full error in the server)
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);
  
  // Handle specific error types
  if (err instanceof ValidationError) {
    // Validation errors (from express-validator)
    statusCode = 400;
    message = 'Validation failed';
    errors = err.array().map(error => ({
      field: error.param,
      message: error.msg
    }));
  } else if (err instanceof EntityNotFoundError) {
    // Entity not found errors (from TypeORM)
    statusCode = 404;
    message = 'Resource not found';
  } else if (err instanceof QueryFailedError) {
    // Database query errors (from TypeORM)
    statusCode = 400;
    
    // Check for specific database error codes
    if (err.code === '23505') { // Unique constraint violation
      message = 'Duplicate entry';
    } else if (err.code === '23503') { // Foreign key constraint violation
      message = 'Referenced resource does not exist';
    } else {
      message = 'Database operation failed';
    }
  } else if (err.name === 'UnauthorizedError' || err.statusCode === 401) {
    // Authentication errors
    statusCode = 401;
    message = err.message || 'Unauthorized';
  } else if (err.name === 'ForbiddenError' || err.statusCode === 403) {
    // Authorization errors
    statusCode = 403;
    message = err.message || 'Forbidden';
  } else if (err.statusCode) {
    // Custom errors with status code
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.message) {
    // Generic errors with a message
    message = err.message;
  }

  // Build the error response
  const errorResponse = {
    error: {
      status: statusCode,
      message
    }
  };

  // Include validation errors if present
  if (errors) {
    errorResponse.error.details = errors;
  }

  // Include stack trace in development mode only
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    errorResponse.error.stack = err.stack.split('\n');
  }

  // Send the error response
  return res.status(statusCode).json(errorResponse);
};

/**
 * Helper function to create custom error with status code
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Error} Custom error object
 */
export const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export default errorHandler;
