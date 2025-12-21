import api from './api';

export const userAPI = {
  // Get user by ID
  getUser: (userId) => api.get(`/users/${userId}`),
  
  // Update user profile - send only updatable fields
  updateUser: (userId, data) => {
    // Filter only allowed fields for update
    const allowedFields = [
      'name', 'phone', 'address', 'city', 'state', 'pincode',
      'avatar', 'preferences'
    ];
    
    const filteredData = {};
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        filteredData[field] = data[field];
      }
    });
    
    console.log('Filtered update data:', filteredData);
    return api.put(`/users/${userId}`, filteredData);
  },
  
  // Alternative: Use auth profile endpoint instead
  updateProfileViaAuth: (data) => api.put('/auth/updatedetails', data),
  
  // Get user activity
  getUserActivity: (userId) => {
    console.log('Fetching activity for user:', userId);
    return api.get(`/users/${userId}/activity`);
  },
  
  // Update user preferences
  updatePreferences: (userId, preferences) => 
    api.put(`/users/${userId}`, { preferences }),
  
  // Get user's reports
  getUserReports: (userId) => api.get(`/reports/user/${userId}`),
  
  // Get user's donations
  getUserDonations: () => api.get('/donations/my'),
  
  // Get user's feedback
  getUserFeedback: (userId) => api.get(`/feedback/user/${userId}`),
  
  // Change password
  changePassword: (data) => api.post('/auth/changepassword', data),
  
  // Upload avatar
  uploadAvatar: (userId, formData) => 
    api.post(`/users/${userId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};