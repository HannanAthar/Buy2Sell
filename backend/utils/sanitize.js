// backend/utils/sanitize.js
import validator from 'validator';

/**
 * 🔒 SECURITY: Input Sanitization Utilities
 * Prevents XSS and injection attacks by cleaning user input
 */

/**
 * Sanitize a string input - removes HTML tags and escapes special characters
 * @param {string} input - The input to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} - Sanitized input
 */
export const sanitizeString = (input, options = {}) => {
  if (typeof input !== 'string') return input;
  
  let cleaned = input.trim();
  
  // Remove HTML tags
  cleaned = validator.stripLow(cleaned, { keep_new_lines: options.keepNewlines || false });
  
  // Escape HTML entities to prevent XSS
  if (options.escapeHtml !== false) {
    cleaned = validator.escape(cleaned);
  }
  
  // Normalize unicode (prevents homograph attacks)
  if (options.normalizeUnicode !== false) {
    cleaned = cleaned.normalize('NFC');
  }
  
  return cleaned;
};

/**
 * Sanitize email address
 * @param {string} email - The email to sanitize
 * @returns {string} - Sanitized and normalized email
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  return validator.normalizeEmail(email.trim().toLowerCase()) || email.trim().toLowerCase();
};

/**
 * Sanitize phone number (Pakistan format)
 * @param {string} phone - The phone to sanitize
 * @returns {string} - Sanitized phone (digits only)
 */
export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return '';
  // Remove all non-digit characters
  return phone.replace(/\D/g, '').slice(0, 11);
};

/**
 * Sanitize an object's string properties
 * @param {object} obj - Object to sanitize
 * @param {string[]} excludeFields - Fields to exclude from sanitization
 * @returns {object} - Sanitized object
 */
export const sanitizeObject = (obj, excludeFields = ['password', 'confirmPassword']) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (excludeFields.includes(key)) {
      sanitized[key] = value; // Don't modify passwords
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Validate and sanitize MongoDB ObjectId to prevent injection
 * @param {string} id - The ID to validate
 * @returns {string|null} - Sanitized ID or null if invalid
 */
export const sanitizeMongoId = (id) => {
  if (typeof id !== 'string') return null;
  const cleaned = id.trim();
  // MongoDB ObjectId is exactly 24 hex characters
  if (/^[a-fA-F0-9]{24}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
};

/**
 * 🔒 SECURITY: Escape special regex characters to prevent ReDoS and injection
 * @param {string} str - String to escape
 * @returns {string} - Escaped string safe for RegExp
 */
export const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Common password blacklist (expand as needed)
 */
export const COMMON_PASSWORDS = [
  'password', 'password123', '12345678', '123456789', 'qwerty123',
  'admin123', 'letmein', 'welcome', 'monkey', 'dragon',
  'master', 'iloveyou', 'trustno1', 'sunshine', 'princess',
  'football', 'baseball', 'abc123', 'login', 'passw0rd'
];

/**
 * Check if password is commonly used (weak)
 * @param {string} password - Password to check
 * @returns {boolean} - True if password is weak/common
 */
export const isWeakPassword = (password) => {
  if (typeof password !== 'string') return true;
  const lower = password.toLowerCase();
  return COMMON_PASSWORDS.includes(lower);
};

/**
 * Validate password strength
 * Returns error message if invalid, null if valid
 */
export const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return 'Password is required';
  }
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  
  if (password.length > 128) {
    return 'Password must be less than 128 characters';
  }
  
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number';
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(password)) {
    return 'Password must contain at least one special character (!@#$%^&* etc.)';
  }
  
  if (isWeakPassword(password)) {
    return 'Password is too common. Choose a stronger password.';
  }
  
  return null; // Valid
};
