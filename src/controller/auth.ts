import { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import {User} from '../models/UserModel';

type SignupBody = {
    name?: string;
    email?: string;
    password?: string;
};

type LoginBody = {
    email?: string;
    password?: string;
};

const signupRouter = Router();
const loginRouter = Router();

signupRouter.post("/", async (req: Request<{}, {}, SignupBody>, res: Response) => {
    try {
        const { name, email, password } = req.body;

        if (!email || !password || !name) {
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

        // create user
        const user = new User({
            name,
            email,
            password: hashedPassword,
        });

        await user.save();

        // return safe user data
        return res.status(201).json({
            id: user._id,
            name: user.name,
            email: user.email,
        });
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ message: 'internal server error' });
    }
});

// Login Router biz
loginRouter.post("/", async (req: Request<{}, {}, LoginBody>, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'email and password are required' });
        }

        // basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'invalid email format' });
        }

        const user = await User.findOne({ email }).exec();
        if (!user) {
            return res.status(401).json({ message: 'invalid credentials' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'invalid credentials' });
        }

        return res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'internal server error' });
    }
});

export { signupRouter, loginRouter };