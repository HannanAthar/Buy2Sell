// backend/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Designer from '../models/Designer.js';
import Reseller from '../models/Reseller.js';
import Admin from '../models/Admin.js';
import { checkSessionTimeout, updateUserActivity } from './sessionTimeout.js';

export const protect = (roles = []) => {
  return async (req, res, next) => {
    console.log('🔐 [protect] Middleware started');
    
    try {
      // 🔒 SECURITY: Get token from Authorization header first, then HttpOnly cookie
      // This ensures that explicit tokens (like adminToken) take precedence over session cookies
      let token;
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        console.log('✅ [protect] Token retrieved from Authorization header');
      } else if (req.cookies?.access_token) {
        token = req.cookies.access_token;
        console.log('✅ [protect] Token retrieved from access_token cookie');
      }
      
      if (!token) {
        console.log('❌ [protect] No token in cookie or header');
        return res.status(401).json({ error: 'No token provided.' });
      }

      console.log('✅ [protect] Token received:', token.substring(0, 20) + '...');

      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ [protect] Token decoded successfully, role:', decoded.role);
      } catch (err) {
        console.log('❌ [protect] Token verification failed:', err.message);
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({ error: 'Invalid token.' });
        }
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token expired.' });
        }
        return res.status(401).json({ error: 'Token verification failed.' });
      }

      // Check role authorization
      if (roles.length && !roles.includes(decoded.role)) {
        console.log(`❌ [protect] Unauthorized role. Required: ${roles}, Got: ${decoded.role}`);
        return res.status(403).json({ error: 'Unauthorized role.' });
      }

      console.log('✅ [protect] Role authorized:', decoded.role);
      console.log('🔍 [protect] Looking up user in database...');

      // Timeout wrapper for database query (10 seconds)
      const dbTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 10000);
      });

      // Find user based on role with timeout protection
      let user;
      try {
        user = await Promise.race([
          (async () => {
            let foundUser;
            switch (decoded.role) {
              case 'buyer':
                foundUser = await User.findById(decoded.id).select('-password');
                break;
              case 'designer':
                foundUser = await Designer.findById(decoded.id).select('-password');
                break;
              case 'reseller':
                foundUser = await Reseller.findById(decoded.id).select('-password');
                break;
              case 'admin':
                foundUser = await Admin.findById(decoded.id).select('-password');
                break;
              default:
                console.log('❌ [protect] Invalid user role:', decoded.role);
                throw new Error('Invalid user role');
            }
            return foundUser;
          })(),
          dbTimeout
        ]);
      } catch (dbError) {
        console.error('❌ [protect] Database query failed:', dbError.message);
        return res.status(500).json({ error: 'Database timeout. Please try again.' });
      }

      if (!user) {
        console.log('❌ [protect] User no longer exists');
        return res.status(401).json({ error: 'User no longer exists.' });
      }

      // Check if user account is active
      if (user.isActive !== undefined && !user.isActive) {
        console.log('❌ [protect] User account is deactivated');
        return res.status(401).json({ error: 'User account is deactivated.' });
      }

      console.log('✅ [protect] User authenticated:', user.email || user.name || user._id);

      // Attach user to request
      req.user = { ...decoded, ...user.toObject() };
      
      console.log('✅ [protect] Middleware complete, proceeding to route handler');
      
      // Check for session timeout
      return checkSessionTimeout(req, res, next);
    } catch (err) {
      console.error('❌ [protect] Auth middleware error:', err);
      return res.status(500).json({ error: 'Authentication failed.', message: err.message });
    }
  };
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    switch (decoded.role) {
      case 'buyer':
        user = await User.findById(decoded.id).select('-password');
        break;
      case 'designer':
        user = await Designer.findById(decoded.id).select('-password');
        break;
      case 'reseller':
        user = await Reseller.findById(decoded.id).select('-password');
        break;
      case 'admin':
        user = await Admin.findById(decoded.id).select('-password');
        break;
    }
    
    if (user && (user.isActive === undefined || user.isActive)) {
      req.user = { ...decoded, ...user.toObject() };
      // Update activity to keep session alive
      updateUserActivity(req.user);
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};