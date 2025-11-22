/**
 * Format timestamp to readable date string
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch (e) {
    return timestamp;
  }
};

/**
 * Format file size to human-readable format
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get severity color
 */
export const getSeverityColor = (severity) => {
  const colors = {
    'High': '#dc3545',
    'Medium': '#ffc107',
    'Low': '#17a2b8',
    'Info': '#6c757d',
    'Critical': '#721c24'
  };
  return colors[severity] || '#6c757d';
};

/**
 * Get severity badge class
 */
export const getSeverityBadgeClass = (severity) => {
  const classes = {
    'High': 'badge-high',
    'Medium': 'badge-medium',
    'Low': 'badge-low',
    'Info': 'badge-info',
    'Critical': 'badge-critical'
  };
  return classes[severity] || 'badge-info';
};

/**
 * Format status text
 */
export const formatStatus = (status) => {
  if (!status) return 'Unknown';
  return status;
};

/**
 * Format confidence percentage
 */
export const formatConfidence = (confidence) => {
  if (typeof confidence === 'number') {
    return `${confidence}%`;
  }
  return confidence || 'N/A';
};

