import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcryptjs';
import { User } from '../models/UserModel';

// JWT Secret - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET!;

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
          invitation: user.invitation,
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
    async (payload, done) => {
      try {
        // Find user by ID from JWT payload
        const user = await User.findById(payload.id).select('-password').exec();
        if (!user) {
          return done(null, false);
        }

        return done(null, user as any);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id).select('-password').exec();
    done(null, user as any);
  } catch (error) {
    done(error, null);
  }
});

export { passport, JWT_SECRET };
