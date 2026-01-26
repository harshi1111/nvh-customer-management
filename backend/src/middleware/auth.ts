import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { getCorsOrigins } from '../utils/corsConfig'; // ADD THIS

// Update AuthRequest interface
export interface AuthRequest extends Request {
  user?: User;
}

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'dee4bf44403a243bed5d7adde4af3e2a4cdbbcad7d917c4f490b387986da1d5445860072893f0a39cc3566c283a712a0f001c12d87f5ef76923f6ac4dc3d6df2';

// Helper function to send error with CORS headers
const sendErrorWithCors = (req: Request, res: Response, status: number, message: string) => {
  const origin = req.headers.origin;
  const allowedOrigins = getCorsOrigins(); // USE THE UTILITY
  
  if (origin && (allowedOrigins.includes(origin) || origin.includes('nvh-customer-management'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  return res.status(status).json({ error: message });
};

// Generate JWT Token
export const generateToken = (userId: string, role: string): string => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Authentication middleware
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      sendErrorWithCors(req, res, 401, 'Authentication required');
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.isActive) {
      sendErrorWithCors(req, res, 401, 'User not found or inactive');
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    sendErrorWithCors(req, res, 401, 'Invalid token');
  }
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendErrorWithCors(req, res, 401, 'Authentication required');
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendErrorWithCors(req, res, 403, 'Insufficient permissions');
      return;
    }

    next();
  };
};