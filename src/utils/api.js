const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Save a report to the database
 */
export const saveReport = async (reportData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save report');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Get all reports with pagination and filtering
 */
export const getReports = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.hostname) queryParams.append('hostname', params.hostname);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await fetch(`${API_BASE_URL}/reports?${queryParams}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single report by ID
 */
export const getReport = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Report not found');
      }
      throw new Error('Failed to fetch report');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a report
 */
export const deleteReport = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete report');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Get unique hostnames for filtering
 */
export const getHostnames = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/hostnames`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch hostnames');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Compare multiple reports
 */
export const compareReports = async (reportIds) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reportIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to compare reports');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Get statistics
 */
export const getStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/stats`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

