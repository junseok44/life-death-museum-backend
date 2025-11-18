import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';

const protectedRouter = Router();

// Example of a protected route - requires authentication
protectedRouter.get('/secret', authenticateJWT, (req: Request, res: Response) => {
    const user = req.user!;
    
    res.json({
        message: `Hello ${user.name}! This is a protected route.`,
        userId: user.id,
        email: user.email,
        accessTime: new Date().toISOString()
    });
});

// Example of an optional auth route - works with or without token
// protectedRouter.get('/public-with-user', optionalAuth, (req: Request, res: Response) => {
//     if (req.user) {
//         res.json({
//             message: `Hello ${req.user.name}! You are logged in.`,
//             isAuthenticated: true,
//             userId: req.user.id
//         });
//     } else {
//         res.json({
//             message: 'Hello anonymous user! You can access this without login.',
//             isAuthenticated: false
//         });
//     }
// });

export { protectedRouter };
