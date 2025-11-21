import { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/UserModel';
import { generateToken } from '../utils/jwt';
import { authenticateLocal, authenticateJWT } from '../middleware/auth';

type SignupBody = {
    name?: string;
    email: string;
    password: string;
};

type LoginBody = {
    email?: string;
    password?: string;
};

const signupRouter = Router();
const loginRouter = Router();
const profileRouter = Router();
const verifyRouter = Router();

signupRouter.post("/", async (req: Request<{}, {}, SignupBody>, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password ) {
            return res.status(400).json({ message: 'name, email and password are required' });
        }

        // basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'invalid email format' });
        }

        // check existing user
        const existing = await User.findOne({ email }).exec();
        if (existing) {
            return res.status(409).json({ message: 'email already in use' });
        }

        // hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // create user with default theme
        const user = new User({
            email,
            password: hashedPassword,
            theme: {
                floorColor: '#ffffff',
                wallColor: '#ffffff',
                weather: 'sunny'
            }
        });

        await user.save();

        // generate JWT token
        const token = generateToken({
            id: (user._id as any).toString(),
            email: user.email,
        });

        // return safe user data with token
        return res.status(201).json({
            id: user._id,
            email: user.email,
            token,
        });
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ message: 'internal server error' });
    }
});

// Login Router - using Passport Local Strategy
loginRouter.post("/", authenticateLocal, (req: Request, res: Response) => {
    try {
        // User is authenticated by Passport middleware
        const user = req.user!;

        // Generate JWT token
        const token = generateToken({
            id: user.id,
            email: user.email,
        });

        return res.status(200).json({
            id: user.id,
            email: user.email,
            token,
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'internal server error' });
    }
});

// Profile Route - Protected
profileRouter.get("/", authenticateJWT, (req: Request, res: Response) => {
    try {
        const user = req.user!;
        
        return res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            theme: user.theme,
            objectIds: user.objectIds,
            modifiedObjectIds: user.modifiedObjectIds,
            createdAt: user.createdAt,
        });
    } catch (err) {
        console.error('Profile error:', err);
        return res.status(500).json({ message: 'internal server error' });
    }
});

// Verify Token Route
verifyRouter.get("/", authenticateJWT, (req: Request, res: Response) => {
    try {
        const user = req.user!;
        
        return res.status(200).json({
            valid: true,
            user: {
                id: user.id,
                email: user.email,
            }
        });
    } catch (err) {
        console.error('Verify token error:', err);
        return res.status(500).json({ message: 'internal server error' });
    }
});

export { signupRouter, loginRouter, profileRouter, verifyRouter };