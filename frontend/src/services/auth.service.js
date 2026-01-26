import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = import.meta.env.VITE_API_URL || 'https://citizen-road-backend.onrender.com/api';

class AuthService {
  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests if it exists
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Handle token refresh on 401 responses
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              const { accessToken } = response.data;
              
              this.setToken(accessToken);
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Register new user
  async register(userData) {
    try {
      const response = await this.api.post('/auth/register', userData);
      
      if (response.data.accessToken) {
        this.setToken(response.data.accessToken);
        this.setRefreshToken(response.data.refreshToken);
        this.setUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await this.api.post('/auth/login', credentials);
      
      if (response.data.accessToken) {
        this.setToken(response.data.accessToken);
        this.setRefreshToken(response.data.refreshToken);
        this.setUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Login with Google
  async loginWithGoogle(token) {
    try {
      const response = await this.api.post('/auth/google', { token });
      
      if (response.data.accessToken) {
        this.setToken(response.data.accessToken);
        this.setRefreshToken(response.data.refreshToken);
        this.setUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Refresh access token
  async refreshToken(refreshToken) {
    try {
      const response = await this.api.post('/auth/refresh-token', { refreshToken });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await this.api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      const response = await this.api.post('/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Verify email
  async verifyEmail(token) {
    try {
      const response = await this.api.post('/auth/verify-email', { token });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      const response = await this.api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update user profile
  async updateProfile(userData) {
    try {
      const response = await this.api.put('/auth/profile', userData);
      
      // Update user in local storage if updated
      if (response.data.user) {
        this.setUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await this.api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete account
  async deleteAccount(password) {
    try {
      const response = await this.api.delete('/auth/account', {
        data: { password },
      });
      
      if (response.data.success) {
        this.logout();
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Logout user
  logout() {
    // Clear all auth data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    
    // Clear any other app-specific storage
    localStorage.removeItem('persist:root');
    
    // Redirect to login
    window.location.href = '/login';
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      if (decoded.exp < currentTime) {
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  // Get user role
  getUserRole() {
    const user = this.getUser();
    return user?.role || 'user';
  }

  // Check if user has specific role
  hasRole(role) {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles) {
    const userRole = this.getUserRole();
    return roles.includes(userRole);
  }

  // Get token expiration time
  getTokenExpiration() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000; // Convert to milliseconds
    } catch (error) {
      return null;
    }
  }

  // Token management methods
  setToken(token) {
    localStorage.setItem('accessToken', token);
  }

  getToken() {
    return localStorage.getItem('accessToken');
  }

  setRefreshToken(token) {
    localStorage.setItem('refreshToken', token);
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Clear all auth data without redirect
  clearAuthData() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // Set remember me
  setRememberMe(remember) {
    if (remember) {
      const token = this.getToken();
      const refreshToken = this.getRefreshToken();
      const user = this.getUser();
      
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('user');
      
      if (token) localStorage.setItem('accessToken', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (user) localStorage.setItem('user', JSON.stringify(user));
    } else {
      const token = this.getToken();
      const refreshToken = this.getRefreshToken();
      const user = this.getUser();
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      if (token) sessionStorage.setItem('accessToken', token);
      if (refreshToken) sessionStorage.setItem('refreshToken', refreshToken);
      if (user) sessionStorage.setItem('user', JSON.stringify(user));
    }
  }

  // Error handling
  handleError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const message = error.response.data?.message || error.response.statusText;
      const status = error.response.status;
      
      return {
        message,
        status,
        data: error.response.data,
        isNetworkError: false,
      };
    } else if (error.request) {
      // The request was made but no response was received
      return {
        message: 'No response received from server. Please check your connection.',
        status: null,
        data: null,
        isNetworkError: true,
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      return {
        message: error.message || 'An unexpected error occurred.',
        status: null,
        data: null,
        isNetworkError: false,
      };
    }
  }

  // Validate password strength
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: this.calculatePasswordScore(password),
    };
  }

  // Calculate password score
  calculatePasswordScore(password) {
    let score = 0;
    
    // Length score
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    // Character type score
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Bonus for mixed case and special chars
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
    
    return Math.min(10, score); // Cap at 10
  }

  // Get password strength label
  getPasswordStrengthLabel(score) {
    if (score >= 8) return { label: 'Very Strong', color: 'text-green-600' };
    if (score >= 6) return { label: 'Strong', color: 'text-green-500' };
    if (score >= 4) return { label: 'Medium', color: 'text-yellow-500' };
    if (score >= 2) return { label: 'Weak', color: 'text-orange-500' };
    return { label: 'Very Weak', color: 'text-red-500' };
  }
}

// Create singleton instance
const authService = new AuthService();

export { AuthService, authService };