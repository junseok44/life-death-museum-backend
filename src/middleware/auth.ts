import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

// JWT Authentication middleware
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      return res.status(500).json({ message: 'Authentication error' });
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

// Optional authentication middleware (doesn't fail if no token) ??
// export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
//   passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
//     if (err) {
//       return next(err);
//     }
    
//     if (user) {
//       req.user = user;
//     }
    
//     next();
//   })(req, res, next);
// };

// Local authentication middleware for login
export const authenticateLocal = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      return res.status(500).json({ message: 'Authentication error' });
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
