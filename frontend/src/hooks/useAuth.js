import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Initialize axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user from token
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          logout();
          return;
        }

        // Fetch user data from API
        const response = await axios.get('/api/auth/me');
        setUser(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to load user:', err);
        setError('Failed to load user profile');
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Login function
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;

      // Store token
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      toast.success('Login successful!');
      
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'staff') {
        navigate('/staff/dashboard');
      } else {
        navigate('/dashboard');
      }
      
      return { user, token };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Register function
  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/auth/register', userData);
      toast.success('Registration successful! Please login.');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
    toast.success('Logged out successfully');
  }, [navigate]);

  // Update profile
  const updateProfile = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put('/api/auth/profile', userData);
      setUser(response.data.user);
      toast.success('Profile updated successfully!');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Profile update failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Password change failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      const response = await axios.post('/api/auth/refresh-token');
      const { token } = response.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return token;
    } catch (err) {
      console.error('Token refresh failed:', err);
      logout();
      throw err;
    }
  }, [logout]);

  // Check permission
  const hasPermission = useCallback((requiredRole) => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Staff permissions
    if (user.role === 'staff') {
      const staffPermissions = ['view_reports', 'update_tasks', 'upload_images'];
      return staffPermissions.includes(requiredRole);
    }
    
    // Citizen permissions
    if (user.role === 'citizen' || user.role === 'user') {
      const citizenPermissions = [
        'create_reports',
        'view_own_reports',
        'give_feedback',
        'make_donations',
      ];
      return citizenPermissions.includes(requiredRole);
    }
    
    return false;
  }, [user]);

  // Check role
  const hasRole = useCallback((role) => {
    if (!user) return false;
    return user.role === role;
  }, [user]);

  // Check if user can access report
  const canAccessReport = useCallback((report) => {
    if (!user || !report) return false;
    
    // Admin can access all reports
    if (user.role === 'admin') return true;
    
    // Staff can access assigned reports
    if (user.role === 'staff' && report.assignedTo === user._id) {
      return true;
    }
    
    // Citizen can access their own reports
    if ((user.role === 'citizen' || user.role === 'user') && report.user === user._id) {
      return true;
    }
    
    return false;
  }, [user]);

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
    isCitizen: user?.role === 'citizen' || user?.role === 'user',
    
    // Methods
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshToken,
    hasPermission,
    hasRole,
    canAccessReport,
    
    // Utility functions
    clearError: () => setError(null),
  };
};