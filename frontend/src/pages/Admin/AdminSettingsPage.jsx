import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Switch,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Avatar,
  InputAdornment,
  Fade,
  Chip,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  IconButton as MuiIconButton,
  Badge,
  LinearProgress,
  AlertTitle,
  useTheme,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  AccountCircle as AccountIcon,
  Palette as ThemeIcon,
  AdminPanelSettings as AdminIcon,
  People as PeopleIcon,
  Storage as StorageIcon,
  Backup as BackupIcon,
  Security as SecurityIcon2,
  Assessment as AnalyticsIcon,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Email,
  Sms,
  Delete,
  Logout,
  Lock,
  Phone,
  LocationOn,
  Edit,
  Save,
  Cancel,
  DarkMode,
  LightMode,
  AutoAwesome,
  Add,
  Refresh,
  Download,
  Upload,
  Warning,
  Error,
  CheckCircleOutline,
  Block,
  PersonAdd,
  PersonRemove,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Shield,
  DataUsage,
  SettingsBackupRestore,
  CloudUpload,
  CloudDownload,
  NotificationsActive,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, authAPI } from '../../services/api';
import { useTheme as useCustomTheme } from '../../context/ThemeContext';

const AdminSettingsPage = () => {
  const { user, updateUser, logout } = useAuth();
  const { themeMode, changeTheme } = useCustomTheme();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Admin preferences
  const [adminPreferences, setAdminPreferences] = useState({
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      newUserRegistrations: true,
      newReports: true,
      reportApprovals: true,
      staffCompletions: true,
      donationAlerts: true,
      systemAlerts: true,
      maintenanceAlerts: true,
    },
    dashboard: {
      showAnalytics: true,
      showRecentActivity: true,
      showStaffPerformance: true,
      showFinancialStats: true,
      showSystemHealth: true,
      refreshInterval: 300, // seconds
      defaultView: 'overview',
    },
    system: {
      autoBackup: true,
      backupFrequency: 'daily',
      keepBackupsFor: 30, // days
      enableAuditLog: true,
      logRetention: 90, // days
      enableTwoFactor: false,
      sessionTimeout: 30, // minutes
    }
  });

  // Language & Region
  const [languageSettings, setLanguageSettings] = useState({
    language: 'en',
    region: 'IN',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
  });

  // Security
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Account
  const [accountSettings, setAccountSettings] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [isEditingAccount, setIsEditingAccount] = useState(false);

  const [themeSettings, setThemeSettings] = useState({
    mode: 'system',
    fontSize: 'medium',
    primaryColor: '#1976d2',
  });

  // System Health
  const [systemHealth, setSystemHealth] = useState({
    database: { status: 'healthy', message: '' },
    server: { status: 'healthy', message: '' },
    storage: { status: 'healthy', message: '' },
    api: { status: 'healthy', message: '' },
  });

  // Backup Management
  const [backups, setBackups] = useState([]);
  const [backupProgress, setBackupProgress] = useState(0);

  // User Management
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(0);
  const [usersRowsPerPage, setUsersRowsPerPage] = useState(10);
  const [usersTotal, setUsersTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'citizen',
    staffCategory: null,
    phone: '',
  });

  // Staff Management
  const [staffList, setStaffList] = useState([]);

  // Dangerous Actions
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Sync theme with context
  useEffect(() => {
    setThemeSettings(prev => ({
      ...prev,
      mode: themeMode || 'system',
      primaryColor: theme.palette.primary.main,
    }));
  }, [themeMode, theme]);

  // Load admin data on mount
  useEffect(() => {
    if (user && user.role === 'admin') {
      setAccountSettings({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
      });
      
      loadAdminData();
    }
  }, [user]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Load admin preferences
      await loadAdminPreferences();
      
      // Load system health
      await loadSystemHealth();
      
      // Load users
      await loadUsers();
      
      // Load staff
      await loadStaff();
      
      // Load backups
      await loadBackups();
      
    } catch (error) {
      console.error('Failed to load admin data:', error);
      showSnackbar('Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminPreferences = async () => {
    try {
      // First try admin-specific preferences
      try {
        const response = await adminAPI.getSystemSettings();
        if (response.data.success) {
          setAdminPreferences(prev => ({
            ...prev,
            ...response.data.data.preferences
          }));
          return;
        }
      } catch (adminError) {
        console.log('No admin-specific preferences, using user preferences');
      }
      
      // Fallback to user preferences
      const response = await authAPI.getUserPreferences();
      const preferences = response.data.data;
      
      if (preferences.notifications) {
        setAdminPreferences(prev => ({
          ...prev,
          notifications: {
            ...prev.notifications,
            ...preferences.notifications
          }
        }));
      }
      if (preferences.language) {
        setLanguageSettings(preferences.language);
      }
      if (preferences.theme) {
        setThemeSettings(preferences.theme);
        if (preferences.theme.mode && preferences.theme.mode !== themeMode) {
          changeTheme(preferences.theme.mode);
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const loadSystemHealth = async () => {
    try {
      const response = await adminAPI.getSystemHealth();
      if (response.data.success) {
        setSystemHealth(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load system health:', error);
    }
  };

  const loadUsers = async (page = 0) => {
    try {
      const response = await adminAPI.getAllUsers({
        page: page + 1,
        limit: usersRowsPerPage
      });
      if (response.data.success) {
        setUsers(response.data.data);
        setUsersTotal(response.data.total || response.data.count || 0);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await adminAPI.getAllStaff();
      if (response.data.success) {
        setStaffList(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load staff:', error);
    }
  };

  const loadBackups = async () => {
    try {
      // This would be from your backup API
      // For now, mock data
      setBackups([
        { id: 1, name: 'backup_2024_01_15.sql', size: '2.4 MB', createdAt: '2024-01-15', status: 'completed' },
        { id: 2, name: 'backup_2024_01_14.sql', size: '2.3 MB', createdAt: '2024-01-14', status: 'completed' },
        { id: 3, name: 'backup_2024_01_13.sql', size: '2.2 MB', createdAt: '2024-01-13', status: 'completed' },
      ]);
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAdminPreferenceChange = (section, setting) => (event) => {
    setAdminPreferences({
      ...adminPreferences,
      [section]: {
        ...adminPreferences[section],
        [setting]: event.target.checked
      }
    });
  };

  const handleLanguageChange = (setting) => (event) => {
    setLanguageSettings({
      ...languageSettings,
      [setting]: event.target.value,
    });
  };

  const handleThemeSettingsChange = (setting) => (event) => {
    const newValue = event.target.value;
    setThemeSettings({
      ...themeSettings,
      [setting]: newValue,
    });
    
    if (setting === 'mode') {
      changeTheme(newValue);
    }
  };

  const togglePasswordVisibility = (field) => () => {
    switch (field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showSnackbar('New passwords do not match!', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showSnackbar('Password must be at least 6 characters long', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.data.success) {
        showSnackbar('Password changed successfully!', 'success');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowChangePassword(false);
        
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        
        if (response.data.user) {
          updateUser(response.data.user);
        }
      }
    } catch (error) {
      console.error('Password change failed:', error);
      showSnackbar(
        error.response?.data?.message || 'Failed to change password',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAccountUpdate = async () => {
    try {
      setLoading(true);
      const updateData = {};
      const allowedFields = ['name', 'phone', 'address', 'city', 'state', 'pincode'];
      
      allowedFields.forEach(field => {
        if (accountSettings[field] !== undefined && accountSettings[field] !== '') {
          updateData[field] = accountSettings[field];
        }
      });

      const response = await authAPI.updateProfile(updateData);
      
      let updatedUser;
      if (response.data?.data) {
        updatedUser = response.data.data;
      } else if (response.data?.user) {
        updatedUser = response.data.user;
      } else {
        updatedUser = response.data;
      }
      
      updateUser({ ...user, ...updatedUser });
      localStorage.setItem('user', JSON.stringify({ ...user, ...updatedUser }));
      
      showSnackbar('Account updated successfully!', 'success');
      setIsEditingAccount(false);
    } catch (error) {
      console.error('Account update failed:', error);
      showSnackbar(
        error.response?.data?.message || 'Failed to update account',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (mode) => {
    changeTheme(mode);
  };

  const saveAdminPreferences = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.updateSystemSettings({
        preferences: adminPreferences
      });
      showSnackbar(response.data.message || 'Admin preferences saved!', 'success');
    } catch (error) {
      console.error('Failed to save admin preferences:', error);
      showSnackbar(error.response?.data?.message || 'Failed to save preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveLanguageSettings = async () => {
    try {
      setLoading(true);
      const response = await authAPI.updateLanguage(languageSettings);
      showSnackbar(response.data.message || 'Language settings saved!', 'success');
      
      if (user) {
        updateUser({
          ...user,
          preferences: {
            ...user.preferences,
            language: languageSettings
          }
        });
      }
    } catch (error) {
      console.error('Failed to save language settings:', error);
      showSnackbar(error.response?.data?.message || 'Failed to save language settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveThemeSettings = async () => {
    try {
      setLoading(true);
      const response = await authAPI.updateTheme(themeSettings);
      showSnackbar(response.data.message || 'Theme settings saved!', 'success');
      
      if (user) {
        updateUser({
          ...user,
          preferences: {
            ...user.preferences,
            theme: themeSettings
          }
        });
      }
    } catch (error) {
      console.error('Failed to save theme settings:', error);
      showSnackbar(error.response?.data?.message || 'Failed to save theme settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setLoading(true);
      setBackupProgress(0);
      
      // Simulate backup progress
      const interval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      
      const response = await adminAPI.createBackup();
      
      clearInterval(interval);
      setBackupProgress(100);
      
      showSnackbar(response.data.message || 'Backup created successfully!', 'success');
      
      // Reload backups
      await loadBackups();
      
      setTimeout(() => setBackupProgress(0), 1000);
    } catch (error) {
      console.error('Failed to create backup:', error);
      showSnackbar(error.response?.data?.message || 'Failed to create backup', 'error');
      setBackupProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleUserStatusToggle = async (userId, isActive) => {
    try {
      setLoading(true);
      const response = await adminAPI.toggleUserStatus(userId, !isActive);
      
      if (response.data.success) {
        showSnackbar(`User ${!isActive ? 'activated' : 'deactivated'} successfully`, 'success');
        await loadUsers(usersPage);
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      showSnackbar(error.response?.data?.message || 'Failed to update user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUserRoleUpdate = async (userId, newRole) => {
    try {
      setLoading(true);
      const response = await adminAPI.updateUserRole(userId, { role: newRole });
      
      if (response.data.success) {
        showSnackbar(`User role updated to ${newRole}`, 'success');
        await loadUsers(usersPage);
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
      showSnackbar(error.response?.data?.message || 'Failed to update role', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.createUser(newUserData);
      
      if (response.data.success) {
        showSnackbar('User created successfully!', 'success');
        setNewUserData({
          name: '',
          email: '',
          password: '',
          role: 'citizen',
          staffCategory: null,
          phone: '',
        });
        setUserDialogOpen(false);
        await loadUsers(usersPage);
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      showSnackbar(error.response?.data?.message || 'Failed to create user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUserPageChange = (event, newPage) => {
    setUsersPage(newPage);
    loadUsers(newPage);
  };

  const handleUsersRowsPerPageChange = (event) => {
    setUsersRowsPerPage(parseInt(event.target.value, 10));
    setUsersPage(0);
    loadUsers(0);
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const response = await authAPI.deleteAccount({
        confirmation: deleteConfirmation
      });
      
      if (response.data.success) {
        showSnackbar('Account deleted successfully', 'success');
        setTimeout(() => {
          logout();
          window.location.href = '/';
        }, 1500);
      }
    } catch (error) {
      console.error('Account deletion failed:', error);
      showSnackbar(
        error.response?.data?.message || 'Failed to delete account',
        'error'
      );
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setDeleteConfirmation('');
    }
  };

  const handleOpenDeleteDialog = () => {
    setDeleteConfirmation('');
    setDeleteDialogOpen(true);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  const getHealthStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircleOutline color="success" />;
      case 'warning': return <Warning color="warning" />;
      case 'error': return <Error color="error" />;
      default: return <CheckCircleOutline />;
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Alert severity="error" sx={{ maxWidth: 500 }}>
            <AlertTitle>Access Denied</AlertTitle>
            You must be an administrator to access this page.
          </Alert>
        </Box>
      </Container>
    );
  }

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'മലയാളം' },
  ];

  const timezones = [
    'Asia/Kolkata',
    'America/New_York',
    'Europe/London',
    'Asia/Singapore',
    'Australia/Sydney',
    'Asia/Tokyo',
  ];

  const roles = ['citizen', 'staff', 'admin'];
  const staffCategories = ['pothole', 'lighting', 'drainage', 'garbage', 'signage'];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Administrator Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage system settings, user accounts, and administrative preferences
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Left Sidebar */}
            <Grid item xs={12} md={3}>
              <Paper sx={{ 
                position: 'sticky', 
                top: 20,
                maxHeight: 'calc(100vh - 100px)',
                overflowY: 'auto',
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-thumb': { backgroundColor: 'primary.main', borderRadius: '2px' }
              }}>
                <List disablePadding>
                  {[
                    { index: 0, icon: <NotificationsIcon />, text: 'Notifications', badge: null },
                    { index: 1, icon: <LanguageIcon />, text: 'Language & Region', badge: null },
                    { index: 2, icon: <SecurityIcon />, text: 'Security', badge: null },
                    { index: 3, icon: <AccountIcon />, text: 'Account', badge: null },
                    { index: 4, icon: <ThemeIcon />, text: 'Appearance', badge: null },
                    { index: 5, icon: <AdminIcon />, text: 'Admin Preferences', badge: null },
                    { index: 6, icon: <PeopleIcon />, text: 'User Management', badge: usersTotal },
                    { index: 7, icon: <StorageIcon />, text: 'System Health', badge: null },
                    { index: 8, icon: <BackupIcon />, text: 'Backup & Restore', badge: null },
                  ].map((item) => (
                    <ListItem
                      key={item.index}
                      button
                      selected={activeTab === item.index}
                      onClick={() => setActiveTab(item.index)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': { backgroundColor: 'primary.dark' },
                        },
                      }}
                    >
                      <ListItemIcon sx={{ 
                        color: activeTab === item.index ? 'primary.contrastText' : 'inherit' 
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.text} />
                      {activeTab === item.index && (
                        <CheckCircle fontSize="small" sx={{ ml: 1, color: 'primary.contrastText' }} />
                      )}
                      {item.badge !== null && item.badge > 0 && (
                        <Chip label={item.badge} size="small" sx={{ ml: 1 }} />
                      )}
                    </ListItem>
                  ))}
                </List>

                {/* Admin Summary Card */}
                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1976d2&color=fff&size=80`}
                        sx={{ width: 60, height: 60, mr: 2 }}
                      >
                        {user.name?.charAt(0)?.toUpperCase() || 'A'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Administrator
                        </Typography>
                        <Chip 
                          label="Super Admin" 
                          size="small" 
                          color="primary" 
                          sx={{ mt: 0.5 }}
                          icon={<Shield fontSize="small" />}
                        />
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    {/* Quick Stats */}
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Users
                        </Typography>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {usersTotal}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Staff
                        </Typography>
                        <Typography variant="subtitle2" fontWeight={600} color="success.main">
                          {staffList.length}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Reports
                        </Typography>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {user.stats?.reportsSubmitted || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Donations
                        </Typography>
                        <Typography variant="subtitle2" fontWeight={600}>
                          ₹{user.stats?.totalDonated || 0}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Paper>
            </Grid>

            {/* Main Content */}
            <Grid item xs={12} md={9}>
              <Paper sx={{ 
                p: 3, 
                minHeight: '600px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Notifications Tab */}
                {activeTab === 0 && (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Admin Notifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Configure administrative notifications and alerts.
                    </Typography>

                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <Email />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Email Notifications" 
                          secondary="Receive system notifications via email"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            checked={adminPreferences.notifications.emailNotifications}
                            onChange={handleAdminPreferenceChange('notifications', 'emailNotifications')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <NotificationsActive />
                        </ListItemIcon>
                        <ListItemText 
                          primary="New User Registrations" 
                          secondary="Get notified when new users register"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            checked={adminPreferences.notifications.newUserRegistrations}
                            onChange={handleAdminPreferenceChange('notifications', 'newUserRegistrations')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <Warning />
                        </ListItemIcon>
                        <ListItemText 
                          primary="New Reports" 
                          secondary="Notifications for new issue reports"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            checked={adminPreferences.notifications.newReports}
                            onChange={handleAdminPreferenceChange('notifications', 'newReports')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <CheckCircle />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Report Approvals" 
                          secondary="Staff completion approvals needed"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            checked={adminPreferences.notifications.reportApprovals}
                            onChange={handleAdminPreferenceChange('notifications', 'reportApprovals')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <SecurityIcon2 />
                        </ListItemIcon>
                        <ListItemText 
                          primary="System Alerts" 
                          secondary="Critical system alerts and warnings"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            checked={adminPreferences.notifications.systemAlerts}
                            onChange={handleAdminPreferenceChange('notifications', 'systemAlerts')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <DataUsage />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Maintenance Alerts" 
                          secondary="System maintenance and updates"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            checked={adminPreferences.notifications.maintenanceAlerts}
                            onChange={handleAdminPreferenceChange('notifications', 'maintenanceAlerts')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      <Button
                        variant="contained"
                        onClick={saveAdminPreferences}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Save Notification Settings'}
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Language & Region Tab */}
                {activeTab === 1 && (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Language & Region
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Customize your language, region, and format preferences.
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                          <InputLabel>Language</InputLabel>
                          <Select
                            value={languageSettings.language}
                            label="Language"
                            onChange={handleLanguageChange('language')}
                          >
                            {languages.map((lang) => (
                              <MenuItem key={lang.code} value={lang.code}>
                                {lang.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                          <InputLabel>Timezone</InputLabel>
                          <Select
                            value={languageSettings.timezone}
                            label="Timezone"
                            onChange={handleLanguageChange('timezone')}
                          >
                            {timezones.map((tz) => (
                              <MenuItem key={tz} value={tz}>
                                {tz}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                          <InputLabel>Date Format</InputLabel>
                          <Select
                            value={languageSettings.dateFormat}
                            label="Date Format"
                            onChange={handleLanguageChange('dateFormat')}
                          >
                            <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                            <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                            <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12}>
                        <FormControl component="fieldset" sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Time Format
                          </Typography>
                          <RadioGroup
                            row
                            value={languageSettings.timeFormat}
                            onChange={handleLanguageChange('timeFormat')}
                          >
                            <FormControlLabel value="12h" control={<Radio />} label="12-hour" />
                            <FormControlLabel value="24h" control={<Radio />} label="24-hour" />
                          </RadioGroup>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      <Button
                        variant="contained"
                        onClick={saveLanguageSettings}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Save Language Settings'}
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Security Tab */}
                {activeTab === 2 && (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Security Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Manage your password and security preferences.
                    </Typography>

                    <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              Change Password
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Update your password regularly for better security
                            </Typography>
                          </Box>
                          <Button
                            variant={showChangePassword ? "outlined" : "contained"}
                            onClick={() => setShowChangePassword(!showChangePassword)}
                            startIcon={<Lock />}
                          >
                            {showChangePassword ? 'Cancel' : 'Change Password'}
                          </Button>
                        </Box>

                        {showChangePassword && (
                          <Fade in={showChangePassword}>
                            <Box sx={{ mt: 3 }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <TextField
                                    fullWidth
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    label="Current Password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                    InputProps={{
                                      endAdornment: (
                                        <InputAdornment position="end">
                                          <IconButton onClick={togglePasswordVisibility('current')}>
                                            {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                          </IconButton>
                                        </InputAdornment>
                                      ),
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <TextField
                                    fullWidth
                                    type={showNewPassword ? 'text' : 'password'}
                                    label="New Password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                    InputProps={{
                                      endAdornment: (
                                        <InputAdornment position="end">
                                          <IconButton onClick={togglePasswordVisibility('new')}>
                                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                          </IconButton>
                                        </InputAdornment>
                                      ),
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <TextField
                                    fullWidth
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    label="Confirm New Password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                    error={passwordData.newPassword !== '' && passwordData.newPassword !== passwordData.confirmPassword}
                                    helperText={passwordData.newPassword !== '' && passwordData.newPassword !== passwordData.confirmPassword ? "Passwords don't match" : ""}
                                    InputProps={{
                                      endAdornment: (
                                        <InputAdornment position="end">
                                          <IconButton onClick={togglePasswordVisibility('confirm')}>
                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                          </IconButton>
                                        </InputAdornment>
                                      ),
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={12}>
                                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                                    <Button
                                      variant="outlined"
                                      onClick={() => {
                                        setShowChangePassword(false);
                                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="contained"
                                      onClick={handlePasswordChange}
                                      disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                                    >
                                      {loading ? <CircularProgress size={24} /> : 'Update Password'}
                                    </Button>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>
                          </Fade>
                        )}
                      </CardContent>
                    </Card>

                    {/* Two-Factor Authentication */}
                    <Card sx={{ mb: 3 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              Two-Factor Authentication
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Add an extra layer of security to your account
                            </Typography>
                          </Box>
                          <Switch
                            checked={adminPreferences.system.enableTwoFactor}
                            onChange={handleAdminPreferenceChange('system', 'enableTwoFactor')}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          When enabled, you'll need to enter a verification code from your authenticator app when signing in.
                        </Typography>
                      </CardContent>
                    </Card>

                    {/* Session Settings */}
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          Session Settings
                        </Typography>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                          <InputLabel>Session Timeout</InputLabel>
                          <Select
                            value={adminPreferences.system.sessionTimeout}
                            label="Session Timeout"
                            onChange={(e) => {
                              setAdminPreferences({
                                ...adminPreferences,
                                system: {
                                  ...adminPreferences.system,
                                  sessionTimeout: e.target.value
                                }
                              });
                            }}
                          >
                            <MenuItem value={15}>15 minutes</MenuItem>
                            <MenuItem value={30}>30 minutes</MenuItem>
                            <MenuItem value={60}>60 minutes</MenuItem>
                            <MenuItem value={120}>2 hours</MenuItem>
                            <MenuItem value={0}>Never (Not recommended)</MenuItem>
                          </Select>
                        </FormControl>
                        <Typography variant="caption" color="text.secondary">
                          Automatically log out after period of inactivity
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {/* Account Tab */}
                {activeTab === 3 && (
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" fontWeight={600}>
                        Account Information
                      </Typography>
                      <Button
                        variant={isEditingAccount ? "contained" : "outlined"}
                        startIcon={isEditingAccount ? <Save /> : <Edit />}
                        onClick={() => isEditingAccount ? handleAccountUpdate() : setIsEditingAccount(true)}
                        disabled={loading}
                      >
                        {isEditingAccount ? (loading ? 'Saving...' : 'Save Changes') : 'Edit Account'}
                      </Button>
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          value={accountSettings.name}
                          onChange={(e) => setAccountSettings({...accountSettings, name: e.target.value})}
                          disabled={!isEditingAccount || loading}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          type="email"
                          value={accountSettings.email}
                          disabled={true}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone Number"
                          value={accountSettings.phone}
                          onChange={(e) => setAccountSettings({...accountSettings, phone: e.target.value})}
                          disabled={!isEditingAccount || loading}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Role"
                          value="Administrator"
                          disabled={true}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Address"
                          value={accountSettings.address}
                          onChange={(e) => setAccountSettings({...accountSettings, address: e.target.value})}
                          disabled={!isEditingAccount || loading}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="City"
                          value={accountSettings.city}
                          onChange={(e) => setAccountSettings({...accountSettings, city: e.target.value})}
                          disabled={!isEditingAccount || loading}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="State"
                          value={accountSettings.state}
                          onChange={(e) => setAccountSettings({...accountSettings, state: e.target.value})}
                          disabled={!isEditingAccount || loading}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Pincode"
                          value={accountSettings.pincode}
                          onChange={(e) => setAccountSettings({...accountSettings, pincode: e.target.value})}
                          disabled={!isEditingAccount || loading}
                        />
                      </Grid>
                    </Grid>

                    {/* Dangerous Zone */}
                    <Divider sx={{ my: 4 }} />
                    
                    <Typography variant="h6" fontWeight={600} color="error" gutterBottom>
                      ⚠️ Dangerous Zone
                    </Typography>
                    
                    <Card sx={{ border: '2px solid', borderColor: 'error.light', mt: 2 }}>
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={8}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              Logout from all devices
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              This will log you out from all devices where you're currently logged in.
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
                            <Button
                              variant="outlined"
                              color="warning"
                              startIcon={<Logout />}
                              onClick={() => setLogoutDialogOpen(true)}
                            >
                              Logout All
                            </Button>
                          </Grid>
                        </Grid>

                        <Divider sx={{ my: 2 }} />

                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={8}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              Delete Account
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Permanently delete your account and all associated data.
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
                            <Button
                              variant="contained"
                              color="error"
                              startIcon={<Delete />}
                              onClick={handleOpenDeleteDialog}
                            >
                              Delete Account
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {/* Appearance Tab */}
                {activeTab === 4 && (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Appearance Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Customize how the application looks and feels.
                    </Typography>

                    {/* Theme Selection */}
                    <Card sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          Theme Mode
                        </Typography>
                        
                        <Grid container spacing={2}>
                          {[
                            { mode: 'light', icon: <LightMode />, label: 'Light', desc: 'Bright and clear' },
                            { mode: 'dark', icon: <DarkMode />, label: 'Dark', desc: 'Easy on the eyes' },
                            { mode: 'system', icon: <AutoAwesome />, label: 'System', desc: 'Follows device' }
                          ].map((theme) => (
                            <Grid item xs={12} md={4} key={theme.mode}>
                              <Card 
                                sx={{ 
                                  border: themeMode === theme.mode ? '2px solid' : '1px solid',
                                  borderColor: themeMode === theme.mode ? 'primary.main' : 'divider',
                                  cursor: 'pointer',
                                  '&:hover': { borderColor: 'primary.light' }
                                }}
                                onClick={() => handleThemeChange(theme.mode)}
                              >
                                <CardContent sx={{ textAlign: 'center' }}>
                                  {React.cloneElement(theme.icon, { 
                                    sx: { fontSize: 48, mb: 2, 
                                      color: theme.mode === 'light' ? theme.palette.warning.main : 
                                             theme.mode === 'dark' ? theme.palette.secondary.light : theme.palette.grey[500] 
                                    } 
                                  })}
                                  <Typography variant="subtitle1" fontWeight={600}>
                                    {theme.label}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {theme.desc}
                                  </Typography>
                                  {themeMode === theme.mode && (
                                    <CheckCircle sx={{ 
                                      position: 'absolute', 
                                      top: 8, 
                                      right: 8, 
                                      color: 'primary.main' 
                                    }} />
                                  )}
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>

                    {/* Font Size */}
                    <Card sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          Font Size
                        </Typography>
                        <RadioGroup
                          row
                          value={themeSettings.fontSize}
                          onChange={handleThemeSettingsChange('fontSize')}
                        >
                          <FormControlLabel value="small" control={<Radio />} label="Small" />
                          <FormControlLabel value="medium" control={<Radio />} label="Medium" />
                          <FormControlLabel value="large" control={<Radio />} label="Large" />
                        </RadioGroup>
                      </CardContent>
                    </Card>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      <Button 
                        variant="contained" 
                        onClick={saveThemeSettings}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Save Theme Settings'}
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Admin Preferences Tab */}
                {activeTab === 5 && (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Admin Preferences
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Configure administrative dashboard and system settings.
                    </Typography>

                    {/* Dashboard Settings */}
                    <Card sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          Dashboard Settings
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={adminPreferences.dashboard.showAnalytics}
                                  onChange={handleAdminPreferenceChange('dashboard', 'showAnalytics')}
                                />
                              }
                              label="Show Analytics"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={adminPreferences.dashboard.showRecentActivity}
                                  onChange={handleAdminPreferenceChange('dashboard', 'showRecentActivity')}
                                />
                              }
                              label="Show Recent Activity"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={adminPreferences.dashboard.showStaffPerformance}
                                  onChange={handleAdminPreferenceChange('dashboard', 'showStaffPerformance')}
                                />
                              }
                              label="Show Staff Performance"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={adminPreferences.dashboard.showFinancialStats}
                                  onChange={handleAdminPreferenceChange('dashboard', 'showFinancialStats')}
                                />
                              }
                              label="Show Financial Stats"
                            />
                          </Grid>
                        </Grid>

                        <FormControl fullWidth sx={{ mt: 3 }}>
                          <InputLabel>Default Dashboard View</InputLabel>
                          <Select
                            value={adminPreferences.dashboard.defaultView}
                            label="Default Dashboard View"
                            onChange={(e) => {
                              setAdminPreferences({
                                ...adminPreferences,
                                dashboard: {
                                  ...adminPreferences.dashboard,
                                  defaultView: e.target.value
                                }
                              });
                            }}
                          >
                            <MenuItem value="overview">Overview</MenuItem>
                            <MenuItem value="reports">Reports</MenuItem>
                            <MenuItem value="users">Users</MenuItem>
                            <MenuItem value="analytics">Analytics</MenuItem>
                          </Select>
                        </FormControl>
                      </CardContent>
                    </Card>

                    {/* System Settings */}
                    <Card sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          System Settings
                        </Typography>
                        
                        <FormControlLabel
                          control={
                            <Switch
                              checked={adminPreferences.system.autoBackup}
                              onChange={handleAdminPreferenceChange('system', 'autoBackup')}
                            />
                          }
                          label="Automatic Backups"
                          sx={{ mb: 2, display: 'block' }}
                        />
                        
                        {adminPreferences.system.autoBackup && (
                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth>
                                <InputLabel>Backup Frequency</InputLabel>
                                <Select
                                  value={adminPreferences.system.backupFrequency}
                                  label="Backup Frequency"
                                  onChange={(e) => {
                                    setAdminPreferences({
                                      ...adminPreferences,
                                      system: {
                                        ...adminPreferences.system,
                                        backupFrequency: e.target.value
                                      }
                                    });
                                  }}
                                >
                                  <MenuItem value="hourly">Hourly</MenuItem>
                                  <MenuItem value="daily">Daily</MenuItem>
                                  <MenuItem value="weekly">Weekly</MenuItem>
                                  <MenuItem value="monthly">Monthly</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Keep Backups For (days)"
                                value={adminPreferences.system.keepBackupsFor}
                                onChange={(e) => {
                                  setAdminPreferences({
                                    ...adminPreferences,
                                    system: {
                                      ...adminPreferences.system,
                                      keepBackupsFor: parseInt(e.target.value)
                                    }
                                  });
                                }}
                              />
                            </Grid>
                          </Grid>
                        )}

                        <FormControlLabel
                          control={
                            <Switch
                              checked={adminPreferences.system.enableAuditLog}
                              onChange={handleAdminPreferenceChange('system', 'enableAuditLog')}
                            />
                          }
                          label="Enable Audit Logging"
                          sx={{ mb: 2, display: 'block' }}
                        />
                        
                        {adminPreferences.system.enableAuditLog && (
                          <TextField
                            fullWidth
                            type="number"
                            label="Log Retention (days)"
                            value={adminPreferences.system.logRetention}
                            onChange={(e) => {
                              setAdminPreferences({
                                ...adminPreferences,
                                system: {
                                  ...adminPreferences.system,
                                  logRetention: parseInt(e.target.value)
                                }
                              });
                            }}
                            sx={{ mb: 2 }}
                          />
                        )}
                      </CardContent>
                    </Card>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      <Button
                        variant="contained"
                        onClick={saveAdminPreferences}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Save Admin Preferences'}
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* User Management Tab */}
                {activeTab === 6 && (
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" fontWeight={600}>
                        User Management
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<PersonAdd />}
                        onClick={() => setUserDialogOpen(true)}
                      >
                        Add User
                      </Button>
                    </Box>

                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Joined</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {users.map((userItem) => (
                            <TableRow key={userItem._id}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar
                                    src={userItem.avatar}
                                    sx={{ width: 32, height: 32, mr: 2 }}
                                  >
                                    {userItem.name?.charAt(0)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" fontWeight={500}>
                                      {userItem.name}
                                    </Typography>
                                    {userItem.staffCategory && (
                                      <Chip 
                                        label={userItem.staffCategory} 
                                        size="small" 
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>{userItem.email}</TableCell>
                              <TableCell>
                                <Select
                                  size="small"
                                  value={userItem.role}
                                  onChange={(e) => handleUserRoleUpdate(userItem._id, e.target.value)}
                                  sx={{ minWidth: 100 }}
                                >
                                  {roles.map((role) => (
                                    <MenuItem key={role} value={role}>
                                      {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Switch
                                    size="small"
                                    checked={userItem.isActive}
                                    onChange={() => handleUserStatusToggle(userItem._id, userItem.isActive)}
                                  />
                                  <Chip
                                    size="small"
                                    label={userItem.isActive ? 'Active' : 'Inactive'}
                                    color={userItem.isActive ? 'success' : 'default'}
                                    sx={{ ml: 1 }}
                                  />
                                </Box>
                              </TableCell>
                              <TableCell>
                                {new Date(userItem.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell align="right">
                                <Tooltip title="View">
                                  <MuiIconButton size="small">
                                    <ViewIcon fontSize="small" />
                                  </MuiIconButton>
                                </Tooltip>
                                <Tooltip title="Edit">
                                  <MuiIconButton size="small">
                                    <EditIcon fontSize="small" />
                                  </MuiIconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <MuiIconButton size="small" color="error">
                                    <DeleteIcon fontSize="small" />
                                  </MuiIconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={usersTotal}
                        rowsPerPage={usersRowsPerPage}
                        page={usersPage}
                        onPageChange={handleUserPageChange}
                        onRowsPerPageChange={handleUsersRowsPerPageChange}
                      />
                    </TableContainer>
                  </Box>
                )}

                {/* System Health Tab */}
                {activeTab === 7 && (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      System Health
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Monitor the health and performance of your system components.
                    </Typography>

                    <Grid container spacing={3}>
                      {Object.entries(systemHealth).map(([component, data]) => (
                        <Grid item xs={12} md={6} key={component}>
                          <Card>
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                {getHealthStatusIcon(data.status)}
                                <Typography variant="subtitle1" fontWeight={600} sx={{ ml: 1 }}>
                                  {component.charAt(0).toUpperCase() + component.slice(1)}
                                </Typography>
                                <Chip
                                  label={data.status.toUpperCase()}
                                  size="small"
                                  color={getHealthStatusColor(data.status)}
                                  sx={{ ml: 'auto' }}
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {data.message || 'All systems operational'}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={data.status === 'healthy' ? 100 : data.status === 'warning' ? 70 : 30}
                                color={getHealthStatusColor(data.status)}
                                sx={{ mt: 2 }}
                              />
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>

                    <Card sx={{ mt: 3 }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          Recent System Activity
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          No recent issues detected.
                        </Typography>
                      </CardContent>
                    </Card>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={loadSystemHealth}
                        disabled={loading}
                      >
                        Refresh Status
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Backup & Restore Tab */}
                {activeTab === 8 && (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Backup & Restore
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Manage system backups and restore points.
                    </Typography>

                    <Card sx={{ mb: 3 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              Create Backup
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Create a new system backup
                            </Typography>
                          </Box>
                          <Button
                            variant="contained"
                            startIcon={<CloudUpload />}
                            onClick={createBackup}
                            disabled={loading || backupProgress > 0}
                          >
                            {backupProgress > 0 ? `Backing up... ${backupProgress}%` : 'Create Backup'}
                          </Button>
                        </Box>
                        
                        {backupProgress > 0 && backupProgress < 100 && (
                          <Box sx={{ mt: 2 }}>
                            <LinearProgress variant="determinate" value={backupProgress} />
                          </Box>
                        )}
                      </CardContent>
                    </Card>

                    <Card sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          Available Backups
                        </Typography>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Backup Name</TableCell>
                                <TableCell>Size</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {backups.map((backup) => (
                                <TableRow key={backup.id}>
                                  <TableCell>{backup.name}</TableCell>
                                  <TableCell>{backup.size}</TableCell>
                                  <TableCell>{backup.createdAt}</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={backup.status}
                                      size="small"
                                      color={backup.status === 'completed' ? 'success' : 'default'}
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    <Tooltip title="Download">
                                      <MuiIconButton size="small">
                                        <Download fontSize="small" />
                                      </MuiIconButton>
                                    </Tooltip>
                                    <Tooltip title="Restore">
                                      <MuiIconButton size="small">
                                        <SettingsBackupRestore fontSize="small" />
                                      </MuiIconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                      <MuiIconButton size="small" color="error">
                                        <Delete fontSize="small" />
                                      </MuiIconButton>
                                    </Tooltip>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>

                    <Card sx={{ border: '2px solid', borderColor: 'warning.light' }}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} color="warning.dark" gutterBottom>
                          ⚠️ Restore System
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Restoring from a backup will overwrite current data. This action cannot be undone.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Button
                            variant="outlined"
                            startIcon={<CloudDownload />}
                            color="warning"
                          >
                            Upload Backup File
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={<SettingsBackupRestore />}
                            color="warning"
                          >
                            Restore System
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {/* Save All Button */}
                <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={saveAdminPreferences}
                    disabled={loading}
                    sx={{ width: '100%' }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Save All Settings'}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Create User Dialog */}
          <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Add New User</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={newUserData.role}
                      label="Role"
                      onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}
                    >
                      {roles.map((role) => (
                        <MenuItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Staff Category</InputLabel>
                    <Select
                      value={newUserData.staffCategory || ''}
                      label="Staff Category"
                      onChange={(e) => setNewUserData({...newUserData, staffCategory: e.target.value})}
                      disabled={newUserData.role !== 'staff'}
                    >
                      <MenuItem value="">None</MenuItem>
                      {staffCategories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateUser} variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Create User'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Account Dialog */}
          <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
            <DialogTitle color="error">
              ⚠️ Delete Account
            </DialogTitle>
            <DialogContent>
              <Alert severity="error" sx={{ mb: 2 }}>
                This action cannot be undone!
              </Alert>
              <Typography>
                Are you sure you want to delete your administrator account? This will:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Remove all your administrative privileges" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Delete your profile and account data" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Remove you from all administrative tasks" />
                </ListItem>
              </List>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                To confirm, please type <strong>DELETE ADMIN ACCOUNT</strong> below:
              </Typography>
              <TextField
                fullWidth
                label="Type to confirm"
                variant="outlined"
                sx={{ mt: 2 }}
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                error={deleteConfirmation !== '' && deleteConfirmation !== 'DELETE ADMIN ACCOUNT'}
                helperText={deleteConfirmation !== '' && deleteConfirmation !== 'DELETE ADMIN ACCOUNT' ? 'Must exactly match: DELETE ADMIN ACCOUNT' : ''}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmation('');
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteAccount} 
                color="error"
                variant="contained"
                disabled={loading || deleteConfirmation !== 'DELETE ADMIN ACCOUNT'}
              >
                {loading ? <CircularProgress size={24} /> : 'Permanently Delete Account'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Logout Dialog */}
          <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}>
            <DialogTitle>
              Logout from all devices?
            </DialogTitle>
            <DialogContent>
              <Typography>
                This will log you out from all devices where you're currently logged in.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleLogout} 
                color="warning"
                variant="contained"
              >
                Logout Everywhere
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
    </Box>
  );
};

export default AdminSettingsPage;