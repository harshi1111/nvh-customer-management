import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Update AuthRequest interface
export interface AuthRequest extends Request {
  user?: User;
}

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to send error with CORS headers
const sendErrorWithCors = (req: Request, res: Response, status: number, message: string) => {
  // Set CORS headers for error responses
  const origin = req.headers.origin;
  const allowedOrigins = [
  'https://nvh-customer-management.vercel.app',
  'https://nvh-customer-management-4k5at189h-harshi1111s-projects.vercel.app',
  'https://nvh-customer-management-gtvw1nyb9-harshi1111s-projects.vercel.app',
  'https://nvh-customer-management-fcvqj9tr6-harshi1111s-projects.vercel.app', // ADD THIS
  'https://nvh-customer-management-s3yn-4zmxhccyf-harshi1111s-projects.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
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