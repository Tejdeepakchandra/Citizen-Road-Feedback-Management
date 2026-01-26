import React, { useState, useEffect } from 'react';
import {
  Grid,
  Box,
  Typography,
  Container,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Snackbar,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assignment,
  Build,
  CheckCircle,
  Pending,
  PhotoCamera,
  Upload,
  Timeline,
  CalendarToday,
  LocationOn,
  PriorityHigh,
  Info,
  AddPhotoAlternate,
  Task,
  DoneAll,
  Schedule,
  People,
  Construction,
  History,
  Assessment,
  Refresh,
  Download,
  MoreVert,
  Timer,
  Error,
  AttachMoney,
  NotificationsActive,
  Storage,
  BarChart,
  Flag,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { staffAPI } from '../../services/api';
import { format, subDays } from 'date-fns';

const StaffDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [tasks, setTasks] = useState([]);
  
  // Dialog states
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Form states
  const [progressForm, setProgressForm] = useState({
    status: '',
    progress: 0,
    description: '',
    images: []
  });
  
  const [uploadForm, setUploadForm] = useState({
    type: 'progress',
    description: '',
    files: []
  });
  
  const [submitForm, setSubmitForm] = useState({
    completionNotes: '',
    afterImagesDescription: '',
    files: []
  });
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch staff dashboard data
      const dashboardResponse = await staffAPI.getMyDashboard();
      const dashboard = dashboardResponse.data.data;
      setDashboardData(dashboard);

      // Fetch assigned tasks
      const tasksResponse = await staffAPI.getMyTasks({ status: 'active', limit: 10 });
      setTasks(tasksResponse.data.data || []);

    } catch (err) {
      console.error('Failed to fetch staff dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'staff') {
      fetchDashboardData();
    }
  }, [user]);

  const handleProgressUpdate = (task) => {
    setSelectedTask(task);
    setProgressForm({
      status: task.status,
      progress: task.progress || 0,
      description: '',
      images: []
    });
    setProgressDialogOpen(true);
  };

  const handleProgressSubmit = async () => {
    try {
      await staffAPI.updateReportProgress(selectedTask._id, {
        status: progressForm.status,
        progress: progressForm.progress,
        description: progressForm.description
      });
      
      setSnackbar({
        open: true,
        message: 'Progress updated successfully',
        severity: 'success'
      });
      
      fetchDashboardData();
      setProgressDialogOpen(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update progress',
        severity: 'error'
      });
    }
  };

  const handleTaskComplete = (task) => {
    setSelectedTask(task);
    setSubmitDialogOpen(true);
  };

  const handleTaskSubmit = async () => {
    try {
      await staffAPI.markReportComplete(selectedTask._id, {
        completionNotes: submitForm.completionNotes,
        afterImagesDescription: submitForm.afterImagesDescription
      });

      setSnackbar({
        open: true,
        message: 'Task submitted for admin review',
        severity: 'success'
      });

      fetchDashboardData();
      setSubmitDialogOpen(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to submit task',
        severity: 'error'
      });
    }
  };

  const handleFileUpload = async () => {
    try {
      const formData = new FormData();
      uploadForm.files.forEach(file => {
        formData.append('images', file);
      });
      formData.append('type', uploadForm.type);
      formData.append('description', uploadForm.description);

      await staffAPI.uploadWorkImages(selectedTask._id, formData);

      setSnackbar({
        open: true,
        message: 'Images uploaded successfully',
        severity: 'success'
      });

      setUploadDialogOpen(false);
      fetchDashboardData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to upload images',
        severity: 'error'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return theme.palette.warning.main;
      case 'assigned': return theme.palette.info.main;
      case 'in_progress': return theme.palette.secondary.main;
      case 'completed': return theme.palette.success.main;
      case 'resolved': return theme.palette.grey[500];
      default: return theme.palette.grey[400];
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <PriorityHigh sx={{ color: theme.palette.error.main }} />;
      case 'medium': return <PriorityHigh sx={{ color: theme.palette.warning.main }} />;
      case 'low': return <PriorityHigh sx={{ color: theme.palette.success.main }} />;
      default: return <Info sx={{ color: theme.palette.grey[500] }} />;
    }
  };

  const StatCard = ({ title, value, icon, change, color, onClick, subtitle }) => {
    const cardColor = color || theme.palette.primary.main;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          onClick={onClick}
          sx={{
            cursor: onClick ? 'pointer' : 'default',
            height: '100%',
            borderRadius: 3,
            backdropFilter: 'blur(20px)',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(55, 65, 181, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(79, 70, 229, 0.08) 100%)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 20px 40px ${alpha(cardColor, 0.3)}`,
              borderColor: alpha(cardColor, 0.4),
            },
            transition: 'all 0.3s ease',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: alpha(cardColor, 0.15),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${alpha(cardColor, 0.3)}`,
                  boxShadow: `0 0 20px ${alpha(cardColor, 0.2)}`,
                }}
              >
                {React.cloneElement(icon, { 
                  sx: { 
                    fontSize: 24,
                    color: cardColor,
                  }
                })}
              </Box>
              {change !== undefined && (
                <Chip
                  icon={change > 0 ? <TrendingUp /> : <TrendingDown />}
                  label={`${Math.abs(change)}%`}
                  size="small"
                  sx={{
                    backgroundColor: change > 0 ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.error.main, 0.2),
                    color: change > 0 ? theme.palette.success.main : theme.palette.error.main,
                    fontWeight: 600,
                    border: `1px solid ${change > 0 ? alpha(theme.palette.success.main, 0.3) : alpha(theme.palette.error.main, 0.3)}`,
                  }}
                />
              )}
            </Box>
            <Typography 
              variant="h3" 
              fontWeight={800}
              sx={{
                background: `linear-gradient(45deg, #FFFFFF 30%, ${cardColor} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5,
                textShadow: `0 0 20px ${alpha(cardColor, 0.3)}`,
              }}
            >
              {value}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  display: 'block',
                  mt: 0.5,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const QuickActionButton = ({ icon, label, onClick, color = 'primary' }) => {
    const buttonColors = {
      primary: { main: theme.palette.primary.main, light: theme.palette.primary.light },
      secondary: { main: theme.palette.secondary.main, light: theme.palette.secondary.light },
      warning: { main: theme.palette.warning.main, light: theme.palette.warning.main },
      success: { main: theme.palette.success.main, light: theme.palette.success.main },
      info: { main: theme.palette.info.main, light: theme.palette.info.main },
    };

    const colorSet = buttonColors[color] || buttonColors.primary;

    return (
      <Button
        variant="outlined"
        startIcon={icon}
        onClick={onClick}
        sx={{
          borderRadius: 2,
          py: 1.5,
          px: 3,
          backdropFilter: 'blur(10px)',
          background: alpha(colorSet.main, 0.1),
          border: `2px solid ${alpha(colorSet.main, 0.3)}`,
          color: colorSet.light,
          fontWeight: 600,
          fontSize: '0.875rem',
          '&:hover': {
            background: alpha(colorSet.main, 0.2),
            borderColor: colorSet.light,
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 20px ${alpha(colorSet.main, 0.3)}`,
          },
          transition: 'all 0.3s ease',
        }}
      >
        {label}
      </Button>
    );
  };

  const getStaffCategoryColor = () => {
    const colors = {
      pothole: "#FFA726", // Orange
      lighting: "#29B6F6", // Light Blue
      drainage: "#66BB6A", // Green
      garbage: "#EF5350", // Red
      signboard: "#AB47BC", // Purple
    };
    return colors[user?.staffCategory] || "#1976D2"; // Default to Navy Blue
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '60vh',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)'
          : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
      }}>
        <CircularProgress sx={{ color: theme.palette.secondary.main }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ 
        py: 4,
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%)',
        minHeight: '100vh',
      }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchDashboardData}>
              <Refresh /> Retry
            </Button>
          }
          sx={{
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            background: alpha(theme.palette.error.main, 0.1),
            border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
            color: theme.palette.error.light,
          }}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ 
      py: 4,
      background: theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
        : 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%)',
      minHeight: '100vh',
      color: theme.palette.text.primary,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography 
                variant="h2" 
                fontWeight={800} 
                gutterBottom
                sx={{
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #A5B4FC 0%, #818CF8 100%)'
                    : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
                  textShadow: theme.palette.mode === 'dark' ? '0 0 30px rgba(165, 180, 252, 0.5)' : '0 0 30px rgba(99, 102, 241, 0.3)',
                }}
              >
                Staff Dashboard
              </Typography>
              <Typography 
                variant="h6" 
                sx={{
                  fontWeight: 400,
                  opacity: 0.9,
                  maxWidth: '600px',
                  color: theme.palette.text.secondary,
                }}
              >
                Welcome back, {user?.name || 'Staff Member'} • {user?.staffCategory || 'General'} Specialist
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchDashboardData}
                sx={{
                  backdropFilter: 'blur(10px)',
                  background: alpha(theme.palette.primary.main, 0.1),
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.2),
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ mb: 6 }}>
          <Typography 
            variant="h5" 
            fontWeight={700}
            sx={{
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #A5B4FC 0%, #818CF8 100%)'
                : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3,
            }}
          >
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <QuickActionButton
              icon={<Assignment />}
              label="View All Tasks"
              onClick={() => navigate('/staff/tasks')}
              color="primary"
            />
            <QuickActionButton
              icon={<AddPhotoAlternate />}
              label="Upload Images"
              onClick={() => navigate('/staff/upload-images')}
              color="secondary"
            />
            <QuickActionButton
              icon={<Build />}
              label="Update Progress"
              onClick={() => navigate('/staff/update-progress')}
              color="warning"
            />
            <QuickActionButton
              icon={<Assessment />}
              label="My Performance"
              onClick={() => navigate('/staff/performance')}
              color="success"
            />
            <QuickActionButton
              icon={<History />}
              label="Work History"
              onClick={() => navigate('/staff/history')}
              color="info"
            />
          </Box>
        </Box>

        {/* Summary Stats */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Assigned Tasks"
              value={dashboardData?.stats?.totalAssigned || 0}
              icon={<Assignment />}
              color="#1976D2"
              onClick={() => navigate('/staff/tasks')}
              subtitle={`${dashboardData?.stats?.pendingTasks || 0} pending`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="In Progress"
              value={dashboardData?.inProgressTasks || 0}
              icon={<Build />}
              color="#FFA726"
              onClick={() => navigate('/staff/tasks?status=in_progress')}
              subtitle="Active tasks"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Completed"
              value={dashboardData?.stats?.totalCompleted || 0}
              icon={<CheckCircle />}
              color="#66BB6A"
              onClick={() => navigate('/staff/tasks?status=completed')}
              subtitle={`${dashboardData?.stats?.completedToday || 0} today`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Completion Rate"
              value={`${dashboardData?.stats?.completionRate || 0}%`}
              icon={<TrendingUp />}
              color="#AB47BC"
              onClick={() => navigate('/staff/performance')}
              subtitle="Overall performance"
            />
          </Grid>
        </Grid>

        {/* Main Content */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {/* Task List */}
          <Grid item xs={12} lg={8}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                backdropFilter: 'blur(20px)',
                background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(13, 71, 161, 0.1) 100%)',
                border: '1px solid rgba(66, 165, 245, 0.3)',
                boxShadow: '0 8px 32px rgba(13, 71, 161, 0.3)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography 
                    variant="h6" 
                    fontWeight={600}
                    sx={{
                      background: 'linear-gradient(45deg, #FFFFFF 30%, #90CAF9 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    My Tasks
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={() => navigate('/staff/tasks')}
                    sx={{
                      color: '#90CAF9',
                      borderColor: alpha('#90CAF9', 0.3),
                      '&:hover': {
                        borderColor: '#90CAF9',
                        backgroundColor: alpha('#90CAF9', 0.1),
                      },
                    }}
                  >
                    View All
                  </Button>
                </Box>

                {tasks.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" sx={{ color: '#BBDEFB', mb: 1 }}>
                      No tasks assigned yet
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#90CAF9' }}>
                      Tasks will appear here when admin assigns them to you
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: '#BBDEFB', fontWeight: 600 }}>Task</TableCell>
                          <TableCell sx={{ color: '#BBDEFB', fontWeight: 600 }}>Status</TableCell>
                          <TableCell sx={{ color: '#BBDEFB', fontWeight: 600 }}>Priority</TableCell>
                          <TableCell sx={{ color: '#BBDEFB', fontWeight: 600 }}>Progress</TableCell>
                          <TableCell sx={{ color: '#BBDEFB', fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tasks.map((task) => (
                          <TableRow 
                            key={task._id}
                            hover 
                            sx={{ 
                              '&:hover': { 
                                backgroundColor: alpha('#1976D2', 0.1),
                                cursor: 'pointer'
                              },
                              borderBottom: `1px solid ${alpha('#42A5F5', 0.1)}`,
                            }}
                            onClick={() => navigate(`/staff/tasks/${task._id}`)}
                          >
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight={500} sx={{ color: '#E3F2FD' }}>
                                  {task.title}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#90CAF9' }}>
                                  {task.category}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={task.status.replace('_', ' ')}
                                size="small"
                                sx={{
                                  backgroundColor: alpha(getStatusColor(task.status), 0.15),
                                  color: getStatusColor(task.status),
                                  fontWeight: 600,
                                  border: `1px solid ${alpha(getStatusColor(task.status), 0.3)}`,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {getPriorityIcon(task.priority)}
                                <Typography variant="caption" sx={{ color: '#90CAF9', textTransform: 'capitalize' }}>
                                  {task.priority}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={task.progress || 0}
                                  sx={{
                                    width: 80,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: alpha('#90CAF9', 0.1),
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 3,
                                      backgroundColor: getStatusColor(task.status),
                                    }
                                  }}
                                />
                                <Typography variant="body2" sx={{ color: '#E3F2FD', minWidth: 35 }}>
                                  {task.progress || 0}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTask(task);
                                    setUploadDialogOpen(true);
                                  }}
                                  sx={{
                                    backgroundColor: alpha('#29B6F6', 0.1),
                                    color: '#29B6F6',
                                    '&:hover': {
                                      backgroundColor: alpha('#29B6F6', 0.2),
                                    }
                                  }}
                                >
                                  <PhotoCamera fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleProgressUpdate(task);
                                  }}
                                  sx={{
                                    backgroundColor: alpha('#FFA726', 0.1),
                                    color: '#FFA726',
                                    '&:hover': {
                                      backgroundColor: alpha('#FFA726', 0.2),
                                    }
                                  }}
                                >
                                  <Build fontSize="small" />
                                </IconButton>
                                {task.progress >= 90 && task.status !== 'completed' && (
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTaskComplete(task);
                                    }}
                                    sx={{
                                      backgroundColor: alpha('#66BB6A', 0.1),
                                      color: '#66BB6A',
                                      '&:hover': {
                                        backgroundColor: alpha('#66BB6A', 0.2),
                                      }
                                    }}
                                  >
                                    <CheckCircle fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity & Quick Stats */}
          <Grid item xs={12} lg={4}>
            {/* Recent Activity */}
            <Card
              sx={{
                borderRadius: 3,
                backdropFilter: 'blur(20px)',
                background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(13, 71, 161, 0.1) 100%)',
                border: '1px solid rgba(66, 165, 245, 0.3)',
                boxShadow: '0 8px 32px rgba(13, 71, 161, 0.3)',
                mb: 3,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="h6" 
                  fontWeight={600}
                  gutterBottom
                  sx={{
                    background: 'linear-gradient(45deg, #FFFFFF 30%, #90CAF9 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 3,
                  }}
                >
                  Recent Activity
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                    dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                      <Paper
                        key={index}
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          backdropFilter: 'blur(10px)',
                          background: alpha('#1565C0', 0.15),
                          border: '1px solid rgba(66, 165, 245, 0.2)',
                          borderRadius: 2,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: alpha(getStaffCategoryColor(), 0.15),
                            color: getStaffCategoryColor(),
                          }}
                        >
                          {activity.updatedBy?.name?.charAt(0) || 'S'}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={500} sx={{ color: '#E3F2FD' }}>
                            {activity.description}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#90CAF9' }}>
                            {activity.status} • {activity.timestamp ? format(new Date(activity.timestamp), 'MMM d, h:mm a') : 'Recently'}
                          </Typography>
                        </Box>
                      </Paper>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: '#90CAF9', textAlign: 'center', py: 4 }}>
                      No recent activity
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card
              sx={{
                borderRadius: 3,
                backdropFilter: 'blur(20px)',
                background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(13, 71, 161, 0.1) 100%)',
                border: '1px solid rgba(66, 165, 245, 0.3)',
                boxShadow: '0 8px 32px rgba(13, 71, 161, 0.3)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="h6" 
                  fontWeight={600}
                  gutterBottom
                  sx={{
                    background: 'linear-gradient(45deg, #FFFFFF 30%, #90CAF9 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 3,
                  }}
                >
                  Performance Summary
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#BBDEFB', mb: 1 }}>
                      Monthly Completion Rate
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={dashboardData?.stats?.completionRate || 0}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha('#90CAF9', 0.1),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: `linear-gradient(90deg, ${getStaffCategoryColor()} 0%, ${alpha(getStaffCategoryColor(), 0.7)} 100%)`,
                        },
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption" sx={{ color: '#90CAF9' }}>
                        0%
                      </Typography>
                      <Typography variant="caption" fontWeight={600} sx={{ color: '#E3F2FD' }}>
                        {dashboardData?.stats?.completionRate || 0}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#90CAF9' }}>
                        100%
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: '#BBDEFB', mb: 1 }}>
                      Tasks Completed Today
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h4" fontWeight={700} sx={{ color: '#66BB6A' }}>
                        {dashboardData?.stats?.completedToday || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#90CAF9' }}>
                        out of 3 daily goal
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ color: '#BBDEFB', mb: 1 }}>
                      Category Distribution
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {dashboardData?.assignedTasks && [...new Set(dashboardData.assignedTasks.map(t => t.category))].map(category => (
                        <Chip
                          key={category}
                          label={category}
                          size="small"
                          sx={{
                            backgroundColor: alpha(getStaffCategoryColor(), 0.15),
                            color: getStaffCategoryColor(),
                            border: `1px solid ${alpha(getStaffCategoryColor(), 0.3)}`,
                            fontWeight: 500,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Update Progress Dialog */}
        <Dialog
          open={progressDialogOpen}
          onClose={() => setProgressDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backdropFilter: 'blur(20px)',
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(13, 71, 161, 0.1) 100%)',
              border: '1px solid rgba(66, 165, 245, 0.3)',
              color: '#E3F2FD',
            }
          }}
        >
          <DialogTitle>
            Update Task Progress
          </DialogTitle>
          <DialogContent>
            {selectedTask && (
              <Box sx={{ pt: 2 }}>
                <Typography variant="body1" paragraph sx={{ color: '#BBDEFB' }}>
                  Updating: <strong sx={{ color: '#E3F2FD' }}>{selectedTask.title}</strong>
                </Typography>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel sx={{ color: '#90CAF9' }}>Status</InputLabel>
                  <Select
                    value={progressForm.status}
                    onChange={(e) => setProgressForm({
                      ...progressForm,
                      status: e.target.value
                    })}
                    label="Status"
                    sx={{ 
                      color: '#E3F2FD',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha('#90CAF9', 0.3),
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#90CAF9',
                      },
                    }}
                  >
                    <MenuItem value="assigned" sx={{ color: '#1565C0' }}>Assigned</MenuItem>
                    <MenuItem value="in_progress" sx={{ color: '#1565C0' }}>In Progress</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ mb: 3 }}>
                  <Typography gutterBottom sx={{ color: '#BBDEFB' }}>
                    Progress: {progressForm.progress}%
                  </Typography>
                  <Slider
                    value={progressForm.progress}
                    onChange={(e, value) => setProgressForm({
                      ...progressForm,
                      progress: value
                    })}
                    aria-labelledby="progress-slider"
                    valueLabelDisplay="auto"
                    sx={{
                      color: getStaffCategoryColor(),
                      '& .MuiSlider-thumb': {
                        '&:hover, &.Mui-focusVisible': {
                          boxShadow: `0 0 0 8px ${alpha(getStaffCategoryColor(), 0.16)}`,
                        },
                      },
                    }}
                  />
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Progress Description"
                  placeholder="Describe the work done..."
                  value={progressForm.description}
                  onChange={(e) => setProgressForm({
                    ...progressForm,
                    description: e.target.value
                  })}
                  sx={{
                    '& .MuiInputLabel-root': { color: '#90CAF9' },
                    '& .MuiOutlinedInput-root': {
                      color: '#E3F2FD',
                      '& fieldset': { 
                        borderColor: alpha('#90CAF9', 0.3),
                        borderWidth: '2px',
                      },
                      '&:hover fieldset': { 
                        borderColor: '#90CAF9',
                      },
                      '&.Mui-focused fieldset': { 
                        borderColor: getStaffCategoryColor(),
                      },
                    },
                    '& .MuiInputBase-input': {
                      '&::placeholder': {
                        color: alpha('#90CAF9', 0.5),
                      },
                    },
                  }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setProgressDialogOpen(false)}
              sx={{ 
                color: '#90CAF9',
                '&:hover': {
                  backgroundColor: alpha('#90CAF9', 0.1),
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleProgressSubmit}
              sx={{
                background: `linear-gradient(135deg, ${getStaffCategoryColor()} 0%, ${alpha(getStaffCategoryColor(), 0.7)} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${alpha(getStaffCategoryColor(), 0.9)} 0%, ${alpha(getStaffCategoryColor(), 0.8)} 100%)`,
                },
              }}
            >
              Update Progress
            </Button>
          </DialogActions>
        </Dialog>

        {/* Upload Images Dialog */}
        <Dialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backdropFilter: 'blur(20px)',
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(13, 71, 161, 0.1) 100%)',
              border: '1px solid rgba(66, 165, 245, 0.3)',
              color: '#E3F2FD',
            }
          }}
        >
          <DialogTitle>
            Upload Work Images
          </DialogTitle>
          <DialogContent>
            {selectedTask && (
              <Box sx={{ pt: 2 }}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel sx={{ color: '#90CAF9' }}>Image Type</InputLabel>
                  <Select
                    value={uploadForm.type}
                    onChange={(e) => setUploadForm({
                      ...uploadForm,
                      type: e.target.value
                    })}
                    label="Image Type"
                    sx={{ 
                      color: '#E3F2FD',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha('#90CAF9', 0.3),
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#90CAF9',
                      },
                    }}
                  >
                    <MenuItem value="progress" sx={{ color: '#1565C0' }}>Progress Update</MenuItem>
                    <MenuItem value="before" sx={{ color: '#1565C0' }}>Before Work</MenuItem>
                    <MenuItem value="after" sx={{ color: '#1565C0' }}>After Work</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  placeholder="Describe these images..."
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({
                    ...uploadForm,
                    description: e.target.value
                  })}
                  sx={{
                    mb: 3,
                    '& .MuiInputLabel-root': { color: '#90CAF9' },
                    '& .MuiOutlinedInput-root': {
                      color: '#E3F2FD',
                      '& fieldset': { 
                        borderColor: alpha('#90CAF9', 0.3),
                        borderWidth: '2px',
                      },
                      '&:hover fieldset': { 
                        borderColor: '#90CAF9',
                      },
                      '&.Mui-focused fieldset': { 
                        borderColor: getStaffCategoryColor(),
                      },
                    },
                  }}
                />

                <Box
                  sx={{
                    border: `2px dashed ${alpha('#90CAF9', 0.3)}`,
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: alpha('#1565C0', 0.05),
                    '&:hover': {
                      borderColor: '#90CAF9',
                      backgroundColor: alpha('#1565C0', 0.1),
                    },
                  }}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setUploadForm({
                      ...uploadForm,
                      files: Array.from(e.target.files)
                    })}
                    style={{
                      color: '#E3F2FD',
                      width: '100%',
                      cursor: 'pointer',
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#90CAF9', mt: 1, display: 'block' }}>
                    Click or drag files to upload
                  </Typography>
                </Box>
                {uploadForm.files.length > 0 && (
                  <Typography variant="body2" sx={{ color: '#66BB6A', mt: 2 }}>
                    Selected {uploadForm.files.length} file(s)
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setUploadDialogOpen(false)}
              sx={{ 
                color: '#90CAF9',
                '&:hover': {
                  backgroundColor: alpha('#90CAF9', 0.1),
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleFileUpload}
              disabled={uploadForm.files.length === 0}
              sx={{
                background: `linear-gradient(135deg, ${getStaffCategoryColor()} 0%, ${alpha(getStaffCategoryColor(), 0.7)} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${alpha(getStaffCategoryColor(), 0.9)} 0%, ${alpha(getStaffCategoryColor(), 0.8)} 100%)`,
                },
                '&.Mui-disabled': {
                  background: alpha('#90CAF9', 0.3),
                  color: alpha('#E3F2FD', 0.5),
                },
              }}
            >
              Upload Images
            </Button>
          </DialogActions>
        </Dialog>

        {/* Submit Task Dialog */}
        <Dialog
          open={submitDialogOpen}
          onClose={() => setSubmitDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backdropFilter: 'blur(20px)',
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(13, 71, 161, 0.1) 100%)',
              border: '1px solid rgba(66, 165, 245, 0.3)',
              color: '#E3F2FD',
            }
          }}
        >
          <DialogTitle>
            Submit Task for Review
          </DialogTitle>
          <DialogContent>
            {selectedTask && (
              <Box sx={{ pt: 2 }}>
                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: 3, 
                    backgroundColor: alpha('#29B6F6', 0.15),
                    color: '#E3F2FD',
                    border: `1px solid ${alpha('#29B6F6', 0.3)}`,
                    '& .MuiAlert-icon': {
                      color: '#29B6F6',
                    },
                  }}
                >
                  Once submitted, admin will review your work and mark it as resolved.
                </Alert>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Completion Notes"
                  placeholder="Describe what work was completed..."
                  value={submitForm.completionNotes}
                  onChange={(e) => setSubmitForm({
                    ...submitForm,
                    completionNotes: e.target.value
                  })}
                  sx={{
                    mb: 3,
                    '& .MuiInputLabel-root': { color: '#90CAF9' },
                    '& .MuiOutlinedInput-root': {
                      color: '#E3F2FD',
                      '& fieldset': { 
                        borderColor: alpha('#90CAF9', 0.3),
                        borderWidth: '2px',
                      },
                      '&:hover fieldset': { 
                        borderColor: '#90CAF9',
                      },
                      '&.Mui-focused fieldset': { 
                        borderColor: '#66BB6A',
                      },
                    },
                  }}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="After Images Description"
                  placeholder="Describe the after repair images..."
                  value={submitForm.afterImagesDescription}
                  onChange={(e) => setSubmitForm({
                    ...submitForm,
                    afterImagesDescription: e.target.value
                  })}
                  sx={{
                    mb: 3,
                    '& .MuiInputLabel-root': { color: '#90CAF9' },
                    '& .MuiOutlinedInput-root': {
                      color: '#E3F2FD',
                      '& fieldset': { 
                        borderColor: alpha('#90CAF9', 0.3),
                        borderWidth: '2px',
                      },
                      '&:hover fieldset': { 
                        borderColor: '#90CAF9',
                      },
                      '&.Mui-focused fieldset': { 
                        borderColor: '#66BB6A',
                      },
                    },
                  }}
                />

                <Box
                  sx={{
                    border: `2px dashed ${alpha('#90CAF9', 0.3)}`,
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: alpha('#1565C0', 0.05),
                    '&:hover': {
                      borderColor: '#90CAF9',
                      backgroundColor: alpha('#1565C0', 0.1),
                    },
                  }}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setSubmitForm({
                      ...submitForm,
                      files: Array.from(e.target.files)
                    })}
                    style={{
                      color: '#E3F2FD',
                      width: '100%',
                      cursor: 'pointer',
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#90CAF9', mt: 1, display: 'block' }}>
                    Upload after-work images (optional)
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setSubmitDialogOpen(false)}
              sx={{ 
                color: '#90CAF9',
                '&:hover': {
                  backgroundColor: alpha('#90CAF9', 0.1),
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleTaskSubmit}
              sx={{
                background: 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #81C784 0%, #66BB6A 100%)',
                },
              }}
            >
              Submit for Review
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{
              backgroundColor: snackbar.severity === 'success' 
                ? alpha('#66BB6A', 0.9) 
                : alpha('#EF5350', 0.9),
              color: '#FFFFFF',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${snackbar.severity === 'success' ? alpha('#81C784', 0.5) : alpha('#EF9A9A', 0.5)}`,
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </motion.div>
    </Container>
  );
};

export default StaffDashboard;