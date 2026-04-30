/**
 * Password validation utility with common password dictionary check
 * Implements OWASP password guidelines and best practices
 */

// Most commonly used passwords to reject (from real breach data)
const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  'password1',
  'password12',
  'password123!',
  '123456',
  '123456789',
  '12345678',
  '1234567',
  'qwerty',
  'abc123',
  'letmein',
  'welcome',
  'monkey',
  '1q2w3e4r',
  'dragon',
  'master',
  'sunshine',
  'ashley',
  'bailey',
  'passw0rd',
  'shadow',
  '123123',
  '654321',
  'superman',
  'qazwsx',
  'michael',
  'football',
  'baseball',
  'access',
  'admin',
  'admin123',
  'root',
  'toor',
  '0000',
  '1111',
  '2222',
  '3333',
  '4444',
  '5555',
  '6666',
  '7777',
  '8888',
  '9999',
  'aaaaaa',
  'google',
  'twitter',
  'facebook',
  'iloveyou',
  'trustno1',
  '11111111',
  'test',
  'test123',
  'testing',
  'solarflare',
  'soccer',
  'hockey',
  'summer',
  'winter',
  'spring',
  'autumn',
  'princess',
  'starwars',
  'starwars123',
  'pokemon',
  'gaming',
  'gaming123',
  'playstation',
  'xbox',
  'nintendoswitch',
]);

/**
 * Check if password is in common passwords dictionary
 * @param {string} password - The password to check
 * @returns {boolean} - True if password is common, false otherwise
 */
export const isCommonPassword = (password: any) => {
  if (!password || typeof password !== 'string') {
    return false;
  }
  return COMMON_PASSWORDS.has(password.toLowerCase());
};

/**
 * Check password strength based on OWASP guidelines
 * Requirements:
 * - At least 8 characters (12+ recommended)
 * - Mix of uppercase and lowercase letters
 * - At least one number
 * - At least one special character
 * - Not a common password
 * @param {string} password - The password to validate
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export const validatePasswordStrength = (password: any) => {
  const errors = [];

  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password is required and must be a string'],
    };
  }

  // Check length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (password.length < 12) {
    errors.push('Password should be at least 12 characters for better security (you have ' + password.length + ')');
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for numbers
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special characters
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&* etc.)');
  }

  // Check against common passwords (this is a hard requirement)
  if (isCommonPassword(password)) {
    errors.push('This password is too common. Please choose a more unique password');
  }

  // Check for sequential numbers
  if (/0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210/.test(password)) {
    errors.push('Password contains sequential numbers - please avoid patterns');
  }

  // Check for repeated characters (more than 2 in a row)
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password contains repeated characters - please vary your characters');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.filter(e => !e.includes('should be at least 12')) || [], // Keep only critical errors for validation
  };
};

/**
 * Validate password with recommendations
 * Returns both validation result and helpful hints
 * @param {string} password - The password to validate
 * @returns {object} - { isValid: boolean, errors: string[], warnings: string[] }
 */
export const validatePasswordWithRecommendations = (password: any) => {
  const errors = [];
  const warnings = [];

  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password is required and must be a string'],
      warnings: [],
    };
  }

  // Critical requirements (errors)
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  if (isCommonPassword(password)) {
    errors.push('This password is too common. Please choose a more unique password');
  }

  // Recommendations (warnings)
  if (password.length < 12) {
    warnings.push('Consider using at least 12 characters for stronger security');
  }

  if (/0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210/.test(password)) {
    warnings.push('Avoid sequential numbers in your password');
  }

  if (/(.)\1{2,}/.test(password)) {
    warnings.push('Avoid repeating the same character multiple times');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export default {
  isCommonPassword,
  validatePasswordStrength,
  validatePasswordWithRecommendations,
};
