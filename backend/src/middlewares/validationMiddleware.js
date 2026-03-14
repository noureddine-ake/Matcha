/**
 * Validation middleware for password strength and registration
 * Implements OWASP password guidelines
 */

import { validatePasswordWithRecommendations } from '../utils/passwordValidator.js';

/**
 * Validate password strength middleware
 * Used in registration and password change endpoints
 */
export const validatePasswordMiddleware = (req, res, next) => {
  let password = req.body.password;
  if (password != null) password = password.toString();
  // ensure password is not an array or object
  if (!password) {
    return res.status(400).json({ 
      error: 'Password is required' 
    });
  }
  req.body.password = password;

  const validation = validatePasswordWithRecommendations(password);

  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Password does not meet security requirements',
      details: validation.errors,
    });
  }

  // Attach validation info to request for logging purposes
  req.passwordValidation = validation;
  next();
};

/**
 * Validate registration fields
 */
export const validateRegistrationMiddleware = (req, res, next) => {
  // trim and convert to strings to avoid malicious payloads
  const email = (req.body.email || '').toString().trim();
  const username = (req.body.username || '').toString().trim();
  const password = (req.body.password || '').toString();
  const firstName = (req.body.firstName || '').toString().trim();
  const lastName = (req.body.lastName || '').toString().trim();

  // overwrite sanitized values back into body
  req.body.email = email;
  req.body.username = username;
  req.body.password = password;
  req.body.firstName = firstName;
  req.body.lastName = lastName;

  // Check required fields
  if (!email || !username || !password || !firstName || !lastName) {
    return res.status(400).json({ 
      error: 'All fields are required',
      required: ['email', 'username', 'password', 'firstName', 'lastName']
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      error: 'Please enter a valid email address' 
    });
  }

  // Validate username length and format
  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({ 
      error: 'Username must be between 3 and 30 characters' 
    });
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ 
      error: 'Username can only contain letters, numbers, and underscores' 
    });
  }

  // Validate names
  if (firstName.length > 50 || lastName.length > 50) {
    return res.status(400).json({ 
      error: 'Names must be less than 50 characters' 
    });
  }

  if (!/^[a-zA-Z\s'-]+$/.test(firstName) || !/^[a-zA-Z\s'-]+$/.test(lastName)) {
    return res.status(400).json({ 
      error: 'Names can only contain letters, spaces, hyphens, and apostrophes' 
    });
  }

  next();
};

/**
 * Validate login fields
 */
export const validateLoginMiddleware = (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ 
      error: 'Username and password are required' 
    });
  }

  if (username.length < 3) {
    return res.status(400).json({ 
      error: 'Invalid username format' 
    });
  }

  next();
};

export default {
  validatePasswordMiddleware,
  validateRegistrationMiddleware,
  validateLoginMiddleware,
};
