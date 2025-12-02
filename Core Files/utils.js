// Utility Functions for Employee Management System
// Comprehensive utility library for modals, notifications, data handling, and formatting

// ==================== Modal Management ====================

/**
 * Close any modal by ID
 * @param {string} modalId - The ID of the modal to close
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
    // Clear form inputs if modal contains a form
    const form = modal.querySelector("form");
    if (form) {
      form.reset();
    }
  }
}

/**
 * Open a modal by ID
 * @param {string} modalId - The ID of the modal to open
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "block";
  }
}

// Close modal when clicking outside of it
window.onclick = function (event) {
  const modals = document.querySelectorAll(".modal-overlay, .code-modal");
  modals.forEach((modal) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
};

// ==================== Notification System ====================

/**
 * Show a notification message
 * @param {string} message - The message to display
 * @param {string} type - Type of notification: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showNotification(message, type = "success", duration = 3000) {
  // Create or get notification container
  let container = document.getElementById("notificationContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "notificationContainer";
    container.style.cssText =
      "position: fixed; top: 20px; right: 20px; z-index: 9999;";
    document.body.appendChild(container);
  }

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;

  // Add icon based on type
  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    info: "fa-info-circle",
    warning: "fa-exclamation-triangle",
  };

  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px; padding: 15px 20px; background: white; border-radius: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-left: 4px solid; border-left-color: ${getColorForType(
      type
    )};">
      <i class="fas ${
        icons[type] || icons.info
      }" style="color: ${getColorForType(type)}; font-size: 18px;"></i>
      <span style="color: #333; font-size: 14px; font-weight: 500;">${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: #999; cursor: pointer; font-size: 18px; padding: 0; margin-left: 10px;">×</button>
    </div>
  `;

  container.appendChild(notification);

  // Auto remove after duration
  const timeoutId = setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = "slideOutRight 0.3s ease-out";
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }
  }, duration);

  // Allow manual dismiss to clear timeout
  notification.querySelector("button").addEventListener("click", () => {
    clearTimeout(timeoutId);
  });
}

function getColorForType(type) {
  const colors = {
    success: "#4CAF50",
    error: "#f44336",
    warning: "#ff9800",
    info: "#2196F3",
  };
  return colors[type] || colors.info;
}

// Add notification styles if not present
if (!document.getElementById("notification-styles")) {
  const style = document.createElement("style");
  style.id = "notification-styles";
  style.textContent = `
    @keyframes slideOutRight {
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
    .notification {
      margin-bottom: 10px;
      animation: slideInLeft 0.3s ease-out;
    }
    @keyframes slideInLeft {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}

// ==================== Date & Time Formatting ====================

/**
 * Format a date string to readable format
 * @param {string} dateString - ISO date string or date string
 * @returns {string} Formatted date (e.g., "Jan 15, 2024")
 */
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date string to readable date and time
 * @param {string} dateString - ISO date string or date string
 * @returns {string} Formatted date and time
 */
function formatDateTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format time only
 * @param {string} dateString - ISO date string or date string
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
function formatTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {string} dateString - ISO date string or date string
 * @returns {string} Relative time string
 */
function getRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return formatDate(dateString);
}

/**
 * Check if a date is overdue
 * @param {string} dateString - ISO date string or date string
 * @returns {boolean} True if date is in the past
 */
function isOverdue(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  return date < new Date();
}

// ==================== Data Validation ====================

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic validation)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone format
 */
function isValidPhone(phone) {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Sanitize input string to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeInput(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ==================== Local Storage Helpers ====================

/**
 * Save data to localStorage with error handling
 * @param {string} key - Storage key
 * @param {any} data - Data to store (will be JSON stringified)
 * @returns {boolean} True if successful
 */
function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    showNotification("Failed to save data locally", "error");
    return false;
  }
}

/**
 * Get data from localStorage with error handling
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if key not found
 * @returns {any} Retrieved data or default value
 */
function getFromLocalStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return defaultValue;
  }
}

/**
 * Remove data from localStorage
 * @param {string} key - Storage key
 */
function removeFromLocalStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error removing from localStorage:", error);
  }
}

/**
 * Clear all localStorage data
 */
function clearLocalStorage() {
  try {
    localStorage.clear();
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
}

// ==================== Array & Object Utilities ====================

/**
 * Sort array of objects by key
 * @param {Array} array - Array to sort
 * @param {string} key - Key to sort by
 * @param {boolean} ascending - Sort order (default: true)
 * @returns {Array} Sorted array
 */
function sortByKey(array, key, ascending = true) {
  return [...array].sort((a, b) => {
    const valA = a[key];
    const valB = b[key];

    if (valA < valB) return ascending ? -1 : 1;
    if (valA > valB) return ascending ? 1 : -1;
    return 0;
  });
}

/**
 * Group array of objects by key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} Grouped object
 */
function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}

/**
 * Filter array by search term across multiple keys
 * @param {Array} array - Array to filter
 * @param {string} searchTerm - Search term
 * @param {Array} keys - Keys to search in
 * @returns {Array} Filtered array
 */
function searchInArray(array, searchTerm, keys) {
  const term = searchTerm.toLowerCase();
  return array.filter((item) => {
    return keys.some((key) => {
      const value = item[key];
      return value && value.toString().toLowerCase().includes(term);
    });
  });
}

// ==================== Number Formatting ====================

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
  if (num == null || isNaN(num)) return "0";
  return num.toLocaleString("en-US");
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol (default: '$')
 * @returns {string} Formatted currency
 */
function formatCurrency(amount, currency = "$") {
  if (amount == null || isNaN(amount)) return `${currency}0.00`;
  return `${currency}${parseFloat(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} total - Total value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
function formatPercentage(value, total, decimals = 1) {
  if (total === 0) return "0%";
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

// ==================== String Utilities ====================

/**
 * Truncate string with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
function truncateString(str, maxLength) {
  if (!str || str.length <= maxLength) return str || "";
  return str.substring(0, maxLength) + "...";
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert string to title case
 * @param {string} str - String to convert
 * @returns {string} Title case string
 */
function toTitleCase(str) {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
}

// ==================== Download Utilities ====================

/**
 * Download data as JSON file
 * @param {any} data - Data to download
 * @param {string} filename - Filename
 */
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, filename);
}

/**
 * Download data as CSV file
 * @param {Array} data - Array of objects to convert to CSV
 * @param {string} filename - Filename
 */
function downloadCSV(data, filename) {
  if (!data || data.length === 0) {
    showNotification("No data to export", "warning");
    return;
  }

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          return typeof value === "string" && value.includes(",")
            ? `"${value}"`
            : value;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  downloadBlob(blob, filename);
}

/**
 * Download blob as file
 * @param {Blob} blob - Blob to download
 * @param {string} filename - Filename
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showNotification("File downloaded successfully", "success");
}

// ==================== Confirmation Dialog ====================

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback function if confirmed
 * @param {Function} onCancel - Callback function if cancelled
 * @returns {boolean} User's choice
 */
function showConfirmation(message, onConfirm, onCancel) {
  if (confirm(message)) {
    if (typeof onConfirm === "function") {
      onConfirm();
    }
    return true;
  } else {
    if (typeof onCancel === "function") {
      onCancel();
    }
    return false;
  }
}

// ==================== Loading Indicator ====================

/**
 * Show loading indicator
 * @param {string} message - Loading message
 */
function showLoading(message = "Loading...") {
  const loading = document.createElement("div");
  loading.id = "loading-indicator";
  loading.className = "loading-overlay";
  loading.innerHTML = `
    <div class="loading-content">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;
  document.body.appendChild(loading);
}

/**
 * Hide loading indicator
 */
function hideLoading() {
  const loading = document.getElementById("loading-indicator");
  if (loading) {
    loading.remove();
  }
}

// Add loading styles if not present
if (!document.getElementById("loading-styles")) {
  const style = document.createElement("style");
  style.id = "loading-styles";
  style.textContent = `
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    
    .loading-content {
      background: white;
      padding: 30px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    
    .loading-content .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .loading-content p {
      margin-top: 15px;
      color: #333;
      font-size: 16px;
      font-weight: 500;
    }
  `;
  document.head.appendChild(style);
}

// ==================== Debounce & Throttle ====================

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ==================== Copy to Clipboard ====================

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showNotification("Copied to clipboard!", "success");
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      showNotification("Copied to clipboard!", "success");
    } catch (err) {
      showNotification("Failed to copy to clipboard", "error");
    }
    document.body.removeChild(textArea);
  }
}

// ==================== Export All Utilities ====================

// Make utilities available globally
window.utils = {
  closeModal,
  openModal,
  showNotification,
  formatDate,
  formatDateTime,
  formatTime,
  getRelativeTime,
  isOverdue,
  isValidEmail,
  isValidPhone,
  sanitizeInput,
  saveToLocalStorage,
  getFromLocalStorage,
  removeFromLocalStorage,
  clearLocalStorage,
  sortByKey,
  groupBy,
  searchInArray,
  formatNumber,
  formatCurrency,
  formatPercentage,
  truncateString,
  capitalize,
  toTitleCase,
  downloadJSON,
  downloadCSV,
  downloadBlob,
  showConfirmation,
  showLoading,
  hideLoading,
  debounce,
  throttle,
  copyToClipboard,
};

console.log("✅ Utility functions loaded successfully");
