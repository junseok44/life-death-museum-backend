import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcryptjs';
import { User } from '../models/UserModel';

// JWT Secret - should be in environment variables
const JWT_SECRET: string = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set. Please set it to a secure value.');
}

// Local Strategy for login
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email: string, password: string, done) => {
      try {
        // Find user by email
        const user = await User.findOne({ email }).exec();
        if (!user) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        // Return user (without password)
        const userResponse = {
          id: (user._id as any).toString(),
          name: user.name,
          email: user.email,
          theme: user.theme,
          objectIds: user.objectIds,
          modifiedObjectIds: user.modifiedObjectIds,
          createdAt: user.createdAt,
        };

        return done(null, userResponse as any);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// JWT Strategy for protected routes
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
    },
    (payload, done) => {
      // Directly return the payload as the user object
      if (!payload) {
        return done(null, false);
      }
      return done(null, payload);
    }
  )
);


export { passport, JWT_SECRET };
