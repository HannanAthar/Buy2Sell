/**
 * Security utilities for input validation and sanitization.
 */

/**
 * Checks if the input string contains potentially malicious XSS payloads.
 * Detects <script> tags, javascript: protocols, and onc[event] handlers.
 * @param {string} input - The input string to check.
 * @returns {boolean} - True if XSS payload is detected, false otherwise.
 */
export const hasXSS = (input) => {
  if (!input || typeof input !== "string") return false;

  const xssPatterns = [
    /<script\b[^>]*>([\s\S]*?)<\/script>/gim,
    /javascript:/gim,
    /on\w+\s*=/gim, // Matches onclick=, onerror=, etc.
    /<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim,
    /<object\b[^>]*>([\s\S]*?)<\/object>/gim,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
};

/**
 * Basic sanitization to strip script tags and basic XSS vectors.
 * Note: For robust HTML sanitization, use a library like DOMPurify.
 * This is a lightweight safeguard for plain text inputs.
 * @param {string} input - The input string to sanitize.
 * @returns {string} - The sanitized string.
 */
export const sanitizeInput = (input) => {
  if (!input || typeof input !== "string") return input;
  
  // Basic HTML entity encoding for < > " '
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};
