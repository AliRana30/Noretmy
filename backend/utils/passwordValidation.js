/**
 * Password Validation Utility
 * Enforces strong password requirements for security
 */

// Password requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true
};

// Special characters allowed in passwords
const SPECIAL_CHARS = '@$!%*?&_#^(){}[]|;:,.<>~`+-=';

/**
 * Strong password regex:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 */
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#^(){}\[\]|;:,.<>~`+\-=])[A-Za-z\d@$!%*?&_#^(){}\[\]|;:,.<>~`+\-=]{8,128}$/;

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid: boolean, errors: string[], score: number }
 */
const validatePassword = (password) => {
  const errors = [];
  let score = 0;

  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password is required'],
      score: 0,
      feedback: 'Very Weak'
    };
  }

  // Length check
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  } else {
    score += 20;
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }

  // Uppercase check
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 20;
  }

  // Lowercase check
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 20;
  }

  // Number check
  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (/\d/.test(password)) {
    score += 20;
  }

  // Special character check
  const specialCharRegex = /[@$!%*?&_#^(){}\[\]|;:,.<>~`+\-=]/;
  if (PASSWORD_REQUIREMENTS.requireSpecialChar && !specialCharRegex.test(password)) {
    errors.push(`Password must contain at least one special character (${SPECIAL_CHARS})`);
  } else if (specialCharRegex.test(password)) {
    score += 20;
  }

  // Additional score for length
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Check for common patterns (weak passwords)
  const commonPatterns = [
    /^123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /letmein/i,
    /welcome/i,
    /admin/i,
    /(.)\1{2,}/, // Repeated characters (e.g., aaa, 111)
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      score = Math.max(0, score - 20);
      errors.push('Password contains common patterns that make it weak');
      break;
    }
  }

  // Determine feedback based on score
  let feedback;
  if (score < 40) {
    feedback = 'Very Weak';
  } else if (score < 60) {
    feedback = 'Weak';
  } else if (score < 80) {
    feedback = 'Moderate';
  } else if (score < 100) {
    feedback = 'Strong';
  } else {
    feedback = 'Very Strong';
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(100, score),
    feedback
  };
};

/**
 * Quick check if password matches strong password regex
 * @param {string} password - Password to check
 * @returns {boolean}
 */
const isStrongPassword = (password) => {
  return STRONG_PASSWORD_REGEX.test(password);
};

/**
 * Get password requirements as human-readable list
 * @returns {string[]}
 */
const getPasswordRequirements = () => {
  return [
    `At least ${PASSWORD_REQUIREMENTS.minLength} characters`,
    'At least one uppercase letter (A-Z)',
    'At least one lowercase letter (a-z)',
    'At least one number (0-9)',
    `At least one special character (${SPECIAL_CHARS})`
  ];
};

module.exports = {
  validatePassword,
  isStrongPassword,
  getPasswordRequirements,
  STRONG_PASSWORD_REGEX,
  PASSWORD_REQUIREMENTS,
  SPECIAL_CHARS
};
