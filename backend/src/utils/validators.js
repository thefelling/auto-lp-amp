/**
 * Validate URL
 */
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate domain name
 */
function isValidDomain(domain) {
  const regex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  return regex.test(domain);
}

/**
 * Validate site name (hanya huruf, angka, spasi)
 */
function isValidSiteName(name) {
  const regex = /^[a-zA-Z0-9\s\-_]+$/;
  return regex.test(name) && name.length >= 2 && name.length <= 50;
}

/**
 * Validate title
 */
function isValidTitle(title) {
  return title && title.length >= 3 && title.length <= 200;
}

/**
 * Validate description
 */
function isValidDescription(desc) {
  return desc && desc.length >= 10 && desc.length <= 500;
}

/**
 * Validate email
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate password (min 6 chars)
 */
function isValidPassword(password) {
  return password && password.length >= 6;
}

/**
 * Validate username (alphanumeric, min 3 chars)
 */
function isValidUsername(username) {
  const regex = /^[a-zA-Z0-9_]{3,30}$/;
  return regex.test(username);
}

/**
 * Validate JSON
 */
function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize HTML (basic)
 */
function sanitizeHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '');
}

/**
 * Validate input object against schema
 */
function validateSchema(data, schema) {
  const errors = [];
  
  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];
    
    // Required
    if (rules.required && !value) {
      errors.push(`${key} is required`);
      continue;
    }
    
    if (value !== undefined && value !== null) {
      // Type check
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${key} must be ${rules.type}`);
      }
      
      // Min length
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${key} must be at least ${rules.minLength} characters`);
      }
      
      // Max length
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${key} must be at most ${rules.maxLength} characters`);
      }
      
      // Pattern
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${key} has invalid format`);
      }
      
      // Custom validator
      if (rules.validator && !rules.validator(value)) {
        errors.push(`${key} is invalid`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors,
  };
}

module.exports = {
  isValidUrl,
  isValidDomain,
  isValidSiteName,
  isValidTitle,
  isValidDescription,
  isValidEmail,
  isValidPassword,
  isValidUsername,
  isValidJson,
  sanitizeHtml,
  validateSchema,
};