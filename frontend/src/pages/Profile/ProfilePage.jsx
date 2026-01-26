import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  Divider,
  Tab,
  Tabs,
  Paper,
  IconButton,
  InputAdornment,
  Alert,
  Snackbar,
  CircularProgress,
  Chip,
  Rating,
  Refresh,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Edit,
  Save,
  CameraAlt,
  History,
  BugReport,
  Paid,
  RateReview,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { reportAPI } from '../../services/api';
import { toast } from 'react-hot-toast';


const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [reports, setReports] = useState([]);
  const [donations, setDonations] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
      });
      // Fetch data immediately when user is available
      fetchUserData();
    }
  }, [user?.id, user?._id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      console.log('Fetching user data...');
      
      // Fetch reports
      try {
        const reportsRes = await reportAPI.getMyReports();
        console.log('Reports:', reportsRes);
        const reportsData = reportsRes.data?.data || reportsRes.data || [];
        setReports(Array.isArray(reportsData) ? reportsData : []);
      } catch (error) {
        console.error('Failed to fetch reports:', error.message);
        setReports([]);
      }
      
      // Fetch donations
      try {
        const donationsRes = await api.get('/donations/my');
        console.log('Donations:', donationsRes);
        const donationsData = donationsRes.data?.data || donationsRes.data || [];
        setDonations(Array.isArray(donationsData) ? donationsData : []);
      } catch (error) {
        console.error('Failed to fetch donations:', error.message);
        setDonations([]);
      }
      
      // Fetch feedback
      try {
        const feedbackRes = await api.get('/feedback/my');
        console.log('Feedback:', feedbackRes);
        const feedbackData = feedbackRes.data?.data || feedbackRes.data || [];
        setFeedbacks(Array.isArray(feedbackData) ? feedbackData : []);
      } catch (error) {
        console.error('Failed to fetch feedback:', error.message);
        setFeedbacks([]);
      }
      
    } catch (error) {
      console.error('Error in fetchUserData:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      
      // Create update data
      const updateData = {};
      const allowedFields = ['name', 'phone', 'address', 'city', 'state', 'pincode'];
      
      allowedFields.forEach(field => {
        if (formData[field] !== undefined && formData[field] !== '') {
          updateData[field] = formData[field];
        }
      });
      
      console.log('Update data:', updateData);
      
      // Direct API call to auth endpoint
      const response = await api.put('/auth/updatedetails', updateData);
      
      // Handle response
      let updatedUser;
      if (response.data?.data) {
        updatedUser = response.data.data;
      } else if (response.data?.user) {
        updatedUser = response.data.user;
      } else {
        updatedUser = response.data;
      }
      
      // Merge with existing user
      const mergedUser = { ...user, ...updatedUser };
      
      updateUser(mergedUser);
      localStorage.setItem('user', JSON.stringify(mergedUser));
      
      showSnackbar('Profile updated successfully!', 'success');
      setIsEditing(false);
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      showSnackbar(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (!user) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Create recent activity from fetched data
  const recentActivity = [
    ...reports.slice(0, 5).map(report => ({
      type: 'report',
      action: `Reported: ${report.title || 'Untitled Report'}`,
      status: report.status || 'pending',
      date: report.createdAt || new Date().toISOString(),
      item: report
    })),
    ...donations.slice(0, 5).map(donation => ({
      type: 'donation',
      action: `Donated ₹${donation.amount || 0}`,
      date: donation.createdAt || new Date().toISOString(),
      item: donation
    })),
    ...feedbacks.slice(0, 5).map(feedback => ({
      type: 'feedback',
      action: `Gave ${feedback.rating || 0} star feedback`,
      date: feedback.createdAt || new Date().toISOString(),
      item: feedback
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Debug Info - Remove in production */}
        <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="caption" color="info.contrastText">
            Debug: Reports: {reports.length}, Donations: {donations.length}, Feedback: {feedbacks.length}
          </Typography>
        </Box>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                My Profile
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your personal information and activity
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchUserData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* Left Sidebar - Profile Info */}
          <Grid item xs={12} md={4}>
            <Card sx={{ position: 'sticky', top: 20 }}>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                {/* Profile Picture */}
                <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                  <Avatar
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366F1&color=fff&size=120`}
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      mx: 'auto', 
                      mb: 2,
                      fontSize: '3rem',
                      bgcolor: '#6366F1'
                    }}
                  >
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                </Box>

                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {user.email}
                </Typography>
                
                <Chip 
                  label={user.role?.charAt(0).toUpperCase() + user.role?.slice(1)} 
                  color={
                    user.role === 'admin' ? 'error' : 
                    user.role === 'staff' ? 'primary' : 'default'
                  }
                  size="small"
                  sx={{ mb: 1 }}
                />
                
                {user.staffCategory && (
                  <Chip 
                    label={user.staffCategory} 
                    color="secondary"
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}

                <Typography variant="caption" color="text.secondary" display="block">
                  Member since {formatDate(user.createdAt)}
                </Typography>

                <Divider sx={{ my: 3 }} />

                {/* Quick Stats */}
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Your Contributions
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Reports Submitted:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {reports.length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Reports Resolved:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {reports.filter(r => r.status === 'completed' || r.status === 'resolved').length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Donations Made:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {donations.length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Donated:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      ₹{donations.reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab icon={<Person />} label="Personal Info" />
                <Tab icon={<History />} label="Activity" />
                <Tab icon={<BugReport />} label="Reports" />
                <Tab icon={<Paid />} label="Donations" />
                <Tab icon={<RateReview />} label="Feedback" />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {/* Personal Info Tab */}
                {activeTab === 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" fontWeight={600}>
                        Personal Information
                      </Typography>
                      <Button
                        variant={isEditing ? "contained" : "outlined"}
                        startIcon={isEditing ? <Save /> : <Edit />}
                        onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                        disabled={loading}
                      >
                        {isEditing ? (loading ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
                      </Button>
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          disabled={!isEditing || loading}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={true}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Email />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone Number"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing || loading}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Phone />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          disabled={!isEditing || loading}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocationOn />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="City"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          disabled={!isEditing || loading}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="State"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          disabled={!isEditing || loading}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Pincode"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          disabled={!isEditing || loading}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Activity Tab */}
                {activeTab === 1 && (
                  <Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Recent Activity
                    </Typography>
                    {recentActivity.length > 0 ? (
                      <Box>
                        {recentActivity.map((item, index) => (
                          <Card key={index} sx={{ mb: 2, p: 2, borderLeft: '4px solid', 
                            borderColor: 
                              item.type === 'report' ? '#4CAF50' : 
                              item.type === 'donation' ? '#2196F3' : '#FF9800'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ 
                                bgcolor: 
                                  item.type === 'report' ? '#4CAF50' : 
                                  item.type === 'donation' ? '#2196F3' : '#FF9800',
                                width: 40, 
                                height: 40 
                              }}>
                                {item.type === 'report' ? <BugReport /> : 
                                 item.type === 'donation' ? <Paid /> : <RateReview />}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body1">
                                  {item.action}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(item.date)}
                                </Typography>
                              </Box>
                              {item.status && (
                                <Chip 
                                  label={item.status} 
                                  size="small"
                                  color={
                                    item.status === 'completed' ? 'success' :
                                    item.status === 'pending' ? 'warning' : 'default'
                                  }
                                />
                              )}
                            </Box>
                          </Card>
                        ))}
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Avatar sx={{ 
                          width: 60, 
                          height: 60, 
                          mx: 'auto', 
                          mb: 2,
                          bgcolor: 'action.disabledBackground'
                        }}>
                          <History />
                        </Avatar>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No Activity Yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                          Start contributing to the community to see your activity here
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                          <Button 
                            variant="contained" 
                            href="/reports/new"
                            startIcon={<BugReport />}
                          >
                            Submit Report
                          </Button>
                          <Button 
                            variant="outlined" 
                            href="/donate"
                            startIcon={<Paid />}
                          >
                            Make Donation
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Reports Tab */}
                {activeTab === 2 && (
                  <Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Your Reports ({reports.length})
                    </Typography>
                    {reports.length > 0 ? (
                      <Box>
                        {reports.slice(0, 5).map((report, index) => (
                          <Card key={report._id || index} sx={{ mb: 2, p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {report.title || 'Untitled Report'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {report.category || 'No category'} • {report.status || 'Unknown status'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(report.createdAt)}
                                </Typography>
                              </Box>
                              <Chip 
                                label={report.status || 'Unknown'} 
                                size="small"
                                color={
                                  report.status === 'completed' ? 'success' :
                                  report.status === 'pending' ? 'warning' : 'default'
                                }
                              />
                            </Box>
                          </Card>
                        ))}
                        {reports.length > 5 && (
                          <Button 
                            fullWidth 
                            variant="outlined" 
                            href="/reports/my-reports"
                            sx={{ mt: 2 }}
                          >
                            View All Reports ({reports.length})
                          </Button>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Avatar sx={{ 
                          width: 60, 
                          height: 60, 
                          mx: 'auto', 
                          mb: 2,
                          bgcolor: 'action.disabledBackground'
                        }}>
                          <BugReport />
                        </Avatar>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No Reports Yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                          You haven't submitted any reports yet. Report issues in your area to help improve your community.
                        </Typography>
                        <Button 
                          variant="contained" 
                          href="/reports/new"
                          startIcon={<BugReport />}
                        >
                          Submit Your First Report
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Donations Tab */}
                {activeTab === 3 && (
                  <Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Your Donations ({donations.length})
                    </Typography>
                    {donations.length > 0 ? (
                      <Box>
                        {donations.slice(0, 5).map((donation, index) => (
                          <Card key={donation._id || index} sx={{ mb: 2, p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="h6" color="primary">
                                  ₹{donation.amount?.toLocaleString() || '0'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {donation.cause || 'General Fund'} • {formatDate(donation.createdAt)}
                                </Typography>
                                {donation.message && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                    "{donation.message}"
                                  </Typography>
                                )}
                              </Box>
                              <Chip 
                                label={donation.status || 'Completed'} 
                                color="success"
                                size="small"
                              />
                            </Box>
                          </Card>
                        ))}
                        {donations.length > 5 && (
                          <Button 
                            fullWidth 
                            variant="outlined" 
                            href="/donate"
                            sx={{ mt: 2 }}
                          >
                            View Donation History ({donations.length})
                          </Button>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Avatar sx={{ 
                          width: 60, 
                          height: 60, 
                          mx: 'auto', 
                          mb: 2,
                          bgcolor: 'action.disabledBackground'
                        }}>
                          <Paid />
                        </Avatar>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No Donations Yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                          You haven't made any donations yet. Support road safety initiatives in your community.
                        </Typography>
                        <Button 
                          variant="contained" 
                          href="/donate"
                          startIcon={<Paid />}
                        >
                          Make Your First Donation
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Feedback Tab */}
                {activeTab === 4 && (
                  <Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Your Feedback ({feedbacks.length})
                    </Typography>
                    {feedbacks.length > 0 ? (
                      <Box>
                        {feedbacks.slice(0, 5).map((feedback, index) => (
                          <Card key={feedback._id || index} sx={{ mb: 2, p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <Box>
                                <Rating value={feedback.rating || 0} readOnly size="small" />
                                {feedback.comment && (
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    "{feedback.comment}"
                                  </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                  {formatDate(feedback.createdAt)}
                                </Typography>
                              </Box>
                              {feedback.report && (
                                <Typography variant="caption" color="text.secondary">
                                  For: {feedback.report.title}
                                </Typography>
                              )}
                            </Box>
                          </Card>
                        ))}
                        {feedbacks.length > 5 && (
                          <Button 
                            fullWidth 
                            variant="outlined" 
                            href="/feedback"
                            sx={{ mt: 2 }}
                          >
                            View All Feedback ({feedbacks.length})
                          </Button>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Avatar sx={{ 
                          width: 60, 
                          height: 60, 
                          mx: 'auto', 
                          mb: 2,
                          bgcolor: 'action.disabledBackground'
                        }}>
                          <RateReview />
                        </Avatar>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No Feedback Given Yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                          You haven't given any feedback yet. Rate completed reports to help improve services.
                        </Typography>
                        <Button 
                          variant="contained" 
                          href="/reports/my-reports"
                          startIcon={<RateReview />}
                        >
                          View Completed Reports
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Refresh Button */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={fetchUserData}
            disabled={activityLoading}
            startIcon={activityLoading ? <CircularProgress size={20} /> : null}
          >
            {activityLoading ? 'Refreshing...' : 'Refresh Activity Data'}
          </Button>
        </Box>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </motion.div>
    </Container>
  );
};

export default ProfilePage;