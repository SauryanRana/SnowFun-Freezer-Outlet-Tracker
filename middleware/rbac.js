/**
 * Role-Based Access Control (RBAC) middleware for Snowfun Nepal application
 * 
 * This middleware restricts access to routes based on user roles.
 * It works in conjunction with the auth middleware which should be applied first
 * to attach the authenticated user to the request object.
 */

/**
 * Creates a middleware function that checks if the user has one of the allowed roles
 * @param {Array<string>} allowedRoles - Array of role names that are permitted to access the route
 * @returns {Function} Express middleware function
 */
export const rbacMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      // Ensure user is authenticated and has a role attached
      if (!req.user || !req.user.role) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required before role verification.'
        });
      }

      // Check if user's role is in the allowed roles list
      if (allowedRoles.includes(req.user.role)) {
        // User has permission, proceed to the next middleware or route handler
        return next();
      }

      // If we reach here, the user doesn't have the required role
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource.'
      });
    } catch (error) {
      // Pass any errors to the global error handler
      next(error);
    }
  };
};

/**
 * Middleware for routes that should only be accessible by admins
 */
export const adminOnly = rbacMiddleware(['admin']);

/**
 * Middleware for routes that should be accessible by both admins and PSRs
 */
export const adminOrPsr = rbacMiddleware(['admin', 'psr']);

/**
 * Middleware that checks if a user is accessing their own resource
 * or if they're an admin (who can access any resource)
 * @param {Function} getResourceUserId - Function that extracts the resource owner ID from the request
 * @returns {Function} Express middleware function
 */
export const ownerOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      // Admins can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      // Get the user ID associated with the requested resource
      const resourceUserId = await getResourceUserId(req);
      
      // Check if the authenticated user is the owner of the resource
      if (req.user.id === resourceUserId) {
        return next();
      }

      // If we reach here, the user doesn't have permission
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource.'
      });
    } catch (error) {
      next(error);
    }
  };
};

export default rbacMiddleware;
