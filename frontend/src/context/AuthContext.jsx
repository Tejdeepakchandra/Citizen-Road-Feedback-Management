import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// AXIOS INSTANCE
export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Add token to requests automatically
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 automatically
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      toast.error("Session expired. Please login again.");
    }
    return Promise.reject(err);
  }
);

// Auth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider
export const AuthProvider = ({ children }) => {
  const storedUser = localStorage.getItem("user");
  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if token is expired
  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        console.log("Token expired");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Invalid token:", error);
      return false;
    }
  };

  // Update user function
  const updateUser = useCallback((userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }, [user]);

  // Get redirect path based on role
  const getRedirectPath = useCallback((role) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'staff':
        return '/staff/dashboard';
      case 'citizen':
      case 'user':
      default:
        return '/dashboard';
    }
  }, []);

  // Load user on refresh
  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem("token");

      if (!savedToken) {
        setLoading(false);
        setIsInitialized(true);
        return;
      }

      // Check if token is valid
      if (!isTokenValid(savedToken)) {
        console.log("Token invalid on init, logging out");
        logout();
        setLoading(false);
        setIsInitialized(true);
        return;
      }

      try {
        setToken(savedToken);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;

        const endpoints = ["/auth/me", "/users/me", "/auth/profile"];
        let userData = null;
        
        for (const endpoint of endpoints) {
          try {
            const response = await axiosInstance.get(endpoint);
            if (response.data) {
              userData = response.data.data || response.data.user || response.data;
              if (userData) break;
            }
          } catch (endpointErr) {
            continue;
          }
        }

        if (userData) {
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        } else {
          console.error("Could not fetch user data from any endpoint");
          logout();
        }

      } catch (err) {
        console.error("Auth restore failed:", err.message);
        logout();
      }

      setLoading(false);
      setIsInitialized(true);
    };

    init();
  }, []);

  // --------------------------
  // 🟢 LOGIN FUNCTION - Updated with auto-redirect logic
  // --------------------------
  const login = async (email, password) => {
    try {
      const res = await axiosInstance.post("/auth/login", { email, password });

      const { token, user, redirectTo } = res.data;

      // Store token + user
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setToken(token);
      setUser(user);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      toast.success("Login successful!");

      // Return the redirect path based on role
      const redirectPath = redirectTo || getRedirectPath(user.role);
      
      return { 
        success: true, 
        data: res.data,
        user,
        role: user.role,
        redirectTo: redirectPath
      };
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
      throw err;
    }
  };

  // --------------------------
  // 🟢 LOGOUT
  // --------------------------
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);

    // Remove axios auth header
    delete axiosInstance.defaults.headers.common['Authorization'];

    toast.success("Logged out!");

    // Navigate to login page
    if (window.location.pathname !== '/login') {
      window.location.href = "/login";
    }

    return { success: true };
  }, []);

  // --------------------------
  // 🟢 UPDATE PROFILE
  // --------------------------
  const updateProfile = async (data) => {
    try {
      const endpoints = [
        `/users/${user?._id}`,
        `/auth/updatedetails`,
        `/auth/profile`,
        `/users/profile`
      ];
      
      let response = null;
      
      for (const endpoint of endpoints) {
        try {
          response = await axiosInstance.put(endpoint, data);
          if (response.data) break;
        } catch (endpointErr) {
          continue;
        }
      }

      if (!response || !response.data) {
        throw new Error("Could not update profile");
      }

      let updatedUser;
      if (response.data.data) {
        updatedUser = response.data.data;
      } else if (response.data.user) {
        updatedUser = response.data.user;
      } else {
        updatedUser = response.data;
      }

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast.success("Profile updated!");

      return response.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
      throw err;
    }
  };

  // --------------------------
  // 🟢 REGISTER FUNCTION
  // --------------------------
  const register = async (userData) => {
    try {
      const res = await axiosInstance.post("/auth/register", userData);

      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setToken(token);
      setUser(user);

      toast.success("Registration successful!");
      
      // Get redirect path for new user
      const redirectPath = getRedirectPath(user.role);
      
      return { 
        success: true, 
        data: res.data,
        user,
        redirectTo: redirectPath
      };
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
      throw err;
    }
  };

  // --------------------------
  // 🟢 CHANGE PASSWORD
  // --------------------------
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await axiosInstance.put("/auth/changepassword", {
        currentPassword,
        newPassword
      });

      toast.success("Password changed successfully!");
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Password change failed");
      throw err;
    }
  };

  const value = {
    user,
    token,
    loading,
    isInitialized,
    login,
    logout,
    register,
    updateProfile,
    updateUser,
    changePassword,
    isAuthenticated: !!token && isTokenValid(token),
    isAdmin: user?.role === "admin",
    isStaff: user?.role === "staff",
    isCitizen: user?.role === "citizen" || user?.role === "user",
    hasRole: (role) => user?.role === role,
    hasAnyRole: (roles) => roles.includes(user?.role),
    getRedirectPath
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;