import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Update AuthRequest interface
export interface AuthRequest extends Request {
  user?: User; // Use User class, not IUser interface
}

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to send error with CORS headers
const sendErrorWithCors = (res: Response, status: number, message: string) => {
  // Set CORS headers for error responses
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://nvh-customer-management.vercel.app',
    'https://nvh-customer-management-4k5at189h-harshi1111s-projects.vercel.app',
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
    { expiresIn: '7d' } // Token valid for 7 days
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
      return sendErrorWithCors(res, 401, 'Authentication required');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    
    // SEQUELIZE: Use findByPk instead of findById
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.isActive) {
      return sendErrorWithCors(res, 401, 'User not found or inactive');
    }

    req.user = user;
    next();
  } catch (error) {
    return sendErrorWithCors(res, 401, 'Invalid token');
  }
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return sendErrorWithCors(res, 401, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      return sendErrorWithCors(res, 403, 'Insufficient permissions');
    }

    next();
  };
};