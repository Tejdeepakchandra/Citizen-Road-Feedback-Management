/**
 * Validate email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    score: calculatePasswordScore(password),
  };
};

/**
 * Calculate password score (0-100)
 */
export const calculatePasswordScore = (password) => {
  let score = 0;
  
  // Length score
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  
  // Character variety score
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[!@#$%^&*]/.test(password)) score += 15;
  
  // Bonus for no repeating patterns
  if (!/(.)\1{2,}/.test(password)) score += 10;
  
  return Math.min(score, 100);
};

/**
 * Validate URL
 */
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate pincode (Indian format)
 */
export const isValidPincode = (pincode) => {
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(pincode);
};

/**
 * Validate file type
 */
export const isValidFileType = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) => {
  return allowedTypes.includes(file.type);
};

/**
 * Validate file size
 */
export const isValidFileSize = (file, maxSizeMB = 5) => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

/**
 * Validate latitude
 */
export const isValidLatitude = (lat) => {
  return lat >= -90 && lat <= 90;
};

/**
 * Validate longitude
 */
export const isValidLongitude = (lng) => {
  return lng >= -180 && lng <= 180;
};

/**
 * Validate coordinates
 */
export const isValidCoordinates = (lat, lng) => {
  return isValidLatitude(lat) && isValidLongitude(lng);
};

/**
 * Validate report data
 */
export const validateReport = (data) => {
  const errors = {};
  
  if (!data.title?.trim()) {
    errors.title = 'Title is required';
  } else if (data.title.length < 5) {
    errors.title = 'Title must be at least 5 characters';
  }
  
  if (!data.description?.trim()) {
    errors.description = 'Description is required';
  } else if (data.description.length < 20) {
    errors.description = 'Description must be at least 20 characters';
  }
  
  if (!data.category) {
    errors.category = 'Category is required';
  }
  
  if (!data.severity) {
    errors.severity = 'Severity is required';
  }
  
  if (!data.location?.address?.trim()) {
    errors.location = 'Location address is required';
  }
  
  if (!data.location?.coordinates) {
    errors.location = 'Location coordinates are required';
  } else if (!isValidCoordinates(
    data.location.coordinates.lat,
    data.location.coordinates.lng
  )) {
    errors.location = 'Invalid coordinates';
  }
  
  if (!data.images || data.images.length === 0) {
    errors.images = 'At least one image is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate feedback data
 */
export const validateFeedback = (data) => {
  const errors = {};
  
  if (!data.rating || data.rating < 1 || data.rating > 5) {
    errors.rating = 'Rating must be between 1 and 5';
  }
  
  if (!data.comment?.trim()) {
    errors.comment = 'Comment is required';
  } else if (data.comment.length < 10) {
    errors.comment = 'Comment must be at least 10 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate donation data
 */
export const validateDonation = (data) => {
  const errors = {};
  
  if (!data.name?.trim()) {
    errors.name = 'Name is required';
  }
  
  if (!data.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Invalid email address';
  }
  
  if (!data.amount || data.amount < 10) {
    errors.amount = 'Minimum donation amount is ₹10';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Sanitize input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[&<>"'`=\/]/g, '') // Remove special characters
    .substring(0, 5000); // Limit length
};

/**
 * Validate date range
 */
export const isValidDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return start <= end;
};

/**
 * Validate OTP
 */
export const isValidOTP = (otp) => {
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
};

/**
 * Validate Aadhaar number
 */
export const isValidAadhaar = (aadhaar) => {
  const aadhaarRegex = /^\d{12}$/;
  return aadhaarRegex.test(aadhaar.replace(/\D/g, ''));
};

/**
 * Validate PAN number
 */
export const isValidPAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
};

/**
 * Validate GST number
 */
export const isValidGST = (gst) => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst.toUpperCase());
};

/**
 * Validate IFSC code
 */
export const isValidIFSC = (ifsc) => {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc.toUpperCase());
};

/**
 * Validate bank account number
 */
export const isValidAccountNumber = (accountNumber) => {
  const accountRegex = /^\d{9,18}$/;
  return accountRegex.test(accountNumber.replace(/\D/g, ''));
};

/**
 * Validate vehicle number (Indian format)
 */
export const isValidVehicleNumber = (vehicleNumber) => {
  const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/;
  return vehicleRegex.test(vehicleNumber.toUpperCase());
};

/**
 * Validate UPI ID
 */
export const isValidUPI = (upi) => {
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,}$/;
  return upiRegex.test(upi);
};

/**
 * Validate amount
 */
export const isValidAmount = (amount) => {
  const amountRegex = /^\d+(\.\d{1,2})?$/;
  return amountRegex.test(amount) && parseFloat(amount) > 0;
};

/**
 * Validate percentage
 */
export const isValidPercentage = (percentage) => {
  const percentageRegex = /^\d{1,3}(\.\d{1,2})?$/;
  const value = parseFloat(percentage);
  return percentageRegex.test(percentage) && value >= 0 && value <= 100;
};

/**
 * Validate time
 */
export const isValidTime = (time) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Validate date (YYYY-MM-DD)
 */
export const isValidDate = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};