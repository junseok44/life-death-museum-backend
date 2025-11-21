import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/passport';

export interface JWTPayload {
  id: string;
  email: string;
}

// Generate JWT token
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET);
};

