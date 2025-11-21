import { Request, Response, NextFunction } from 'express';
import { passport } from '../config/passport';

// JWT Authentication middleware
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      // Log the error details for debugging
      console.error('JWT authentication error:', err);
      // Return detailed error in development, generic in production
      const message = process.env.NODE_ENV === 'development'
        ? `Authentication error: ${err.message || err}`
        : 'Authentication error';
      return res.status(500).json({ message });
    }

    if (!user) {
      return res.status(401).json({ 
        message: 'Access denied. Token is invalid or expired.' 
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Local authentication middleware for login
export const authenticateLocal = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      // Log the error for debugging purposes
      console.error('Authentication error:', err);
      // In development, include error details in the response
      const isDev = process.env.NODE_ENV === 'development';
      return res.status(500).json({
        message: isDev && err.message ? `Authentication error: ${err.message}` : 'Authentication error'
      });
    }

    if (!user) {
      return res.status(401).json({ 
        message: info?.message || 'Invalid credentials' 
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};
