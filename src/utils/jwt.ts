import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/passport';

export interface JWTPayload {
  id: string;
  email: string;
  name?: string;
}

// Generate JWT token
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
  });
};

// Generate refresh token 
export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
};
