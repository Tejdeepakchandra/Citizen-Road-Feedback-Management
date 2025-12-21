// src/pages/Admin/AdminProfile.jsx
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
  Divider,
  Tab,
  Tabs,
  Paper,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CardActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  AdminPanelSettings,
  People,
  Assignment,
  PhotoLibrary,
  AttachMoney,
  BarChart,
  Storage,
  Security,
  History,
  TrendingUp,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Edit,
  Password,
  Visibility,
  VisibilityOff,
  Refresh,
  Download,
  Notifications,
  Backup,
  Restore,
  Schedule,
  Dashboard,
  Person,
  Report,
  Feedback,
  SystemUpdateAlt,
  Settings,
  Lock,
  VerifiedUser,
  
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, dashboardAPI } from '../../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

const AdminProfile = () => {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    pendingImages: 0,
    totalDonations: 0,
    systemHealth: 95,
    activeUsers: 0,
    recentGrowth: 0,
    avgResponseTime: 0,
  });
  
  const [recentActivities, setRecentActivities] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [userGrowth, setUserGrowth] = useState([]);
  const [reportTrends, setReportTrends] = useState([]);
  const [topDonors, setTopDonors] = useState([]);
  const [activeStaff, setActiveStaff] = useState([]);
  
  // Security states
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [twoFADialogOpen, setTwoFADialogOpen] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  
  // Forms
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false,
  });
  
  const [twoFAForm, setTwoFAForm] = useState({
    enabled: false,
    step: 0,
    secret: '',
    qrCode: '',
    verificationCode: '',
  });
  
  const [settingsForm, setSettingsForm] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    reportApprovalRequired: false,
    notificationEmail: true,
    notificationSMS: false,
    autoBackup: true,
    backupFrequency: 'daily',
    maxFileSize: 10,
    sessionTimeout: 30,
  });
  
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard data
      const dashboardRes = await adminAPI.getDashboard();
      const dashboardData = dashboardRes.data.data || dashboardRes.data;
      
      // Fetch system health
      const healthRes = await adminAPI.getSystemHealth();
      const healthData = healthRes.data.data || healthRes.data;
      
      // Fetch recent activity
      const activityRes = await adminAPI.getAdminActivity();
      const activityData = activityRes.data.data || activityRes.data;
      
      // Update stats
      setStats({
        totalUsers: dashboardData.summary?.totalUsers || 0,
        totalReports: dashboardData.summary?.totalReports || 0,
        pendingReports: dashboardData.summary?.pendingReports || 0,
        resolvedReports: dashboardData.summary?.resolvedReports || 0,
        pendingImages: dashboardData.summary?.pendingImages || 0,
        totalDonations: dashboardData.financial?.totalRevenue || 0,
        systemHealth: healthData.status === 'healthy' ? 95 : 60,
        activeUsers: dashboardData.summary?.activeUsers || 0,
        recentGrowth: dashboardData.recentActivity?.newUsers || 0,
        avgResponseTime: 24, // Hardcoded for now
      });
      
      // Update recent activities
      if (activityData && Array.isArray(activityData)) {
        setRecentActivities(activityData.slice(0, 5));
      } else {
        // Fallback to mock data
        setRecentActivities(getMockActivities());
      }
      
      // Update system health
      setSystemHealth(healthData);
      
      // Update user growth data
      if (dashboardData.charts?.userGrowth) {
        setUserGrowth(dashboardData.charts.userGrowth);
      }
      
      // Update report trends
      if (dashboardData.charts?.reportTrends) {
        setReportTrends(dashboardData.charts.reportTrends);
      }
      
      // Update top donors
      if (dashboardData.financial?.topDonors) {
        setTopDonors(dashboardData.financial.topDonors);
      }
      
      // Update active staff
      if (dashboardData.activeStaff) {
        setActiveStaff(dashboardData.activeStaff);
      }
      
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      
      // Use mock data as fallback
      setStats(getMockStats());
      setRecentActivities(getMockActivities());
      setSystemHealth(getMockSystemHealth());
      setUserGrowth(getMockUserGrowth());
      setReportTrends(getMockReportTrends());
      setTopDonors(getMockTopDonors());
      setActiveStaff(getMockActiveStaff());
      
      showSnackbar('Using offline data. Some features may be limited.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showSnackbar('New passwords do not match', 'error');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      showSnackbar('Password must be at least 8 characters', 'error');
      return;
    }
    
    try {
      setLoading(true);
      // Call password change API
      await adminAPI.updateUser(user._id, { 
        currentPassword: passwordForm.currentPassword,
        password: passwordForm.newPassword 
      });
      
      showSnackbar('Password updated successfully', 'success');
      setPasswordDialogOpen(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrent: false,
        showNew: false,
        showConfirm: false,
      });
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || 'Failed to update password', 
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handle2FAEnable = async () => {
    try {
      setLoading(true);
      
      if (twoFAForm.step === 0) {
        // Request 2FA setup
        const response = await adminAPI.enable2FA();
        setTwoFAForm({
          ...twoFAForm,
          step: 1,
          secret: response.data.secret,
          qrCode: response.data.qrCode,
        });
      } else if (twoFAForm.step === 1) {
        // Verify and enable 2FA
        await adminAPI.verify2FA({
          code: twoFAForm.verificationCode,
          secret: twoFAForm.secret,
        });
        
        showSnackbar('Two-factor authentication enabled', 'success');
        setTwoFAForm({
          ...twoFAForm,
          enabled: true,
          step: 0,
          verificationCode: '',
        });
        setTwoFADialogOpen(false);
      }
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || 'Failed to setup 2FA', 
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSave = async () => {
    try {
      setLoading(true);
      
      // Save settings to backend
      await adminAPI.saveSettings(settingsForm);
      
      showSnackbar('Settings saved successfully', 'success');
      setSettingsDialogOpen(false);
    } catch (error) {
      showSnackbar('Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupNow = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.createBackup();
      
      showSnackbar('Backup created successfully', 'success');
      
      // Download backup file
      const blob = new Blob([JSON.stringify(response.data)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setBackupDialogOpen(false);
    } catch (error) {
      showSnackbar('Failed to create backup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportUserData = () => {
    const data = {
      stats,
      recentActivities,
      systemHealth,
      userGrowth,
      reportTrends,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showSnackbar('Data exported successfully', 'success');
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).fromNow();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Mock data generators
  const getMockStats = () => ({
    totalUsers: 1248,
    totalReports: 567,
    pendingReports: 23,
    resolvedReports: 498,
    pendingImages: 12,
    totalDonations: 1250000,
    systemHealth: 92,
    activeUsers: 843,
    recentGrowth: 12,
    avgResponseTime: 24,
  });

  const getMockActivities = () => [
    { 
      id: 1, 
      action: 'Approved new user registration', 
      user: 'John Doe', 
      time: '2024-01-20T10:30:00Z', 
      type: 'user' 
    },
    { 
      id: 2, 
      action: 'Resolved high priority report', 
      report: 'Pothole on Main St', 
      time: '2024-01-20T08:15:00Z', 
      type: 'report' 
    },
    { 
      id: 3, 
      action: 'Approved 5 new images', 
      gallery: 'Before/After', 
      time: '2024-01-19T16:45:00Z', 
      type: 'gallery' 
    },
    { 
      id: 4, 
      action: 'Updated system settings', 
      section: 'Security', 
      time: '2024-01-19T14:20:00Z', 
      type: 'system' 
    },
    { 
      id: 5, 
      action: 'Generated monthly financial report', 
      period: 'January', 
      time: '2024-01-18T11:10:00Z', 
      type: 'financial' 
    },
  ];

  const getMockSystemHealth = () => ({
    status: 'healthy',
    uptime: '15 days 6 hours',
    memoryUsage: '65%',
    cpuUsage: '42%',
    diskUsage: '78%',
    activeConnections: 128,
    responseTime: '245ms',
  });

  const getMockUserGrowth = () => [
    { _id: '2024-01-15', count: 15 },
    { _id: '2024-01-16', count: 18 },
    { _id: '2024-01-17', count: 22 },
    { _id: '2024-01-18', count: 25 },
    { _id: '2024-01-19', count: 28 },
    { _id: '2024-01-20', count: 32 },
  ];

  const getMockReportTrends = () => [
    { _id: '2024-01-15', count: 8 },
    { _id: '2024-01-16', count: 12 },
    { _id: '2024-01-17', count: 10 },
    { _id: '2024-01-18', count: 15 },
    { _id: '2024-01-19', count: 18 },
    { _id: '2024-01-20', count: 14 },
  ];

  const getMockTopDonors = () => [
    { userId: '1', name: 'Rajesh Kumar', totalAmount: 15000, donationCount: 3 },
    { userId: '2', name: 'Priya Sharma', totalAmount: 12000, donationCount: 2 },
    { userId: '3', name: 'Amit Patel', totalAmount: 8000, donationCount: 1 },
    { userId: '4', name: 'Sneha Gupta', totalAmount: 6000, donationCount: 2 },
    { userId: '5', name: 'Vikram Singh', totalAmount: 5000, donationCount: 1 },
  ];

  const getMockActiveStaff = () => [
    { _id: '1', name: 'Rahul Mehta', staffCategory: 'pothole', lastLogin: '2024-01-20T09:30:00Z' },
    { _id: '2', name: 'Sunil Kumar', staffCategory: 'lighting', lastLogin: '2024-01-20T08:45:00Z' },
    { _id: '3', name: 'Anjali Sharma', staffCategory: 'drainage', lastLogin: '2024-01-19T16:20:00Z' },
    { _id: '4', name: 'Mohammed Ali', staffCategory: 'garbage', lastLogin: '2024-01-19T14:10:00Z' },
    { _id: '5', name: 'Kavita Reddy', staffCategory: 'signage', lastLogin: '2024-01-18T11:45:00Z' },
  ];

  if (!user || user.role !== 'admin') {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Alert severity="error" sx={{ maxWidth: 500 }}>
            <Typography variant="h6" gutterBottom>
              Access Denied
            </Typography>
            <Typography>
              You do not have permission to access this page. Admin privileges required.
            </Typography>
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Admin Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                System administration and profile management
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                startIcon={<Refresh />}
                onClick={fetchAdminData}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<Download />}
                onClick={exportUserData}
              >
                Export Data
              </Button>
              <Button 
                variant="contained" 
                startIcon={<Settings />}
                onClick={() => setSettingsDialogOpen(true)}
              >
                System Settings
              </Button>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* Left Sidebar - Admin Info */}
          <Grid item xs={12} md={4}>
            <Card sx={{ position: 'sticky', top: 20 }}>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                {/* Admin Badge */}
                <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                  <Avatar
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      mx: 'auto', 
                      mb: 2,
                      bgcolor: 'primary.main',
                      fontSize: '3rem'
                    }}
                    src={user.avatar}
                  >
                    {user.name?.charAt(0) || 'A'}
                  </Avatar>
                  <Chip
                    label="SUPER ADMIN"
                    color="primary"
                    sx={{ 
                      position: 'absolute', 
                      bottom: -10, 
                      left: '50%', 
                      transform: 'translateX(-50%)',
                      fontWeight: 700,
                      fontSize: '0.75rem'
                    }}
                  />
                </Box>

                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {user.email}
                </Typography>
                
                <Chip 
                  label={user.role?.toUpperCase()} 
                  color="primary" 
                  size="small" 
                  sx={{ mb: 1 }}
                />
                
                <Typography variant="caption" color="text.secondary" display="block">
                  Last login: {formatDate(user.lastLogin || new Date().toISOString())}
                </Typography>

                <Divider sx={{ my: 3 }} />

                {/* Quick Stats */}
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Quick Stats
                  </Typography>
                  
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <People fontSize="small" />
                      </ListItemAvatar>
                      <ListItemText primary="Total Users" />
                      <Typography variant="body2" fontWeight={600}>
                        {stats.totalUsers}
                      </Typography>
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Assignment fontSize="small" />
                      </ListItemAvatar>
                      <ListItemText primary="Active Reports" />
                      <Typography variant="body2" fontWeight={600}>
                        {stats.pendingReports}
                      </Typography>
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <PhotoLibrary fontSize="small" />
                      </ListItemAvatar>
                      <ListItemText primary="Pending Images" />
                      <Typography variant="body2" fontWeight={600}>
                        {stats.pendingImages}
                      </Typography>
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <AttachMoney fontSize="small" />
                      </ListItemAvatar>
                      <ListItemText primary="Total Donations" />
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(stats.totalDonations)}
                      </Typography>
                    </ListItem>
                  </List>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* System Health */}
                <Box sx={{ textAlign: 'left', mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    System Health
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={stats.systemHealth} 
                        sx={{ flexGrow: 1 }}
                        color={stats.systemHealth > 80 ? 'success' : stats.systemHealth > 60 ? 'warning' : 'error'}
                      />
                      <Typography variant="caption">
                        {stats.systemHealth}%
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Uptime: {systemHealth.uptime || '15 days 6 hours'}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Quick Actions */}
                <Box>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<Lock />}
                    onClick={() => setPasswordDialogOpen(true)}
                    sx={{ mb: 2 }}
                  >
                    Change Password
                  </Button>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<VerifiedUser />}
                    onClick={() => setTwoFADialogOpen(true)}
                    sx={{ mb: 2 }}
                  >
                    {twoFAForm.enabled ? 'Manage 2FA' : 'Setup 2FA'}
                  </Button>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<Backup />}
                    onClick={() => setBackupDialogOpen(true)}
                  >
                    System Backup
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
                <Tab icon={<Dashboard />} label="Dashboard" />
                <Tab icon={<History />} label="Recent Activity" />
                <Tab icon={<BarChart />} label="Analytics" />
                <Tab icon={<Security />} label="Security" />
                <Tab icon={<Storage />} label="System Info" />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {/* Dashboard Tab */}
                    {activeTab === 0 && (
                      <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          Dashboard Overview
                        </Typography>
                        
                        {/* Stats Cards */}
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                          <Grid item xs={12} sm={6} md={4}>
                            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                              <People sx={{ fontSize: 40, mb: 1 }} />
                              <Typography variant="h5">{stats.totalUsers}</Typography>
                              <Typography variant="body2">Total Users</Typography>
                              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                +{stats.recentGrowth} this week
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                              <Assignment sx={{ fontSize: 40, mb: 1 }} />
                              <Typography variant="h5">{stats.pendingReports}</Typography>
                              <Typography variant="body2">Pending Reports</Typography>
                              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                {stats.resolvedReports} resolved
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                              <AttachMoney sx={{ fontSize: 40, mb: 1 }} />
                              <Typography variant="h5">{formatCurrency(stats.totalDonations)}</Typography>
                              <Typography variant="body2">Total Donations</Typography>
                            </Card>
                          </Grid>
                        </Grid>

                        {/* Top Donors */}
                        <Card sx={{ p: 3, mb: 3 }}>
                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            Top Donors
                          </Typography>
                          <List>
                            {topDonors.slice(0, 3).map((donor, index) => (
                              <ListItem key={donor.userId || index}>
                                <ListItemAvatar>
                                  <Avatar>
                                    {donor.name?.charAt(0) || 'D'}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText 
                                  primary={donor.name} 
                                  secondary={`${donor.donationCount} donations`}
                                />
                                <ListItemSecondaryAction>
                                  <Typography variant="body1" fontWeight={600}>
                                    {formatCurrency(donor.totalAmount)}
                                  </Typography>
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                          </List>
                          <CardActions>
                            <Button size="small" href="/admin/donations">
                              View All Donations
                            </Button>
                          </CardActions>
                        </Card>

                        {/* Active Staff */}
                        <Card sx={{ p: 3 }}>
                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            Active Staff
                          </Typography>
                          <Grid container spacing={2}>
                            {activeStaff.slice(0, 4).map((staff, index) => (
                              <Grid item xs={12} sm={6} key={staff._id || index}>
                                <Card variant="outlined">
                                  <CardContent sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                      <Avatar sx={{ width: 40, height: 40 }}>
                                        {staff.name?.charAt(0)}
                                      </Avatar>
                                      <Box>
                                        <Typography variant="subtitle2">
                                          {staff.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {staff.staffCategory}
                                        </Typography>
                                      </Box>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                      Last active: {formatDate(staff.lastLogin)}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        </Card>
                      </Box>
                    )}

                    {/* Recent Activity Tab */}
                    {activeTab === 1 && (
                      <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          Recent Admin Activity
                        </Typography>
                        {recentActivities.length > 0 ? (
                          <List>
                            {recentActivities.map((activity) => (
                              <Card key={activity.id} sx={{ mb: 2, p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar sx={{ 
                                    bgcolor: 
                                      activity.type === 'user' ? 'primary.main' : 
                                      activity.type === 'report' ? 'warning.main' :
                                      activity.type === 'gallery' ? 'success.main' : 'info.main'
                                  }}>
                                    {activity.type === 'user' ? <People /> :
                                     activity.type === 'report' ? <Assignment /> :
                                     activity.type === 'gallery' ? <PhotoLibrary /> : <Storage />}
                                  </Avatar>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="body1" fontWeight={500}>
                                      {activity.action}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {formatDate(activity.time)}
                                    </Typography>
                                  </Box>
                                  <Chip label={activity.type} size="small" />
                                </Box>
                              </Card>
                            ))}
                          </List>
                        ) : (
                          <Alert severity="info">
                            No recent activity found.
                          </Alert>
                        )}
                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                          <Button variant="outlined" href="/admin/activity-log">
                            View Full Activity Log
                          </Button>
                        </Box>
                      </Box>
                    )}

                    {/* Analytics Tab */}
                    {activeTab === 2 && (
                      <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          Platform Analytics
                        </Typography>
                        
                        <Grid container spacing={3}>
                          {/* User Growth */}
                          <Grid item xs={12} md={6}>
                            <Card sx={{ p: 3 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                User Growth (Last 7 Days)
                              </Typography>
                              {userGrowth.length > 0 ? (
                                <Box sx={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                                  {userGrowth.map((day, index) => (
                                    <Box 
                                      key={index}
                                      sx={{ 
                                        flex: 1, 
                                        bgcolor: 'primary.main', 
                                        height: `${(day.count / Math.max(...userGrowth.map(d => d.count))) * 100}%`,
                                        borderRadius: '4px 4px 0 0',
                                      }}
                                    />
                                  ))}
                                </Box>
                              ) : (
                                <Alert severity="info">
                                  No growth data available
                                </Alert>
                              )}
                            </Card>
                          </Grid>

                          {/* Report Trends */}
                          <Grid item xs={12} md={6}>
                            <Card sx={{ p: 3 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Report Trends (Last 7 Days)
                              </Typography>
                              {reportTrends.length > 0 ? (
                                <Box sx={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                                  {reportTrends.map((day, index) => (
                                    <Box 
                                      key={index}
                                      sx={{ 
                                        flex: 1, 
                                        bgcolor: 'warning.main', 
                                        height: `${(day.count / Math.max(...reportTrends.map(d => d.count))) * 100}%`,
                                        borderRadius: '4px 4px 0 0',
                                      }}
                                    />
                                  ))}
                                </Box>
                              ) : (
                                <Alert severity="info">
                                  No trend data available
                                </Alert>
                              )}
                            </Card>
                          </Grid>

                          {/* Performance Metrics */}
                          <Grid item xs={12}>
                            <Card sx={{ p: 3 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Performance Metrics
                              </Typography>
                              <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4">
                                      {stats.avgResponseTime} hrs
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Avg Response Time
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4">
                                      {stats.totalReports > 0 
                                        ? Math.round((stats.resolvedReports / stats.totalReports) * 100) 
                                        : 0}%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Resolution Rate
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4">
                                      {stats.activeUsers}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Active Users
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4">
                                      98.5%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      System Uptime
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Card>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {/* Security Tab */}
                    {activeTab === 3 && (
                      <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          Security Dashboard
                        </Typography>
                        
                        <Grid container spacing={3}>
                          {/* Security Status */}
                          <Grid item xs={12} md={6}>
                            <Card sx={{ p: 3 }}>
                              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                Account Security Status
                              </Typography>
                              <List>
                                <ListItem>
                                  <ListItemAvatar>
                                    <CheckCircle color="success" />
                                  </ListItemAvatar>
                                  <ListItemText 
                                    primary="Strong Password" 
                                    secondary="Last changed: 15 days ago"
                                  />
                                </ListItem>
                                <ListItem>
                                  <ListItemAvatar>
                                    {twoFAForm.enabled ? (
                                      <CheckCircle color="success" />
                                    ) : (
                                      <Warning color="warning" />
                                    )}
                                  </ListItemAvatar>
                                  <ListItemText 
                                    primary="Two-Factor Authentication" 
                                    secondary={twoFAForm.enabled ? "Enabled" : "Not enabled"}
                                  />
                                  <Button 
                                    size="small"
                                    onClick={() => setTwoFADialogOpen(true)}
                                  >
                                    {twoFAForm.enabled ? 'Manage' : 'Enable'}
                                  </Button>
                                </ListItem>
                                <ListItem>
                                  <ListItemAvatar>
                                    <CheckCircle color="success" />
                                  </ListItemAvatar>
                                  <ListItemText 
                                    primary="Recent Login" 
                                    secondary={`From IP: 192.168.1.100`}
                                  />
                                </ListItem>
                              </List>
                            </Card>
                          </Grid>

                          {/* Active Sessions */}
                          <Grid item xs={12} md={6}>
                            <Card sx={{ p: 3 }}>
                              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                Active Sessions
                              </Typography>
                              <List>
                                <ListItem>
                                  <ListItemText 
                                    primary="Current Session" 
                                    secondary={`Started: ${formatDate(new Date().toISOString())}`}
                                  />
                                  <Chip label="Active" color="success" size="small" />
                                </ListItem>
                                <ListItem>
                                  <ListItemText 
                                    primary="Mobile App" 
                                    secondary="Last active: 2 hours ago"
                                  />
                                  <Chip label="Active" color="success" size="small" />
                                </ListItem>
                              </List>
                              <Button 
                                fullWidth 
                                variant="outlined" 
                                size="small"
                                sx={{ mt: 2 }}
                              >
                                Terminate Other Sessions
                              </Button>
                            </Card>
                          </Grid>

                          {/* Security Settings */}
                          <Grid item xs={12}>
                            <Card sx={{ p: 3 }}>
                              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                Admin Privileges
                              </Typography>
                              <Typography variant="body2" color="text.secondary" paragraph>
                                You have full access to all system modules including user management, content moderation, financial reports, and system configurations.
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                <Chip icon={<People />} label="User Management" color="primary" />
                                <Chip icon={<Assignment />} label="Content Moderation" color="primary" />
                                <Chip icon={<AttachMoney />} label="Financial Access" color="primary" />
                                <Chip icon={<Storage />} label="System Configuration" color="primary" />
                                <Chip icon={<Security />} label="Security Settings" color="primary" />
                                <Chip icon={<Backup />} label="Backup & Restore" color="primary" />
                              </Box>
                            </Card>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {/* System Info Tab */}
                    {activeTab === 4 && (
                      <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          System Information
                        </Typography>
                        
                        <Grid container spacing={3}>
                          {/* System Health */}
                          <Grid item xs={12} md={6}>
                            <Card sx={{ p: 3 }}>
                              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                System Health
                              </Typography>
                              <List dense>
                                <ListItem>
                                  <ListItemText primary="Status" />
                                  <Chip 
                                    label={systemHealth.status || 'Healthy'} 
                                    color={getStatusColor(systemHealth.status || 'healthy')} 
                                    size="small" 
                                  />
                                </ListItem>
                                <ListItem>
                                  <ListItemText primary="Uptime" />
                                  <Typography variant="body2">
                                    {systemHealth.uptime || '15 days 6 hours'}
                                  </Typography>
                                </ListItem>
                                <ListItem>
                                  <ListItemText primary="Memory Usage" />
                                  <Typography variant="body2">
                                    {systemHealth.memoryUsage || '65%'}
                                  </Typography>
                                </ListItem>
                                <ListItem>
                                  <ListItemText primary="CPU Usage" />
                                  <Typography variant="body2">
                                    {systemHealth.cpuUsage || '42%'}
                                  </Typography>
                                </ListItem>
                                <ListItem>
                                  <ListItemText primary="Disk Usage" />
                                  <Typography variant="body2">
                                    {systemHealth.diskUsage || '78%'}
                                  </Typography>
                                </ListItem>
                                <ListItem>
                                  <ListItemText primary="Active Connections" />
                                  <Typography variant="body2">
                                    {systemHealth.activeConnections || 128}
                                  </Typography>
                                </ListItem>
                                <ListItem>
                                  <ListItemText primary="Response Time" />
                                  <Typography variant="body2">
                                    {systemHealth.responseTime || '245ms'}
                                  </Typography>
                                </ListItem>
                              </List>
                            </Card>
                          </Grid>

                          {/* Database Info */}
                          <Grid item xs={12} md={6}>
                            <Card sx={{ p: 3 }}>
                              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                Database Status
                              </Typography>
                              <List dense>
                                <ListItem>
                                  <ListItemText primary="Connection" />
                                  <Chip 
                                    label="Connected" 
                                    color="success" 
                                    size="small" 
                                  />
                                </ListItem>
                                <ListItem>
                                  <ListItemText primary="Database" />
                                  <Typography variant="body2">
                                    smartroad_db
                                  </Typography>
                                </ListItem>
                                <ListItem>
                                  <ListItemText primary="Collections" />
                                  <Typography variant="body2">
                                    12
                                  </Typography>
                                </ListItem>
                                <ListItem>
                                  <ListItemText primary="Total Documents" />
                                  <Typography variant="body2">
                                    {stats.totalUsers + stats.totalReports + 1000}
                                  </Typography>
                                </ListItem>
                              </List>
                              <Box sx={{ mt: 3 }}>
                                <Button 
                                  fullWidth 
                                  variant="outlined" 
                                  startIcon={<Backup />}
                                  onClick={() => setBackupDialogOpen(true)}
                                >
                                  Create Backup
                                </Button>
                              </Box>
                            </Card>
                          </Grid>

                          {/* Server Info */}
                          <Grid item xs={12}>
                            <Card sx={{ p: 3 }}>
                              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                Server Information
                              </Typography>
                              <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6">Node.js</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      v18.17.0
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6">Express</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      v4.18.2
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6">MongoDB</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      v6.0
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6">React</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      v18.2.0
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Card>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Password Change Dialog */}
        <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
          <DialogTitle>Change Password</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                type={passwordForm.showCurrent ? 'text' : 'password'}
                label="Current Password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setPasswordForm({...passwordForm, showCurrent: !passwordForm.showCurrent})}
                    >
                      {passwordForm.showCurrent ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
              <TextField
                fullWidth
                type={passwordForm.showNew ? 'text' : 'password'}
                label="New Password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setPasswordForm({...passwordForm, showNew: !passwordForm.showNew})}
                    >
                      {passwordForm.showNew ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
              <TextField
                fullWidth
                type={passwordForm.showConfirm ? 'text' : 'password'}
                label="Confirm New Password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setPasswordForm({...passwordForm, showConfirm: !passwordForm.showConfirm})}
                    >
                      {passwordForm.showConfirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handlePasswordChange} 
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Change Password'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 2FA Setup Dialog */}
        <Dialog open={twoFADialogOpen} onClose={() => setTwoFADialogOpen(false)}>
          <DialogTitle>
            {twoFAForm.enabled ? 'Manage Two-Factor Authentication' : 'Setup Two-Factor Authentication'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Stepper activeStep={twoFAForm.step} sx={{ mb: 3 }}>
                <Step>
                  <StepLabel>Start Setup</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Scan QR Code</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Verify Code</StepLabel>
                </Step>
              </Stepper>

              {twoFAForm.step === 0 && (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Two-factor authentication adds an extra layer of security to your account.
                  </Alert>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={handle2FAEnable}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Start Setup'}
                  </Button>
                </Box>
              )}

              {twoFAForm.step === 1 && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography gutterBottom>
                    Scan this QR code with your authenticator app:
                  </Typography>
                  {twoFAForm.qrCode && (
                    <Box 
                      component="img" 
                      src={twoFAForm.qrCode} 
                      sx={{ width: 200, height: 200, mb: 2 }}
                    />
                  )}
                  <Typography variant="caption" display="block" gutterBottom>
                    Secret: {twoFAForm.secret}
                  </Typography>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={() => setTwoFAForm({...twoFAForm, step: 2})}
                  >
                    Next
                  </Button>
                </Box>
              )}

              {twoFAForm.step === 2 && (
                <Box>
                  <TextField
                    fullWidth
                    label="Enter 6-digit verification code"
                    value={twoFAForm.verificationCode}
                    onChange={(e) => setTwoFAForm({...twoFAForm, verificationCode: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={handle2FAEnable}
                    disabled={loading || twoFAForm.verificationCode.length !== 6}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Verify & Enable'}
                  </Button>
                </Box>
              )}
            </Box>
          </DialogContent>
        </Dialog>

        {/* Backup Dialog */}
        <Dialog open={backupDialogOpen} onClose={() => setBackupDialogOpen(false)}>
          <DialogTitle>System Backup</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Creating a backup may take a few minutes. The system will continue to operate normally.
              </Alert>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Backup Type</InputLabel>
                <Select
                  value="full"
                  label="Backup Type"
                >
                  <MenuItem value="full">Full Backup</MenuItem>
                  <MenuItem value="partial">Partial Backup</MenuItem>
                  <MenuItem value="incremental">Incremental Backup</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Include user data"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBackupDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleBackupNow} 
              variant="contained"
              disabled={loading}
              startIcon={<Backup />}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Backup'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* System Settings Dialog */}
        <Dialog 
          open={settingsDialogOpen} 
          onClose={() => setSettingsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>System Settings</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                General Settings
              </Typography>
              <FormControlLabel
                control={
                  <Switch 
                    checked={settingsForm.maintenanceMode}
                    onChange={(e) => setSettingsForm({...settingsForm, maintenanceMode: e.target.checked})}
                  />
                }
                label="Maintenance Mode"
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={settingsForm.registrationEnabled}
                    onChange={(e) => setSettingsForm({...settingsForm, registrationEnabled: e.target.checked})}
                  />
                }
                label="Allow User Registration"
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={settingsForm.reportApprovalRequired}
                    onChange={(e) => setSettingsForm({...settingsForm, reportApprovalRequired: e.target.checked})}
                  />
                }
                label="Require Report Approval"
                sx={{ mb: 3 }}
              />

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle1" gutterBottom>
                Notification Settings
              </Typography>
              <FormControlLabel
                control={
                  <Switch 
                    checked={settingsForm.notificationEmail}
                    onChange={(e) => setSettingsForm({...settingsForm, notificationEmail: e.target.checked})}
                  />
                }
                label="Email Notifications"
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={settingsForm.notificationSMS}
                    onChange={(e) => setSettingsForm({...settingsForm, notificationSMS: e.target.checked})}
                  />
                }
                label="SMS Notifications"
                sx={{ mb: 3 }}
              />

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle1" gutterBottom>
                Backup Settings
              </Typography>
              <FormControlLabel
                control={
                  <Switch 
                    checked={settingsForm.autoBackup}
                    onChange={(e) => setSettingsForm({...settingsForm, autoBackup: e.target.checked})}
                  />
                }
                label="Automatic Backups"
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Backup Frequency</InputLabel>
                <Select
                  value={settingsForm.backupFrequency}
                  onChange={(e) => setSettingsForm({...settingsForm, backupFrequency: e.target.value})}
                  label="Backup Frequency"
                >
                  <MenuItem value="hourly">Hourly</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle1" gutterBottom>
                System Limits
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Max File Size (MB)"
                value={settingsForm.maxFileSize}
                onChange={(e) => setSettingsForm({...settingsForm, maxFileSize: e.target.value})}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Session Timeout (minutes)"
                value={settingsForm.sessionTimeout}
                onChange={(e) => setSettingsForm({...settingsForm, sessionTimeout: e.target.value})}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettingsDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSettingsSave} 
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Settings'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
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

export default AdminProfile;