/**
 * API Client for Snowfun Nepal application
 * 
 * This module provides a configured Axios instance for making API requests
 * with automatic token management, request/response interceptors, and error handling.
 */

import axios from 'axios';
import toast from 'react-hot-toast';

// Get the base URL from environment variables or use default
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Create a configured axios instance
 */
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

/**
 * Request interceptor
 * - Adds authentication token to requests if available
 * - Handles request configuration
 */
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');
    
    // If token exists, add it to the authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Do something with request error
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * - Handles token refresh on 401 errors
 * - Processes response data
 * - Handles errors with appropriate messages
 */
api.interceptors.response.use(
  (response) => {
    // Return successful response data
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors (expired token)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          // No refresh token, force logout
          handleLogout();
          return Promise.reject(error);
        }
        
        // Attempt to refresh the token
        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refreshToken
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Store new tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Update authorization header and retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout user
        console.error('Token refresh failed:', refreshError);
        handleLogout();
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other errors
    handleApiError(error);
    return Promise.reject(error);
  }
);

/**
 * Handle API errors with appropriate user feedback
 * @param {Error} error - The error object from axios
 */
const handleApiError = (error) => {
  let message = 'An unexpected error occurred';
  
  if (error.response) {
    // Server responded with an error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        message = data.message || 'Invalid request';
        break;
      case 401:
        message = 'Authentication required. Please log in again.';
        break;
      case 403:
        message = 'You do not have permission to perform this action';
        break;
      case 404:
        message = 'The requested resource was not found';
        break;
      case 422:
        message = data.message || 'Validation failed';
        break;
      case 500:
        message = 'Server error. Please try again later';
        break;
      default:
        message = data.message || `Error ${status}: Something went wrong`;
    }
  } else if (error.request) {
    // Request was made but no response received
    message = 'No response from server. Please check your connection';
  }
  
  // Show error toast if not a canceled request
  if (!axios.isCancel(error)) {
    toast.error(message);
  }
};

/**
 * Handle user logout
 * Clears tokens and redirects to login page
 */
const handleLogout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Only redirect if we're in the browser environment
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

/**
 * Helper methods for common API operations
 */
export const apiHelpers = {
  /**
   * Upload a file to the server
   * @param {string} endpoint - API endpoint
   * @param {File} file - File to upload
   * @param {Object} additionalData - Additional form data
   * @returns {Promise} - Promise resolving to response data
   */
  uploadFile: async (endpoint, file, additionalData = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add any additional data to form data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });
    
    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
  
  /**
   * Download a file from the server
   * @param {string} endpoint - API endpoint
   * @param {string} filename - Name to save the file as
   * @returns {Promise} - Promise resolving when download completes
   */
  downloadFile: async (endpoint, filename) => {
    const response = await api.get(endpoint, {
      responseType: 'blob',
    });
    
    // Create download link and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

export default api;
