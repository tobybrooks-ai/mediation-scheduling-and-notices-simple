/**
 * Utility functions for handling dates in both Firestore timestamp and JavaScript Date formats
 */

/**
 * Converts a timestamp to a JavaScript Date object
 * Handles both Firestore timestamps and JavaScript Date objects
 * @param {*} timestamp - Firestore timestamp, Date object, or string
 * @returns {Date} JavaScript Date object
 */
export const toDate = (timestamp) => {
  if (!timestamp) return null;
  
  try {
    if (timestamp.seconds) {
      // Firestore timestamp
      return new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      // JavaScript Date object
      return timestamp;
    } else {
      // String or other format
      return new Date(timestamp);
    }
  } catch (error) {
    console.warn('Invalid timestamp:', timestamp, error);
    return null;
  }
};

/**
 * Formats a timestamp for display
 * @param {*} timestamp - Firestore timestamp, Date object, or string
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp, options = {}) => {
  if (!timestamp) return 'N/A';
  
  const date = toDate(timestamp);
  if (!date) return 'Invalid Date';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  };
  
  const formatOptions = { ...defaultOptions, ...options };
  
  try {
    return date.toLocaleDateString('en-US', formatOptions);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Invalid Date';
  }
};

/**
 * Formats a timestamp for display (date only)
 * @param {*} timestamp - Firestore timestamp, Date object, or string
 * @returns {string} Formatted date string
 */
export const formatDateOnly = (timestamp) => {
  return formatDate(timestamp, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Formats a timestamp for display (time only)
 * @param {*} timestamp - Firestore timestamp, Date object, or string
 * @returns {string} Formatted time string
 */
export const formatTimeOnly = (timestamp) => {
  return formatDate(timestamp, {
    hour: 'numeric',
    minute: '2-digit'
  });
};

/**
 * Formats a timestamp for display (relative time)
 * @param {*} timestamp - Firestore timestamp, Date object, or string
 * @returns {string} Relative time string (e.g., "2 hours ago")
 */
export const formatRelativeTime = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return 'N/A';
  
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    return formatDateOnly(timestamp);
  }
};

/**
 * Checks if a date is today
 * @param {*} timestamp - Firestore timestamp, Date object, or string
 * @returns {boolean} True if the date is today
 */
export const isToday = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return false;
  
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Checks if a date is within the last week
 * @param {*} timestamp - Firestore timestamp, Date object, or string
 * @returns {boolean} True if the date is within the last week
 */
export const isWithinLastWeek = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return false;
  
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return date >= weekAgo;
};

/**
 * Checks if a date is within the last month
 * @param {*} timestamp - Firestore timestamp, Date object, or string
 * @returns {boolean} True if the date is within the last month
 */
export const isWithinLastMonth = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return false;
  
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return date >= monthAgo;
};

/**
 * Sorts an array of objects by a timestamp field
 * @param {Array} array - Array of objects to sort
 * @param {string} field - Field name containing the timestamp
 * @param {string} order - 'asc' or 'desc' (default: 'desc')
 * @returns {Array} Sorted array
 */
export const sortByTimestamp = (array, field, order = 'desc') => {
  return [...array].sort((a, b) => {
    const dateA = toDate(a[field]) || new Date(0);
    const dateB = toDate(b[field]) || new Date(0);
    
    if (order === 'asc') {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  });
};