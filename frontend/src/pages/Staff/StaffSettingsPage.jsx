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
  Badge,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  AccountCircle as AccountIcon,
  Palette as ThemeIcon,
  Work as WorkIcon,
  Schedule as ScheduleIcon,
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
  Assignment,
  Report,
  Task,
  
  Build,
  Lightbulb,
  WaterDrop,
  DeleteSweep,
  Signpost,
  VerifiedUser,
  LocationCity,
  Map,
  Warning,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const StaffSettingsPage = () => {
  const { user, updateUser, logout } = useAuth();
  const { themeMode, changeTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Staff-specific notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    newAssignments: true,
    assignmentUpdates: true,
    emergencyReports: true,
    dailySummary: true,
    reportResolved: true,
    feedbackReceived: true,
    priorityAlerts: true,
    shiftReminders: false,
    teamUpdates: false,
  });

  // Staff preferences
  const [staffPreferences, setStaffPreferences] = useState({
    maxAssignments: 5,
    autoAcceptAssignments: false,
    showEmergencyFirst: true,
    enableLocationTracking: true,
    offlineMode: false,
    workRadius: 10,
    preferredShift: 'morning',
    notificationSound: true,
    mapType: 'standard',
  });

  // Language & Region state
  const [languageSettings, setLanguageSettings] = useState({
    language: 'en',
    region: 'IN',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
  });

  // Security state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Account state
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

  // Theme state
  const theme = useMuiTheme();
  const [themeSettings, setThemeSettings] = useState({
    mode: themeMode || 'system',
    fontSize: 'medium',
    primaryColor: theme.palette.primary.main,
  });

  // Staff availability
  const [availability, setAvailability] = useState({
    monday: { morning: true, afternoon: true, evening: false },
    tuesday: { morning: true, afternoon: true, evening: false },
    wednesday: { morning: true, afternoon: true, evening: false },
    thursday: { morning: true, afternoon: true, evening: false },
    friday: { morning: true, afternoon: true, evening: false },
    saturday: { morning: false, afternoon: false, evening: false },
    sunday: { morning: false, afternoon: false, evening: false },
  });

  // Dangerous actions dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Staff stats
  const [staffStats, setStaffStats] = useState({
    totalAssignments: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    averageResolutionTime: 0,
    rating: 0,
    responseRate: 0,
  });

  // Sync themeSettings with themeMode
  useEffect(() => {
    setThemeSettings(prev => ({
      ...prev,
      mode: themeMode || 'system'
    }));
  }, [themeMode]);

  // Load user data and preferences on mount
  useEffect(() => {
    if (user) {
      setAccountSettings({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
      });
      
      loadStaffData();
    }
  }, [user]);

  // Load staff-specific data
  const loadStaffData = async () => {
    try {
      // Load staff preferences
      const prefsResponse = await api.get('/staff/preferences');
      if (prefsResponse.data.success) {
        const data = prefsResponse.data.data;
        
        if (data.preferences) {
          // Set notifications
          if (data.preferences.notifications) {
            setNotificationSettings(prev => ({
              ...prev,
              ...data.preferences.notifications
            }));
          }
          
          // Set work preferences
          if (data.preferences.workPreferences) {
            setStaffPreferences(data.preferences.workPreferences);
          }
          
          // Set availability
          if (data.preferences.availability) {
            setAvailability(data.preferences.availability);
          }
          
          // Set language
          if (data.preferences.language) {
            setLanguageSettings(prev => ({
              ...prev,
              ...data.preferences.language
            }));
          }
          
          // Set theme
          if (data.preferences.theme) {
            setThemeSettings(data.preferences.theme);
            if (data.preferences.theme.mode && data.preferences.theme.mode !== themeMode) {
              changeTheme(data.preferences.theme.mode);
            }
          }
        }
      }

      // Load staff stats
      const statsResponse = await api.get('/staff/stats');
      if (statsResponse.data.success) {
        setStaffStats(statsResponse.data.data);
      }
    } catch (error) {
      console.error('Failed to load staff data:', error);
      
      // If staff endpoints fail, try to load from user preferences
      try {
        const userPrefsResponse = await api.get('/auth/preferences');
        const preferences = userPrefsResponse.data.data;
        
        if (preferences.notifications) {
          setNotificationSettings(prev => ({
            ...prev,
            ...preferences.notifications
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
      } catch (userError) {
        console.error('Failed to load user preferences:', userError);
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle notification toggles
  const handleNotificationChange = (setting) => (event) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: event.target.checked,
    });
  };

  // Handle staff preferences change
  const handleStaffPreferenceChange = (setting) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setStaffPreferences({
      ...staffPreferences,
      [setting]: value,
    });
  };

  // Handle availability change
  const handleAvailabilityChange = (day, shift) => () => {
    setAvailability({
      ...availability,
      [day]: {
        ...availability[day],
        [shift]: !availability[day][shift]
      }
    });
  };

  // Handle language/region changes
  const handleLanguageChange = (setting) => (event) => {
    setLanguageSettings({
      ...languageSettings,
      [setting]: event.target.value,
    });
  };

  // Handle theme settings change
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

  // Toggle password visibility
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

  // Change password
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
      const response = await api.put('/auth/changepassword', {
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

  // Update account
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

      const response = await api.put('/auth/updatedetails', updateData);
      
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

  // Change theme
  const handleThemeChange = (mode) => {
    changeTheme(mode);
  };

  // Save notification settings
  const saveNotificationSettings = async () => {
    try {
      setLoading(true);
      const response = await api.put('/staff/notifications', notificationSettings);
      showSnackbar(response.data.message || 'Notification settings saved!', 'success');
      
      // Update user in context
      if (user) {
        updateUser({
          ...user,
          preferences: {
            ...user.preferences,
            notifications: {
              ...user.preferences?.notifications,
              ...notificationSettings
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to save notifications:', error);
      showSnackbar(error.response?.data?.message || 'Failed to save notification settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save staff preferences
  const saveStaffPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.put('/staff/preferences', {
        preferences: {
          workPreferences: staffPreferences
        },
        availability: availability
      });
      showSnackbar(response.data.message || 'Work preferences saved!', 'success');
      
      // Update user in context
      if (user) {
        updateUser({
          ...user,
          preferences: {
            ...user.preferences,
            workPreferences: staffPreferences,
            availability: availability
          }
        });
      }
    } catch (error) {
      console.error('Failed to save staff preferences:', error);
      showSnackbar(error.response?.data?.message || 'Failed to save preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save language settings
  const saveLanguageSettings = async () => {
    try {
      setLoading(true);
      const response = await api.put('/auth/language', languageSettings);
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

  // Save theme settings
  const saveThemeSettings = async () => {
    try {
      setLoading(true);
      const response = await api.put('/auth/theme', themeSettings);
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

  // Save all preferences
  const saveAllPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.put('/staff/save-all-preferences', {
        notifications: notificationSettings,
        language: languageSettings,
        theme: themeSettings,
        preferences: {
          workPreferences: staffPreferences
        },
        availability: availability
      });
      showSnackbar(response.data.message || 'All settings saved!', 'success');
      
      if (user) {
        updateUser({
          ...user,
          preferences: response.data.data
        });
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      showSnackbar(error.response?.data?.message || 'Failed to save preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const response = await api.delete('/auth/deleteaccount', {
        data: { confirmation: deleteConfirmation }
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

  if (!user) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Staff category icon mapping
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'pothole': return <Warning />;
      case 'lighting': return <Lightbulb />;
      case 'drainage': return <WaterDrop />;
      case 'garbage': return <DeleteSweep />;
      case 'signage': return <Signpost />;
      default: return <Build />;
    }
  };

  // Get category name
  const getCategoryName = (category) => {
    switch (category) {
      case 'pothole': return 'Pothole Repair';
      case 'lighting': return 'Street Lighting';
      case 'drainage': return 'Drainage Systems';
      case 'garbage': return 'Waste Management';
      case 'signage': return 'Signage & Signals';
      default: return 'General Maintenance';
    }
  };

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

  const shifts = [
    { value: 'morning', label: 'Morning (6AM - 2PM)' },
    { value: 'afternoon', label: 'Afternoon (2PM - 10PM)' },
    { value: 'evening', label: 'Evening (10PM - 6AM)' },
    { value: 'flexible', label: 'Flexible' },
  ];

  const mapTypes = [
    { value: 'standard', label: 'Standard' },
    { value: 'satellite', label: 'Satellite' },
    { value: 'terrain', label: 'Terrain' },
    { value: 'hybrid', label: 'Hybrid' },
  ];

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

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
              Staff Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your work preferences, notifications, and account settings
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Left Sidebar - Navigation */}
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
                    { index: 1, icon: <WorkIcon />, text: 'Work Preferences', badge: null },
                    { index: 2, icon: <ScheduleIcon />, text: 'Availability', badge: null },
                    { index: 3, icon: <LanguageIcon />, text: 'Language & Region', badge: null },
                    { index: 4, icon: <SecurityIcon />, text: 'Security', badge: null },
                    { index: 5, icon: <AccountIcon />, text: 'Account', badge: null },
                    { index: 6, icon: <ThemeIcon />, text: 'Appearance', badge: null },
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
                      {item.badge && (
                        <Chip label={item.badge} size="small" sx={{ ml: 1 }} />
                      )}
                    </ListItem>
                  ))}
                </List>

                {/* Staff Summary Card */}
                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4CAF50&color=fff&size=80`}
                        sx={{ width: 60, height: 60, mr: 2 }}
                      >
                        {user.name?.charAt(0)?.toUpperCase() || 'S'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {user.role === 'staff' ? 'Staff Member' : user.role}
                        </Typography>
                        {user.staffCategory && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            {getCategoryIcon(user.staffCategory)}
                            <Typography variant="caption" sx={{ ml: 0.5 }}>
                              {getCategoryName(user.staffCategory)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    
                  </CardContent>
                </Card>
              </Paper>
            </Grid>

            {/* Main Content Area */}
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
                      Staff Notifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Configure how you receive work-related notifications and alerts.
                    </Typography>

                    <List>
                      {/* Work Assignment Notifications */}
                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, ml: 2 }}>
                        Work Assignments
                      </Typography>
                      
                      <ListItem>
                        <ListItemIcon>
                          <Assignment />
                        </ListItemIcon>
                        <ListItemText 
                          primary="New Assignments" 
                          secondary="Get notified when new tasks are assigned"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            checked={notificationSettings.newAssignments}
                            onChange={handleNotificationChange('newAssignments')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <Task />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Assignment Updates" 
                          secondary="Updates on assigned tasks"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            checked={notificationSettings.assignmentUpdates}
                            onChange={handleNotificationChange('assignmentUpdates')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          
                        </ListItemIcon>
                        <ListItemText 
                          primary="Emergency Reports" 
                          secondary="Immediate alerts for urgent issues"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            checked={notificationSettings.emergencyReports}
                            onChange={handleNotificationChange('emergencyReports')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <CheckCircle />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Report Resolved" 
                          secondary="When reports you worked on are resolved"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            checked={notificationSettings.reportResolved}
                            onChange={handleNotificationChange('reportResolved')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <Divider sx={{ my: 2 }} />

                      {/* Daily Updates */}
                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, ml: 2 }}>
                        Daily Updates
                      </Typography>

                      <ListItem>
                        <ListItemIcon>
                          <Report />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Daily Summary" 
                          secondary="End-of-day work summary"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            checked={notificationSettings.dailySummary}
                            onChange={handleNotificationChange('dailySummary')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <Email />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Feedback Received" 
                          secondary="When citizens provide feedback on your work"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            checked={notificationSettings.feedbackReceived}
                            onChange={handleNotificationChange('feedbackReceived')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <Divider sx={{ my: 2 }} />

                      {/* Alert Settings */}
                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, ml: 2 }}>
                        Alert Settings
                      </Typography>

                      <ListItem>
                        <ListItemText 
                          primary="Priority Alerts" 
                          secondary="High-priority assignment alerts"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            checked={notificationSettings.priorityAlerts}
                            onChange={handleNotificationChange('priorityAlerts')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText 
                          primary="Shift Reminders" 
                          secondary="Reminders before your shift starts"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            checked={notificationSettings.shiftReminders}
                            onChange={handleNotificationChange('shiftReminders')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText 
                          primary="Team Updates" 
                          secondary="Updates from team members"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            checked={notificationSettings.teamUpdates}
                            onChange={handleNotificationChange('teamUpdates')}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      <Button
                        variant="contained"
                        onClick={saveNotificationSettings}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Save Notification Settings'}
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Work Preferences Tab */}
                {activeTab === 1 && (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Work Preferences
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Configure your work preferences and assignment settings.
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                          <InputLabel>Maximum Daily Assignments</InputLabel>
                          <Select
                            value={staffPreferences.maxAssignments}
                            label="Maximum Daily Assignments"
                            onChange={handleStaffPreferenceChange('maxAssignments')}
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                              <MenuItem key={num} value={num}>
                                {num} {num === 1 ? 'assignment' : 'assignments'}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                          <InputLabel>Preferred Shift</InputLabel>
                          <Select
                            value={staffPreferences.preferredShift}
                            label="Preferred Shift"
                            onChange={handleStaffPreferenceChange('preferredShift')}
                          >
                            {shifts.map(shift => (
                              <MenuItem key={shift.value} value={shift.value}>
                                {shift.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                          <InputLabel>Work Radius (km)</InputLabel>
                          <Select
                            value={staffPreferences.workRadius}
                            label="Work Radius (km)"
                            onChange={handleStaffPreferenceChange('workRadius')}
                          >
                            {[5, 10, 15, 20, 25, 30].map(radius => (
                              <MenuItem key={radius} value={radius}>
                                Within {radius} km
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                          <InputLabel>Map Type</InputLabel>
                          <Select
                            value={staffPreferences.mapType}
                            label="Map Type"
                            onChange={handleStaffPreferenceChange('mapType')}
                          >
                            {mapTypes.map(type => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={staffPreferences.autoAcceptAssignments}
                              onChange={handleStaffPreferenceChange('autoAcceptAssignments')}
                            />
                          }
                          label="Auto-accept new assignments"
                          sx={{ mb: 2 }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={staffPreferences.showEmergencyFirst}
                              onChange={handleStaffPreferenceChange('showEmergencyFirst')}
                            />
                          }
                          label="Show emergency reports first"
                          sx={{ mb: 2 }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={staffPreferences.enableLocationTracking}
                              onChange={handleStaffPreferenceChange('enableLocationTracking')}
                            />
                          }
                          label="Enable location tracking during work hours"
                          sx={{ mb: 2 }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={staffPreferences.notificationSound}
                              onChange={handleStaffPreferenceChange('notificationSound')}
                            />
                          }
                          label="Enable notification sounds"
                          sx={{ mb: 2 }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={staffPreferences.offlineMode}
                              onChange={handleStaffPreferenceChange('offlineMode')}
                            />
                          }
                          label="Enable offline mode for field work"
                        />
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      <Button
                        variant="contained"
                        onClick={saveStaffPreferences}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Save Work Preferences'}
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Availability Tab */}
                {activeTab === 2 && (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Weekly Availability
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Set your weekly availability for work assignments.
                    </Typography>

                    <Grid container spacing={2}>
                      {days.map((day) => (
                        <Grid item xs={12} key={day}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                                {day.charAt(0).toUpperCase() + day.slice(1)}
                              </Typography>
                              <Grid container spacing={2}>
                                {['morning', 'afternoon', 'evening'].map((shift) => (
                                  <Grid item xs={4} key={shift}>
                                    <Card
                                      sx={{
                                        border: availability[day][shift] ? '2px solid' : '1px solid',
                                        borderColor: availability[day][shift] ? 'primary.main' : 'divider',
                                        cursor: 'pointer',
                                        bgcolor: availability[day][shift] ? 'action.selected' : 'background.paper',
                                        '&:hover': { borderColor: 'primary.light' }
                                      }}
                                      onClick={() => handleAvailabilityChange(day, shift)()}
                                    >
                                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                        <Typography variant="caption" display="block">
                                          {shift.charAt(0).toUpperCase() + shift.slice(1)}
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                          {availability[day][shift] ? 'Available' : 'Not Available'}
                                        </Typography>
                                      </CardContent>
                                    </Card>
                                  </Grid>
                                ))}
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      <Button
                        variant="contained"
                        onClick={saveStaffPreferences}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Save Availability'}
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Language & Region Tab */}
                {activeTab === 3 && (
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
                {activeTab === 4 && (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Security Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Manage your password and security preferences.
                    </Typography>

                    {/* Change Password Section */}
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
                  </Box>
                )}

                {/* Account Tab */}
                {activeTab === 5 && (
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
                          label="Staff Category"
                          value={user.staffCategory ? getCategoryName(user.staffCategory) : 'Not Assigned'}
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
                {activeTab === 6 && (
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

                {/* Save All Button */}
                <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={saveAllPreferences}
                    disabled={loading}
                    sx={{ width: '100%' }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Save All Settings'}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Dialogs and Snackbar remain the same */}
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
                Are you sure you want to delete your staff account? This will:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Remove you from all assigned tasks" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Delete your work history and ratings" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Remove your profile from the system" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Notify your supervisor" />
                </ListItem>
              </List>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                To confirm, please type <strong>DELETE MY ACCOUNT</strong> below:
              </Typography>
              <TextField
                fullWidth
                label="Type to confirm"
                variant="outlined"
                sx={{ mt: 2 }}
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                error={deleteConfirmation !== '' && deleteConfirmation !== 'DELETE MY ACCOUNT'}
                helperText={deleteConfirmation !== '' && deleteConfirmation !== 'DELETE MY ACCOUNT' ? 'Must exactly match: DELETE MY ACCOUNT' : ''}
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
                disabled={loading || deleteConfirmation !== 'DELETE MY ACCOUNT'}
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

export default StaffSettingsPage;