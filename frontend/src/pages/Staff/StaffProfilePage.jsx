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
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Edit,
  Save,
  Assignment,
  CheckCircle,
  Pending,
  ReportProblem,
  Schedule,
  TrendingUp,
  Work,
  Engineering,
  LocalPolice,
  Construction,
  Security,
  Assessment,
  TaskAlt,
  History,
  SupervisorAccount,
  Build,
  Refresh,
  ArrowForward,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api, { staffAPI } from '../../services/api';

const StaffProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    inReview: 0,
    needsRevision: 0,
  });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    employeeId: '',
    address: '',
  });

  // Staff categories and their icons
  const staffCategories = {
    'engineering': { icon: <Engineering />, color: '#1976d2', label: 'Engineering' },
    'maintenance': { icon: <Construction />, color: '#ed6c02', label: 'Maintenance' },
    'safety': { icon: <Security />, color: '#2e7d32', label: 'Safety' },
    'traffic': { icon: <LocalPolice />, color: '#9c27b0', label: 'Traffic' },
    'supervisor': { icon: <SupervisorAccount />, color: '#d32f2f', label: 'Supervisor' },
    'inspector': { icon: <Assessment />, color: '#0288d1', label: 'Inspector' },
    'pothole': { icon: <Construction />, color: '#795548', label: 'Pothole Repair' },
    'lighting': { icon: <Engineering />, color: '#FFD700', label: 'Lighting' },
    'drainage': { icon: <Engineering />, color: '#2196F3', label: 'Drainage' },
    'garbage': { icon: <Work />, color: '#4CAF50', label: 'Garbage' },
    'signboard': { icon: <Assessment />, color: '#9C27B0', label: 'Signboard' },
  };

  // FIX: Fetch fresh staff profile from backend IMMEDIATELY on page load (independent of context)
  const fetchStaffProfile = async () => {
    try {
      setProfileLoading(true);
      console.log('fetchStaffProfile: Starting to fetch staff profile...');
      
      // Get fresh staff data from backend using /auth/me endpoint
      const res = await api.get('/auth/me');
      console.log('fetchStaffProfile: /auth/me response:', res);
      
      // Extract user data from response - handle multiple response formats
      let freshUser;
      if (res?.data?.data) {
        freshUser = res.data.data;
      } else if (res?.data?.user) {
        freshUser = res.data.user;
      } else if (res?.data) {
        freshUser = res.data;
      }
      
      console.log('fetchStaffProfile: Extracted freshUser:', freshUser);
      
      if (freshUser && freshUser._id) {
        // Update auth context with fresh data
        updateUser(freshUser);
        console.log('fetchStaffProfile: Updated user context');
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(freshUser));
        console.log('fetchStaffProfile: Updated localStorage');
        
        // Update form data with complete profile
        const newFormData = {
          name: freshUser.name || '',
          email: freshUser.email || '',
          phone: freshUser.phone || '',
          department: freshUser.department || '',
          designation: freshUser.designation || '',
          employeeId: freshUser.employeeId || '',
          address: freshUser.address || '',
        };
        
        setFormData(newFormData);
      } else {
        console.warn('fetchStaffProfile: No valid user data received');
      }
    } catch (err) {
      console.error('fetchStaffProfile: Error fetching staff profile:', err);
      console.error('fetchStaffProfile: Error details:', err.response?.data || err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  // FIX: Fetch fresh staff profile IMMEDIATELY on component mount (no dependency on context)
  useEffect(() => {
    // Fetch staff profile and data right away
    fetchStaffProfile();
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    try {
      setDataLoading(true);
      
      // Use the staffAPI.getMyAssignedReports which works from StaffTasks.jsx
      const response = await staffAPI.getMyAssignedReports();
      console.log('Staff profile tasks response:', response.data);
      
      const tasksData = response.data.data || [];
      setTasks(tasksData);
      
      // Calculate stats from tasks data
      calculateStats(tasksData);
      
    } catch (error) {
      console.error('Failed to fetch staff data:', error);
      
      // Use mock data as fallback
      const mockTasks = generateMockTasks();
      setTasks(mockTasks);
      calculateStats(mockTasks);
      
      showSnackbar('Using demonstration data', 'info');
    } finally {
      setDataLoading(false);
    }
  };

  const calculateStats = (tasksData) => {
    if (!Array.isArray(tasksData)) return;
    
    const total = tasksData.length;
    const pending = tasksData.filter(t => t.status === 'assigned' || t.status === 'pending').length;
    const inProgress = tasksData.filter(t => t.status === 'in_progress').length;
    const inReview = tasksData.filter(t => 
      t.status === 'completed' && 
      t.needsReview === true
    ).length;
    const needsRevision = tasksData.filter(t => 
      t.status === 'in_progress' && 
      t.adminRejected === true
    ).length;
    const completed = tasksData.filter(t => 
      t.status === 'completed' && 
      t.adminApproved === true
    ).length;
    
    setStats({ total, pending, inProgress, completed, inReview, needsRevision });
  };

  const generateMockTasks = () => {
    const categories = ['pothole', 'lighting', 'drainage', 'garbage', 'signboard'];
    const priorities = ['low', 'medium', 'high'];
    const statuses = ['assigned', 'in_progress', 'completed'];
    
    return Array.from({ length: 6 }, (_, i) => ({
      _id: `mock-task-${i}`,
      reportId: `REP${1000 + i}`,
      title: `${categories[i % categories.length]} Issue at Location ${i + 1}`,
      category: categories[i % categories.length],
      priority: priorities[i % priorities.length],
      status: statuses[i % statuses.length],
      assignedAt: new Date(Date.now() - i * 86400000).toISOString(),
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      description: `Report about ${categories[i % categories.length]} issue at location ${i + 1}`,
      location: { 
        address: `Street ${i + 1}, Sector ${i + 2}, City` 
      },
      progress: i === 0 ? 0 : i === 1 ? 50 : i === 2 ? 100 : (i * 20) % 100,
      needsReview: i === 0,
      adminApproved: i === 2,
      adminRejected: i === 1,
      estimatedCompletion: i < 3 ? new Date(Date.now() + (i * 86400000)).toISOString() : null,
      images: i % 2 === 0 ? [{ url: 'https://via.placeholder.com/150' }] : [],
    }));
  };

  // FIX: Fetch data when tab changes (for Work Stats and Assigned Tasks tabs)
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Fetch task-related data when switching to tabs 1 (Work Stats) or 2 (Assigned Tasks)
    if ([1, 2].includes(newValue)) {
      fetchStaffData();
    }
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
      
      const updateData = {};
      const allowedFields = ['name', 'phone', 'address', 'department', 'designation', 'employeeId'];
      
      allowedFields.forEach(field => {
        if (formData[field] !== undefined && formData[field] !== '') {
          updateData[field] = formData[field];
        }
      });
      
      // Use your existing auth endpoint
      const response = await staffAPI.updateProfile(updateData);
      
      if (response.data?.success) {
        const updatedUser = { ...user, ...(response.data.data || response.data.user) };
        updateUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        showSnackbar('Profile updated successfully!', 'success');
        setIsEditing(false);
      }
      
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getCategoryInfo = (category) => {
    if (!category) return { icon: <Work />, color: '#757575', label: 'Staff' };
    const cat = category.toLowerCase();
    return staffCategories[cat] || { icon: <Work />, color: '#757575', label: category };
  };

  const getStatusIcon = (status, needsReview = false, adminApproved = false, adminRejected = false) => {
    if (needsReview === true && status === 'completed') {
      return <Pending color="warning" />;
    }
    if (adminRejected === true && status === 'in_progress') {
      return <ReportProblem color="error" />;
    }
    if (adminApproved === true && status === 'completed') {
      return <CheckCircle color="success" />;
    }
    
    switch (status) {
      case 'completed': return <CheckCircle color="success" />;
      case 'in_progress': return <Build color="warning" />;
      case 'assigned':
      case 'pending': return <Pending color="info" />;
      default: return <ReportProblem color="error" />;
    }
  };

  const getStatusColor = (status, needsReview = false, adminApproved = false, adminRejected = false) => {
    if (needsReview === true && status === 'completed') {
      return { bg: '#FFF3E0', color: '#F57C00' };
    }
    if (adminRejected === true && status === 'in_progress') {
      return { bg: '#FFEBEE', color: '#D32F2F' };
    }
    if (adminApproved === true && status === 'completed') {
      return { bg: '#E8F5E9', color: '#388E3C' };
    }
    
    switch (status) {
      case 'completed': return { bg: '#E8F5E9', color: '#388E3C' };
      case 'in_progress': return { bg: '#F3E5F5', color: '#7B1FA2' };
      case 'assigned':
      case 'pending': return { bg: '#E3F2FD', color: '#1976D2' };
      default: return { bg: '#F5F5F5', color: '#616161' };
    }
  };

  const getStatusText = (status, needsReview = false, adminApproved = false, adminRejected = false) => {
    if (needsReview === true && status === 'completed') {
      return 'In Review';
    }
    if (adminRejected === true && status === 'in_progress') {
      return 'Needs Revision';
    }
    if (adminApproved === true && status === 'completed') {
      return 'Completed ✓';
    }
    
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'assigned': return 'Assigned';
      case 'pending': return 'Pending';
      default: return status?.replace('_', ' ') || 'Unknown';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  // Calculate recent activity from tasks
  const getRecentActivity = () => {
    return tasks.slice(0, 5).map(task => {
      const statusColors = getStatusColor(task.status, task.needsReview, task.adminApproved, task.adminRejected);
      const statusText = getStatusText(task.status, task.needsReview, task.adminApproved, task.adminRejected);
      
      return {
        id: task._id,
        type: task.status,
        description: `${statusText}: ${task.title}`,
        timestamp: task.assignedAt || task.createdAt,
        reportId: task.reportId,
        colors: statusColors,
        icon: getStatusIcon(task.status, task.needsReview, task.adminApproved, task.adminRejected)
      };
    });
  };

  if (profileLoading || !user) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>Loading profile...</Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  const categoryInfo = getCategoryInfo(user.staffCategory);
  const recentActivity = getRecentActivity();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Demo Notice */}
        {tasks.length > 0 && tasks[0]._id?.includes('mock-task') && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Note:</strong> Using demonstration data. Configure backend endpoints for real data.
          </Alert>
        )}

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              sx={{
                width: 60,
                height: 60,
                bgcolor: categoryInfo.color,
                fontSize: '1.5rem',
              }}
            >
              {categoryInfo.icon}
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Staff Profile
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {categoryInfo.label} • {user.designation || 'Staff Member'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* Left Sidebar - Profile Info */}
          <Grid item xs={12} md={4}>
            <Card sx={{ position: 'sticky', top: 20 }}>
              <CardContent sx={{ p: 4 }}>
                {/* Profile Header */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Avatar
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=${categoryInfo.color.replace('#', '')}&color=fff&size=120`}
                    sx={{
                      width: 100,
                      height: 100,
                      mx: 'auto',
                      mb: 2,
                      fontSize: '2.5rem',
                      bgcolor: categoryInfo.color,
                    }}
                  >
                    {user.name?.charAt(0)?.toUpperCase() || 'S'}
                  </Avatar>
                  
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {user.name}
                  </Typography>
                  
                  <Chip
                    icon={categoryInfo.icon}
                    label={categoryInfo.label.toUpperCase()}
                    sx={{
                      bgcolor: categoryInfo.color,
                      color: 'white',
                      fontWeight: 600,
                      mb: 1,
                    }}
                  />
                  
                  {user.designation && (
                    <Typography variant="subtitle2" color="text.secondary">
                      {user.designation}
                    </Typography>
                  )}
                  
                  {user.department && (
                    <Typography variant="body2" color="text.secondary">
                      {user.department}
                    </Typography>
                  )}
                  
                  {user.employeeId && (
                    <Typography variant="caption" color="text.secondary">
                      ID: {user.employeeId}
                    </Typography>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Quick Stats */}
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Work Summary
                </Typography>
                <Box sx={{ textAlign: 'left' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Total Tasks:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {stats.total}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Completed:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {stats.completed}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">In Progress:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {stats.inProgress}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Efficiency:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Quick Actions */}
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="contained"
                    href="/staff/dashboard"
                    startIcon={<Assignment />}
                    fullWidth
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="outlined"
                    href="/staff/tasks"
                    startIcon={<TaskAlt />}
                    fullWidth
                  >
                    My Tasks
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={fetchStaffData}
                    startIcon={dataLoading ? <CircularProgress size={20} /> : <Refresh />}
                    fullWidth
                    disabled={dataLoading}
                  >
                    {dataLoading ? 'Refreshing...' : 'Refresh Data'}
                  </Button>
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
                <Tab icon={<Person />} label="Profile" />
                <Tab icon={<Assignment />} label="Work Stats" />
                <Tab icon={<TaskAlt />} label="Assigned Tasks" />
                <Tab icon={<History />} label="Activity" />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {/* Profile Tab */}
                {activeTab === 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" fontWeight={600}>
                        Professional Information
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
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          disabled={true}
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
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Employee ID"
                          name="employeeId"
                          value={formData.employeeId}
                          onChange={handleInputChange}
                          disabled={!isEditing || loading}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Department"
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          disabled={!isEditing || loading}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Designation"
                          name="designation"
                          value={formData.designation}
                          onChange={handleInputChange}
                          disabled={!isEditing || loading}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          disabled={!isEditing || loading}
                          multiline
                          rows={2}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Work Stats Tab */}
                {activeTab === 1 && (
                  <Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Performance Statistics
                    </Typography>
                    
                    <>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          {[
                            { label: 'Total Tasks', value: stats.total, color: '#1976D2', icon: <Assignment /> },
                            { label: 'Pending', value: stats.pending, color: '#FFA726', icon: <Pending /> },
                            { label: 'In Progress', value: stats.inProgress, color: '#9C27B0', icon: <Build /> },
                            { label: 'Completed', value: stats.completed, color: '#4CAF50', icon: <CheckCircle /> },
                            { label: 'In Review', value: stats.inReview, color: '#FF9800', icon: <Pending /> },
                            { label: 'Needs Revision', value: stats.needsRevision, color: '#F44336', icon: <ReportProblem /> },
                          ].map((stat, index) => (
                            <Grid item xs={6} sm={4} md={2} key={index}>
                              <Card sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                  <Box sx={{ 
                                    p: 1, 
                                    borderRadius: '50%', 
                                    bgcolor: `${stat.color}15`,
                                    color: stat.color,
                                  }}>
                                    {stat.icon}
                                  </Box>
                                </Box>
                                <Typography variant="h5" fontWeight={700} color={stat.color}>
                                  {stat.value}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {stat.label}
                                </Typography>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>

                        {/* Efficiency Metrics */}
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Card sx={{ p: 3 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Completion Rate
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Typography variant="h3" color="primary">
                                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                                </Typography>
                                <TrendingUp color="primary" fontSize="large" />
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} 
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                {stats.completed} out of {stats.total} tasks completed
                              </Typography>
                            </Card>
                          </Grid>
                        </Grid>
                      </>
                    </Box>
                )}

                {/* Assigned Tasks Tab */}
                {activeTab === 2 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" fontWeight={600}>
                        Assigned Tasks ({tasks.length})
                      </Typography>
                      <Button 
                        variant="contained" 
                        href="/staff/tasks"
                        startIcon={<ArrowForward />}
                      >
                        View All Tasks
                      </Button>
                    </Box>

                    {tasks.length > 0 ? (
                      <>
                        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell>Task ID</TableCell>
                                <TableCell>Title</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Progress</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {tasks.slice(0, 8).map((task) => {
                                const statusColors = getStatusColor(
                                  task.status, 
                                  task.needsReview, 
                                  task.adminApproved, 
                                  task.adminRejected
                                );
                                const statusText = getStatusText(
                                  task.status, 
                                  task.needsReview, 
                                  task.adminApproved, 
                                  task.adminRejected
                                );
                                
                                return (
                                  <TableRow key={task._id} hover>
                                    <TableCell>
                                      <Typography variant="caption" fontFamily="monospace">
                                        #{task.reportId || task._id?.substring(0, 8) || 'N/A'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                        {task.title || 'Untitled Task'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Chip 
                                        label={task.category?.replace('_', ' ') || 'General'} 
                                        size="small" 
                                        variant="outlined"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={statusText}
                                        size="small"
                                        sx={{
                                          backgroundColor: statusColors.bg,
                                          color: statusColors.color,
                                          border: `1px solid ${statusColors.color}`,
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <LinearProgress 
                                          variant="determinate" 
                                          value={task.progress || 0}
                                          sx={{ 
                                            flexGrow: 1, 
                                            height: 6,
                                            borderRadius: 3,
                                            backgroundColor: '#e0e0e0',
                                            '& .MuiLinearProgress-bar': {
                                              borderRadius: 3,
                                              backgroundColor: task.progress === 100 ? '#4CAF50' : 
                                                              task.progress > 50 ? '#2196F3' : '#FF9800'
                                            }
                                          }}
                                        />
                                        <Typography variant="caption">
                                          {task.progress || 0}%
                                        </Typography>
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        
                        {tasks.length > 8 && (
                          <Button 
                            fullWidth 
                            variant="outlined" 
                            href="/staff/tasks"
                            sx={{ mt: 2 }}
                          >
                            View All Tasks ({tasks.length})
                          </Button>
                        )}
                      </>
                    ) : (
                      <Card sx={{ p: 4, textAlign: 'center' }}>
                        <TaskAlt sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No Tasks Assigned
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          You don't have any tasks assigned to you yet.
                        </Typography>
                        <Button 
                          variant="contained" 
                          href="/staff/dashboard"
                          startIcon={<Assignment />}
                        >
                          Go to Dashboard
                        </Button>
                      </Card>
                    )}
                  </Box>
                )}

                {/* Activity Tab */}
                {activeTab === 3 && (
                  <Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Recent Activity
                    </Typography>
                    
                    {dataLoading ? (
                      <CircularProgress />
                    ) : recentActivity.length > 0 ? (
                      <Box>
                        {recentActivity.map((activity) => (
                          <Card 
                            key={activity.id} 
                            sx={{ 
                              mb: 2, 
                              p: 2,
                              borderLeft: '4px solid',
                              borderColor: activity.colors.color,
                              backgroundColor: activity.colors.bg,
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ 
                                p: 1, 
                                borderRadius: '50%', 
                                bgcolor: `${activity.colors.color}15`,
                                color: activity.colors.color,
                              }}>
                                {activity.icon}
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight={500} color={activity.colors.color}>
                                  {activity.description}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Task #{activity.reportId} • {formatDate(activity.timestamp)}
                                </Typography>
                              </Box>
                            </Box>
                          </Card>
                        ))}
                      </Box>
                    ) : (
                      <Card sx={{ p: 4, textAlign: 'center' }}>
                        <History sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No Recent Activity
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Your activity will appear here once you start working on tasks.
                        </Typography>
                      </Card>
                    )}
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Refresh Button */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={fetchStaffData}
                disabled={dataLoading}
                startIcon={dataLoading ? <CircularProgress size={20} /> : <Refresh />}
              >
                {dataLoading ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            </Box>
          </Grid>
        </Grid>

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

export default StaffProfilePage;