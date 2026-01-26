import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://citizen-road-backend.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Debug: Log token being sent (remove in production)
      if (import.meta.env.DEV) {
        console.log('🔑 Token sent with request to:', config.url);
      }
    } else {
      if (import.meta.env.DEV) {
        console.warn('⚠️ No token found in localStorage for request to:', config.url);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('❌ Unauthorized (401):', error.response?.data?.message);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);



// ===================== REPORT API =====================
export const reportAPI = {
  // Existing endpoints...
  // report form
  createReport: (formData) => {
    return api.post("/reports", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getReports: (params = {}) => api.get("/reports", { params }),
//Report Details
  getReportById: (id) => api.get(`/reports/${id}`),

  getReportDetail: (id) => api.get(`/reports/${id}`),
 //My Reports
  getMyReports: () => api.get("/reports/user/myreports"),

  updateReport: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/reports/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put(`/reports/${id}`, data);
  },
//Report detail
  deleteReport: (id) => api.delete(`/reports/${id}`),

  updateStatus: (id, status, description = "") =>
    api.put(`/reports/${id}/status`, { status, description }),

  addProgress: (id, formData) =>
    api.post(`/reports/${id}/progress`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  upvoteReport: (id) => api.put(`/reports/${id}/upvote`),

  addComment: (id, comment) =>
    api.post(`/reports/${id}/comments`, { text: comment }),

 assignReport: async (reportId, staffId, additionalData = {}) => {
  return api.put(`/reports/${reportId}/assign`, {  // ✅ Changed from axios.put to api.put
    staffId: staffId,
    dueDate: additionalData.dueDate,
    notes: additionalData.notes
  });
},

  updateProgress: (id, formData) =>
    api.put(`/reports/${id}/progress`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  completeReport: (id, completionData, formData) => {
    if (formData) {
      return api.put(`/reports/${id}/complete`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.put(`/reports/${id}/complete`, completionData);
  },

  getStats: () => api.get("/reports/stats"),

  getCategoryStats: () => api.get("/reports/stats/categories"),

  getNearbyReports: (lat, lng, radius = 5) =>
    api.get("/reports/nearby", { params: { lat, lng, radius } }),   // not using right now

  // NEW ENDPOINTS FOR ISSUE MANAGEMENT
  // Get reports by category
  getReportsByCategory: (category, params = {}) =>
    api.get(`/reports/category/${category}`, { params }),

  // Get staff performance
  getStaffPerformance: () => api.get("/reports/staff/performance"),

  // Update progress


  // Bulk assign reports
  bulkAssignReports: (reportIds, staffId) =>
    api.post("/reports/bulk-assign", { reportIds, staffId }),

  // Get report timeline/activity
  getReportTimeline: (id) => api.get(`/reports/${id}/timeline`),
  

  // Export reports
  exportReports: (params = {}) =>
    api.get("/reports/export", {
      params,
      responseType: "blob",
    }),
    approveCompletion: async (reportId, adminNotes) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await axios.put(
        `${API_BASE_URL}/reports/${reportId}/approve`,
        { adminNotes },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response;
    } catch (error) {
      console.error('Approve API Error:', error);
      throw error;
    }
  },

  rejectCompletion: async (reportId, rejectionReason) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await axios.put(
        `${API_BASE_URL}/reports/${reportId}/reject`,
        { rejectionReason },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response;
    } catch (error) {
      console.error('Reject API Error:', error);
      throw error;
    }
  }
    
};

// ===================== AUTH API =====================
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getMe: () => api.get("/auth/me"),
  updateProfile: (userData) => api.put("/auth/updatedetails", userData),
  forgotPassword: (email) => api.post("/auth/forgotpassword", { email }),
  resetPassword: (token, password) =>
    api.put(`/auth/resetpassword/${token}`, { password }),
  logout: () => api.post("/auth/logout"),
};

// ===================== DASHBOARD API =====================
// In your api.js file
export const dashboardAPI = {
  getCitizenDashboard: () => api.get("/dashboard/citizen"),
  getCitizenStats: () => {
    return api.get("/dashboard/citizen");
  },
  getAdminStats: () => api.get("/dashboard/admin"),
  getStaffStats: () => api.get("/dashboard/staff"),
  getAnalytics: (period) =>
    api.get("/dashboard/analytics", { params: { period } }),

  // ✅ Use the existing endpoint that works
  getRecentActivities: () => {
    return api.get("/reports/user/myreports?limit=5");
  },
};
// ===================== STAFF API =====================
export const staffAPI = {
  // For admin access
  getAllStaff: (params = {}) => api.get("/staff", { params }),
  getStaffById: (id) => api.get(`/staff/${id}`),
  getStaffByCategory: (category) => api.get(`/staff/category/${category}`),
  getStaffPerformance: () => api.get("/staff/performance"),
  createStaff: (staffData) => api.post("/staff", staffData),
  updateStaff: (id, staffData) => api.put(`/staff/${id}`, staffData),
  deactivateStaff: (id) => api.put(`/staff/${id}/deactivate`),

  // For staff access (logged-in staff)
  getMyAssignedReports: (params = {}) => api.get("/staff/reports/assigned", { params }),
  updateReportProgress: (id, progressData) => 
    api.put(`/staff/reports/${id}/progress`, progressData),
  addProgressUpdate: (id, data) =>
  api.post(`/reports/${id}/progress`, data),

  markReportComplete: (id, completionData) =>
    api.put(`/staff/reports/${id}/complete`, completionData),
  getMyPerformance: () => api.get("/staff/my-performance"),
  getMyDashboard: () => api.get("/staff/dashboard"),
  getMyStats: () => api.get("/staff/mystats"),
  getMyTasks: (params = {}) => api.get("/staff/mytasks", { params }),
  getTaskDetails: (staffId, taskId) => api.get(`/staff/${staffId}/tasks/${taskId}`),
  updateTaskProgress: (taskId, data) => api.put(`/staff/tasks/${taskId}/progress`, data),
  uploadWorkImages: (taskId, formData) => api.post(`/staff/tasks/${taskId}/upload`, formData),
  // In services/api.js
completeTask: (taskId, data) =>
  api.put(`/staff/tasks/${taskId}/complete`, data),
   // Get staff preferences
  // getPreferences: () => api.get("/staff/preferences"),
  
  // // Save staff preferences
  // savePreferences: (preferencesData) => api.put("/staff/preferences", preferencesData),
  
  // Update staff profile (both user and staff info)
  updateProfile: (profileData) => api.put("/staff/profile", profileData),
  
  // Change staff password
  changePassword: (passwordData) => api.put("/staff/password", passwordData),
  
  // Export staff data
  exportData: (exportOptions) => api.post("/staff/export-data", exportOptions),
  
  // Clear work history
  clearHistory: () => api.delete("/staff/history"),
  
  // Delete staff account
  deleteAccount: (confirmationData) => api.delete("/staff/account", { data: confirmationData }),
  getStaffPreferences: () => api.get('/staff/preferences'),

  // Save staff preferences
  saveStaffPreferences: (data) => api.put('/staff/preferences', data),

  // Update staff notifications
  updateStaffNotifications: (data) => api.put('/staff/notifications', data),

  // Save all preferences at once
  saveAllStaffPreferences: (data) => api.put('/staff/save-all-preferences', data),


  getAssignedReportsForGallery: () => 
    api.get('/staff/reports/gallery-eligible'),
  
  uploadGalleryImages: (reportId, formData) => 
    api.post(`/staff/reports/${reportId}/gallery`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  getMyGalleryUploads: () => 
    api.get('/staff/gallery/uploads'),
  
  getGalleryUploadStats: () => 
    api.get('/staff/gallery/stats'),

};

// ===================== DONATION API =====================
// services/api.js - Add these donation API endpoints
export const donationAPI = {
  // Create donation order
  createOrder: async (donationData) => {
    // Support both old (amount only) and new (full object) format
    const data = typeof donationData === 'number' ? { amount: donationData } : donationData;
    return await api.post("/donations/create-order", data);
  },

  // Verify payment
  verifyPayment: async (paymentData) => {
    return await api.post("/donations/verify", paymentData);
  },

  // Get donation stats
  getStats: async () => {
    return await api.get("/donations/stats");
  },

  // Get donations list
  getDonations: async (params = {}) => {
    return await api.get("/donations", { params });
  },

  // Get user's donations
  getMyDonations: async () => {
    return await api.get("/donations/my");
  },

  // Get donation leaderboard
  getLeaderboard: async (period = "all") => {
    return await api.get("/donations/leaderboard", { params: { period } });
  },
};

// ===================== NOTIFICATION API =====================
export const notificationAPI = {
  getNotifications: (params = {}) => api.get("/notifications", { params }),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/read-all"),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  deleteAllNotifications: () => api.delete("/notifications/delete-all"),
  getPreferences: () => api.get("/notifications/preferences"),
  updatePreferences: (preferences) =>
    api.put("/notifications/preferences", preferences),

  // Real-time notifications
  subscribeToNotifications: (callback) => {
    // WebSocket or SSE implementation
    const ws = new WebSocket(`${API_URL.replace('http', 'ws')}/notifications/ws`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };
    return ws;
  },
};

// ===================== GALLERY API =====================
// export const galleryAPI = {
//   // Get all gallery items/transformations
//   getGallery: (params = {}) => api.get("/gallery", { params }),

//   // Get single gallery item
//   getGalleryItem: (id) => api.get(`/gallery/${id}`),

//   // Create new gallery item
//   createGalleryItem: (formData) =>
//     api.post("/gallery", formData, {
//       headers: { "Content-Type": "multipart/form-data" },
//     }),

//   // Update gallery item
//   updateGalleryItem: (id, formData) =>
//     api.put(`/gallery/${id}`, formData, {
//       headers: { "Content-Type": "multipart/form-data" },
//     }),

//   // Delete gallery item
//   deleteGalleryItem: (id) => api.delete(`/gallery/${id}`),

//   // Get transformations (alias for getGallery)
//   getTransformations: (params) => api.get("/gallery", { params }),

//   // Get single transformation
//   getTransformation: (id) => api.get(`/gallery/${id}`),

//   // Create transformation
//   createTransformation: (formData) =>
//     api.post("/gallery", formData, {
//       headers: { "Content-Type": "multipart/form-data" },
//     }),

//   // Update transformation
//   updateTransformation: (id, formData) =>
//     api.put(`/gallery/${id}`, formData, {
//       headers: { "Content-Type": "multipart/form-data" },
//     }),

//   // Delete transformation
//   deleteTransformation: (id) => api.delete(`/gallery/${id}`),

//   // Approve transformation
//   approveTransformation: (id) => api.put(`/gallery/${id}/approve`),

//   // Get pending transformations
//   getPendingTransformations: (params = {}) =>
//     api.get("/gallery/pending", { params }),

//   // Get featured transformations
//   getFeaturedTransformations: (limit = 6) =>
//     api.get("/gallery/featured", { params: { limit } }),

//   // Get transformations by category
//   getTransformationsByCategory: (category, params = {}) =>
//     api.get(`/gallery/category/${category}`, { params }),

//   // Get transformations by status
//   getTransformationsByStatus: (status, params = {}) =>
//     api.get(`/gallery/status/${status}`, { params }),
// };

// ===================== FEEDBACK API =====================
export const feedbackAPI = {
  getAllFeedback: () => api.get("/feedback"),
  getMyFeedback: () => api.get("/feedback/my"), // ✅ ADD THIS
  getFeedbackByReport: (reportId) => api.get(`/feedback/report/${reportId}`),
  createFeedback: (data) => api.post("/feedback", data),
  updateFeedback: (id, data) => api.put(`/feedback/${id}`, data),
  deleteFeedback: (id) => api.delete(`/feedback/${id}`),
};

// ===================== USER API =====================
export const userAPI = {
  // Get user profile
  getUserProfile: (id) => api.get(`/users/${id}`),

  // Update user profile
  updateUserProfile: (id, data) => api.put(`/users/${id}`, data),

  // Change password
  changePassword: (id, data) => api.put(`/users/${id}/password`, data),

  // Upload profile picture
  uploadProfilePicture: (id, formData) =>
    api.post(`/users/${id}/profile-picture`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Get user activity
  getUserActivity: (id, params = {}) =>
    api.get(`/users/${id}/activity`, { params }),

  // Get user reports
  getUserReports: (id, params = {}) =>
    api.get(`/users/${id}/reports`, { params }),

  // Get user donations
  getUserDonations: (id, params = {}) =>
    api.get(`/users/${id}/donations`, { params }),

  syncUserStats: (userId) => api.put(`/users/${userId}/sync-stats`),
};

// In your existing api.js file, add these admin endpoints:

// ===================== ADMIN API =====================
export const adminAPI = {
  // Dashboard
  getDashboard: () => api.get("/admin/dashboard"),

  // Users
  getAllUsers: (params) => api.get("/admin/users", { params }),
  createUser: (userData) => api.post("/admin/users", userData),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  toggleUserStatus: (id, isActive) =>
    api.put(`/admin/users/${id}/status`, { isActive }),
  updateUserRole: (id, roleData) =>
    api.put(`/admin/users/${id}/role`, roleData),

  // Image Approvals
  getPendingImages: (params) => api.get("/admin/images/pending", { params }),
  approveImage: (id, data) => api.put(`/admin/images/${id}/approve`, data),
  rejectImage: (id, data) => api.put(`/admin/images/${id}/reject`, data),

  // System
  getSystemHealth: () => api.get("/admin/system/health"),

  // Activity
  getAdminActivity: (params) => api.get("/admin/activity", { params }),

  // Financial
  getFinancialStats: () => api.get("/donations/stats/admin"),

  // Gallery
  getAllGallery: (params) => api.get("/gallery", { params }),
  updateGalleryItem: (id, data) => api.put(`/gallery/${id}`, data),
  deleteGalleryItem: (id) => api.delete(`/gallery/${id}`),
  featureImage: (id, featured) =>
    api.put(`/gallery/${id}/feature`, { featured }),

  // Reports (admin access) - UPDATED with needsReview support
  getAllReports: (params = {}) => {
    // Clean up params to only include supported ones
    const cleanParams = {
      limit: params.limit || 100,
      page: params.page || 1,
      // Only include supported params
      ...(params.status && { status: params.status }),
      ...(params.category && { category: params.category }),
      ...(params.priority && { priority: params.priority }),
      ...(params.needsReview !== undefined && { needsReview: params.needsReview }),
      // Search functionality
      ...(params.searchTerm && { search: params.searchTerm }),
    };
    
    console.log('Sending reports params:', cleanParams);
    return api.get("/reports", { params: cleanParams });
  },
  
  // NEW: Completion approval endpoints
  approveStaffCompletion: (reportId, data) => 
    api.put(`/reports/${reportId}/approve`, data),
  
  rejectStaffCompletion: (reportId, data) => 
    api.put(`/reports/${reportId}/reject`, data),
  
  assignReport: (id, staffId, additionalData = {}) => 
    api.put(`/reports/${id}/assign`, { 
      staffId, 
      ...additionalData 
    }),
  
  updateReportStatus: (id, statusData) =>
    api.put(`/reports/${id}/status`, statusData),
  
  getReportsByCategory: (category, params = {}) =>
    api.get(`/reports/category/${category}`, { params }),
  
  getStaffPerformance: () => api.get("/reports/staff/performance"),
  
  bulkAssignReports: (reportIds, staffId) =>
    api.post("/reports/bulk-assign", { reportIds, staffId }),
  
  exportReports: (params = {}) =>
    api.get("/reports/export", {
      params,
      responseType: "blob",
    }),

  // Feedback (admin access)
  getAllFeedback: (params) => api.get("/feedback", { params }),

  // Staff management
  getAllStaff: (params = {}) => {
    const cleanParams = {
      limit: params.limit || 50,
      page: params.page || 1,
      ...(params.category && { category: params.category }),
      ...(params.isActive !== undefined && { isActive: params.isActive }),
    };
    return api.get("/staff", { params: cleanParams });
  },
  
  getStaffByCategory: (category) => api.get(`/staff/category/${category}`),
  
  createStaff: (staffData) => api.post("/staff", staffData),
  
  updateStaff: (id, staffData) => api.put(`/staff/${id}`, staffData),
  
  deactivateStaff: (id) => api.put(`/staff/${id}/deactivate`),

  // User management
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response;
    } catch (error) {
      try {
        const response = await api.get(`/users/${userId}`);
        return response;
      } catch (error2) {
        console.error('Both endpoints failed:', error2);
        throw error2;
      }
    }
  },

  getUserStats: async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}/stats`);
      return response;
    } catch (error) {
      try {
        const response = await api.get(`/users/${userId}/stats`);
        return response;
      } catch (error2) {
        return {
          data: {
            reports: 0,
            completedReports: 0,
            donations: 0,
            feedback: 0,
            totalDonated: 0,
          },
        };
      }
    }
  },

  getUserReports: async (userId) => {
    try {
      return await api.get(`/admin/users/${userId}/reports`);
    } catch (error) {
      return await api.get(`/reports/user/${userId}`);
    }
  },

  getUserDonations: async (userId) => {
    try {
      return await api.get(`/admin/users/${userId}/donations`);
    } catch (error) {
      return await api.get(`/donations/user/${userId}`);
    }
  },

  getUserFeedback: async (userId) => {
    try {
      return await api.get(`/admin/users/${userId}/feedback`);
    } catch (error) {
      return await api.get(`/feedback/user/${userId}`);
    }
  },

  // Add bulk operations
  bulkUpdateUsers: (userIds, data) =>
    api.put("/admin/users/bulk", { userIds, data }),

  // Export users
  exportUsers: (params) =>
    api.get("/admin/users/export", {
      params,
      responseType: "blob",
    }),

  // NEW: Issue Management specific endpoints
  getPendingReports: (params = {}) => 
    api.get("/reports", { params: { ...params, status: "pending" } }),
  
  getInProgressReports: (params = {}) => 
    api.get("/reports", { params: { ...params, status: "in_progress" } }),
  
  getCompletedReports: (params = {}) => 
    api.get("/reports", { params: { ...params, status: "completed" } }),
  
  // Analytics
  getReportAnalytics: (params = {}) =>
    api.get("/admin/analytics/reports", { params }),
  
  // System settings
  getSystemSettings: () => api.get("/admin/system/settings"),
  updateSystemSettings: (settings) => api.put("/admin/system/settings", settings),
  
  // Backup management
  createBackup: () => api.post("/admin/system/backup"),
  restoreBackup: (backupData) => api.post("/admin/system/restore", backupData),

  getPendingGalleryImages: (params = {}) => 
    api.get('/admin/gallery/pending', { params }),
  
  approveGalleryImage: (reportId, galleryImageId, data) => 
    api.put(`/admin/reports/${reportId}/gallery/${galleryImageId}/approve`, data),
  
  rejectGalleryImage: (reportId, galleryImageId, data) => 
    api.put(`/admin/reports/${reportId}/gallery/${galleryImageId}/reject`, data),
  
  getGalleryStats: () => 
    api.get('/admin/gallery/stats'),
  
  getGalleryAnalytics: () => 
    api.get('/admin/gallery/analytics'),
};
// In services/api.js - update galleryAPI
export const galleryAPI = {
  getApprovedGallery: (params = {}) => 
    api.get('/gallery/approved', { params }),
  
  getFeaturedGallery: () => 
    api.get('/gallery/featured'),
  
  getGalleryByCategory: (category) => 
    api.get(`/gallery/category/${category}`),
  
  likeGalleryImage: (galleryId) => 
    api.post(`/gallery/${galleryId}/like`),
  
  getGalleryDetails: (galleryId) => 
    api.get(`/gallery/${galleryId}`),
  
  // Add migration endpoint (for admin use)
  migrateGallery: () => 
    api.post('/gallery/migrate'),

   getUserGallery: (userId, params = {}) => 
    api.get(`/gallery/user/${userId}`, { params }),
  
  getUserGalleryStats: (userId) => 
    api.get(`/gallery/user/${userId}/stats`),
};
// ===================== UTILITY API =====================
export const utilityAPI = {
  // Upload file
  uploadFile: (formData) =>
    api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Get file
  getFile: (filename) => api.get(`/files/${filename}`),

  // Delete file
  deleteFile: (filename) => api.delete(`/files/${filename}`),

  // Get system stats
  getSystemStats: () => api.get("/system/stats"),

  // Get logs
  getLogs: (params = {}) => api.get("/system/logs", { params }),

  // Backup database
  backupDatabase: () => api.post("/system/backup"),

  // Restore database
  restoreDatabase: (formData) =>
    api.post("/system/restore", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};
// ===================== UTILITY FUNCTIONS =====================
export const issueManagementUtils = {
  // Filter reports by multiple criteria
  filterReports: (reports, filters) => {
    return reports.filter(report => {
      if (filters.status && filters.status !== 'all' && report.status !== filters.status) {
        return false;
      }
      if (filters.category && filters.category !== 'all' && report.category !== filters.category) {
        return false;
      }
      if (filters.priority && filters.priority !== 'all' && report.priority !== filters.priority) {
        return false;
      }
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const matchesTitle = report.title?.toLowerCase().includes(term);
        const matchesDescription = report.description?.toLowerCase().includes(term);
        const matchesUser = report.user?.name?.toLowerCase().includes(term);
        const matchesLocation = report.location?.address?.toLowerCase().includes(term);
        
        if (!(matchesTitle || matchesDescription || matchesUser || matchesLocation)) {
          return false;
        }
      }
      if (filters.startDate && new Date(report.createdAt) < new Date(filters.startDate)) {
        return false;
      }
      if (filters.endDate && new Date(report.createdAt) > new Date(filters.endDate)) {
        return false;
      }
      return true;
    });
  },

  // Sort reports
  sortReports: (reports, sortBy = 'createdAt', sortOrder = 'desc') => {
    return [...reports].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle nested properties
      if (sortBy === 'user') {
        aValue = a.user?.name;
        bValue = b.user?.name;
      }

      // Handle dates
      if (sortBy.includes('Date') || sortBy.includes('At')) {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  },

  // Format report for display
  formatReport: (report) => {
    return {
      ...report,
      displayStatus: report.status?.replace('_', ' '),
      displayCategory: report.category?.replace('_', ' '),
      formattedDate: new Date(report.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      relativeTime: getRelativeTime(report.createdAt),
    };
  },

  // Get staff members for a specific category
  getStaffForCategory: (staffList, category) => {
    return staffList.filter(staff => 
      staff.staffCategory === category && staff.isActive === true
    );
  },

  // Calculate report statistics
  calculateStats: (reports) => {
    return {
      total: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      assigned: reports.filter(r => r.status === 'assigned').length,
      inProgress: reports.filter(r => r.status === 'in_progress').length,
      completed: reports.filter(r => r.status === 'completed').length,
      highPriority: reports.filter(r => r.priority === 'high').length,
      mediumPriority: reports.filter(r => r.priority === 'medium').length,
      lowPriority: reports.filter(r => r.priority === 'low').length,
    };
  },
};

// Helper function for relative time
const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / (3600000 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
// ===================== EXPORT FUNCTIONS =====================
export const exportAPI = {
  // Export reports to CSV
  exportReportsToCSV: (reports) => {
    const headers = [
      'ID',
      'Title',
      'Description',
      'Category',
      'Status',
      'Priority',
      'User',
      'Email',
      'Location',
      'Created At',
      'Assigned To',
      'Progress',
      'Upvotes',
      'Comments',
    ];

    const csvContent = [
      headers.join(','),
      ...reports.map(report => [
        `"${report._id}"`,
        `"${report.title || ''}"`,
        `"${report.description || ''}"`,
        `"${report.category || ''}"`,
        `"${report.status || ''}"`,
        `"${report.priority || ''}"`,
        `"${report.user?.name || ''}"`,
        `"${report.user?.email || ''}"`,
        `"${report.location?.address || ''}"`,
        `"${new Date(report.createdAt).toISOString()}"`,
        `"${report.assignedTo?.name || ''}"`,
        `"${report.progress || 0}%"`,
        `"${report.upvotes || 0}"`,
        `"${report.comments || 0}"`,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reports_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Export reports to JSON
  exportReportsToJSON: (reports) => {
    const data = {
      exportDate: new Date().toISOString(),
      totalReports: reports.length,
      reports: reports.map(report => ({
        ...report,
        user: report.user ? {
          name: report.user.name,
          email: report.user.email,
        } : null,
        assignedTo: report.assignedTo ? {
          name: report.assignedTo.name,
          staffCategory: report.assignedTo.staffCategory,
        } : null,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reports_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Print reports
  printReports: (reports, title = 'Reports') => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #4CAF50; color: white; }
            tr:hover { background-color: #f5f5f5; }
            .status-pending { color: #ff9800; }
            .status-in_progress { color: #2196f3; }
            .status-completed { color: #4caf50; }
            .priority-high { color: #f44336; }
            .priority-medium { color: #ff9800; }
            .priority-low { color: #4caf50; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Priority</th>
                <th>User</th>
                <th>Created At</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              ${reports.map(report => `
                <tr>
                  <td>${report._id?.substring(0, 8)}...</td>
                  <td>${report.title || ''}</td>
                  <td>${report.category?.replace('_', ' ') || ''}</td>
                  <td class="status-${report.status}">${report.status?.replace('_', ' ') || ''}</td>
                  <td class="priority-${report.priority}">${report.priority || ''}</td>
                  <td>${report.user?.name || ''}</td>
                  <td>${new Date(report.createdAt).toLocaleDateString()}</td>
                  <td>${report.progress || 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p style="margin-top: 20px; color: #666;">
            Total Reports: ${reports.length} | Printed on: ${new Date().toLocaleString()}
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  },
};

// ===================== EXPORT ALL APIs =====================
export default api;
