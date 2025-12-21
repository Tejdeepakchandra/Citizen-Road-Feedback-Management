import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Avatar,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  CircularProgress,
  Alert,
  Badge,
  Tooltip,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Pending,
  Build,
  PhotoCamera,
  Upload,
  Search,
  FilterList,
  MoreVert,
  LocationOn,
  Schedule,
  PriorityHigh,
  Error,
  Warning,
  Verified,
  Visibility,
  Download,
  Refresh,
  CalendarToday,
  Person,
  Category,
  Map,
  Timeline,
  Chat,
  AttachFile,
  AddPhotoAlternate,
  Task,
  DoneAll,
  ArrowForward,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { staffAPI } from '../../services/api';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

const StaffTasks = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    inReview: 0,
    needsRevision: 0,
  });
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState(null);
  const [taskMenuAnchor, setTaskMenuAnchor] = useState(null);
  const [selectedTaskForMenu, setSelectedTaskForMenu] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, statusFilter, priorityFilter, categoryFilter, searchQuery, tabValue]);

  useEffect(() => {
    // Check if we should refresh (e.g., coming from update progress page)
    const shouldRefresh = sessionStorage.getItem('refreshTasks');
    if (shouldRefresh) {
      fetchTasks();
      sessionStorage.removeItem('refreshTasks');
    }
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Fetching tasks...'); // Debug log
      
      const response = await staffAPI.getMyAssignedReports({
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      });
      
      console.log('✅ API Response:', response.data); // Debug log
      
      const data = response.data.data || [];
      console.log('📊 Tasks data:', data); // Debug log
      
      // Debug each task
      data.forEach((task, index) => {
        console.log(`Task ${index}: ${task.title}`, {
          progress: task.progress,
          status: task.status,
          needsReview: task.needsReview,
          adminApproved: task.adminApproved,
          adminRejected: task.adminRejected,
          progressFieldExists: 'progress' in task,
        });
      });
      
      setTasks(data);
      
      // Calculate stats with new statuses
      const total = data.length;
      const pending = data.filter(t => t.status === 'assigned' || t.status === 'pending').length;
      const inProgress = data.filter(t => t.status === 'in_progress').length;
      const inReview = data.filter(t => 
        t.status === 'completed' && 
        t.needsReview === true
      ).length;
      const needsRevision = data.filter(t => 
        t.status === 'in_progress' && 
        t.adminRejected === true
      ).length;
      const completed = data.filter(t => 
        t.status === 'completed' && 
        t.adminApproved === true
      ).length;
      
      setStats({ total, pending, inProgress, completed, inReview, needsRevision });
      
    } catch (err) {
      console.error('❌ Failed to fetch tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];
    
    // Apply tab-based filtering
    if (tabValue === 1) { // Assigned tab
      filtered = filtered.filter(task => task.status === 'assigned' || task.status === 'pending');
    } else if (tabValue === 2) { // In Progress tab
      filtered = filtered.filter(task => task.status === 'in_progress');
    } else if (tabValue === 3) { // In Review tab
      filtered = filtered.filter(task => 
        task.status === 'completed' && 
        task.needsReview === true
      );
    } else if (tabValue === 4) { // Needs Revision tab
      filtered = filtered.filter(task => 
        task.status === 'in_progress' && 
        task.adminRejected === true
      );
    } else if (tabValue === 5) { // Completed tab
      filtered = filtered.filter(task => 
        task.status === 'completed' && 
        task.adminApproved === true
      );
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => task.category === categoryFilter);
    }
    
    setFilteredTasks(filtered);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    switch (newValue) {
      case 0: setStatusFilter('all'); break;
      case 1: setStatusFilter('assigned'); break;
      case 2: setStatusFilter('in_progress'); break;
      case 3: setStatusFilter('completed'); break;
      case 4: setStatusFilter('in_progress'); break;
      case 5: setStatusFilter('completed'); break;
      default: setStatusFilter('all');
    }
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setViewDialogOpen(true);
  };

  const handleUpdateProgress = (task) => {
    navigate(`/staff/update-progress/${task._id}`, { state: { task } });
  };

  const handleViewImages = (task) => {
    const allImages = [
      ...(task.beforeImages || []),
      ...(task.images || []),
      ...(task.afterImages || []),
    ];
    setSelectedImages(allImages);
    setImageDialogOpen(true);
  };

  const getStatusColor = (status, needsReview = false, adminApproved = false, adminRejected = false) => {
    // If needs review, show warning color
    if (needsReview === true && status === 'completed') {
      return { bg: alpha('#FF9800', 0.1), color: '#FF9800' };
    }
    
    // If admin rejected and returned for revision
    if (adminRejected === true && status === 'in_progress') {
      return { bg: alpha('#F44336', 0.1), color: '#F44336' };
    }
    
    // If admin approved, show success
    if (adminApproved === true && status === 'completed') {
      return { bg: alpha('#4CAF50', 0.1), color: '#4CAF50' };
    }
    
    switch (status) {
      case 'pending': 
      case 'assigned': 
        return { bg: alpha('#2196F3', 0.1), color: '#2196F3' };
      case 'in_progress': 
        return { bg: alpha('#9C27B0', 0.1), color: '#9C27B0' };
      case 'completed': 
        // Default completed without review (shouldn't happen in workflow)
        return { bg: alpha('#4CAF50', 0.1), color: '#4CAF50' };
      case 'rejected': 
        return { bg: alpha('#F44336', 0.1), color: '#F44336' };
      default: 
        return { bg: alpha('#9E9E9E', 0.1), color: '#9E9E9E' };
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
      return 'Completed';
    }
    
    switch (status) {
      case 'pending': return 'Pending';
      case 'assigned': return 'Assigned';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'rejected': return 'Rejected';
      default: return status?.replace('_', ' ') || 'Unknown';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return { bg: alpha('#F44336', 0.1), color: '#F44336' };
      case 'medium': return { bg: alpha('#FF9800', 0.1), color: '#FF9800' };
      case 'low': return { bg: alpha('#4CAF50', 0.1), color: '#4CAF50' };
      default: return { bg: alpha('#9E9E9E', 0.1), color: '#9E9E9E' };
    }
  };

  const getProgressColor = (progress) => {
    if (progress < 30) return '#F44336';
    if (progress < 70) return '#FF9800';
    return '#4CAF50';
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchTasks(); // Refetch for new page
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    fetchTasks(); // Refetch with new page size
  };

  const TaskCard = ({ task }) => {
    console.log(`🔄 Rendering TaskCard for ${task.title}:`, {
      status: task.status,
      needsReview: task.needsReview,
      adminApproved: task.adminApproved,
      adminRejected: task.adminRejected,
      displayStatus: getStatusText(task.status, task.needsReview, task.adminApproved, task.adminRejected)
    });
    
    const statusText = getStatusText(task.status, task.needsReview, task.adminApproved, task.adminRejected);
    const statusColors = getStatusColor(task.status, task.needsReview, task.adminApproved, task.adminRejected);
    const priorityColors = getPriorityColor(task.priority);
    const progressColor = getProgressColor(task.progress || 0);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          sx={{
            mb: 2,
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(13, 71, 161, 0.05) 100%)',
            border: '1px solid rgba(66, 165, 245, 0.2)',
            boxShadow: '0 4px 20px rgba(13, 71, 161, 0.1)',
            '&:hover': {
              boxShadow: '0 8px 32px rgba(13, 71, 161, 0.2)',
              borderColor: 'rgba(66, 165, 245, 0.4)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#E3F2FD', mb: 0.5 }}>
                  {task.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#90CAF9' }}>
                  {task.category} • {task.severity}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  label={statusText}
                  size="small"
                  sx={{
                    backgroundColor: statusColors.bg,
                    color: statusColors.color,
                    fontWeight: 600,
                    border: `1px solid ${statusColors.color}`,
                  }}
                />
                <Chip
                  label={task.priority}
                  size="small"
                  sx={{
                    backgroundColor: priorityColors.bg,
                    color: priorityColors.color,
                    fontWeight: 600,
                    border: `1px solid ${priorityColors.color}`,
                  }}
                />
              </Box>
            </Box>

            <Typography variant="body2" sx={{ color: '#BBDEFB', mb: 2 }}>
              {task.description?.substring(0, 150)}...
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#90CAF9' }}>
                  Progress
                </Typography>
                <Typography variant="caption" fontWeight={600} sx={{ color: progressColor }}>
                  {task.progress || 0}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={task.progress || 0}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha('#90CAF9', 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    backgroundColor: progressColor,
                  },
                }}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn fontSize="small" sx={{ color: '#90CAF9' }} />
                  <Typography variant="caption" sx={{ color: '#BBDEFB' }}>
                    {task.location?.address?.substring(0, 30)}...
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule fontSize="small" sx={{ color: '#90CAF9' }} />
                  <Typography variant="caption" sx={{ color: '#BBDEFB' }}>
                    {task.estimatedCompletion 
                      ? format(parseISO(task.estimatedCompletion), 'MMM d, yyyy')
                      : 'No deadline'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday fontSize="small" sx={{ color: '#90CAF9' }} />
                  <Typography variant="caption" sx={{ color: '#BBDEFB' }}>
                    {formatDistanceToNow(parseISO(task.createdAt), { addSuffix: true })}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhotoCamera fontSize="small" sx={{ color: '#90CAF9' }} />
                  <Typography variant="caption" sx={{ color: '#BBDEFB' }}>
                    {(task.images?.length || 0) + (task.beforeImages?.length || 0)} images
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>

          <CardActions sx={{ px: 2, pb: 2 }}>
            <Button
              size="small"
              startIcon={<Visibility />}
              onClick={() => handleViewTask(task)}
              sx={{
                color: '#90CAF9',
                '&:hover': {
                  backgroundColor: alpha('#90CAF9', 0.1),
                },
              }}
            >
              View Details
            </Button>
            
            {/* Only show Update Progress if task is not completed/approved */}
            {(task.status !== 'completed' || task.adminApproved !== true) && (
              <Button
                size="small"
                startIcon={<Build />}
                onClick={() => handleUpdateProgress(task)}
                sx={{
                  color: '#FFA726',
                  '&:hover': {
                    backgroundColor: alpha('#FFA726', 0.1),
                  },
                }}
              >
                Update Progress
              </Button>
            )}
            
            <Button
              size="small"
              startIcon={<PhotoCamera />}
              onClick={() => handleViewImages(task)}
              disabled={!task.images?.length && !task.beforeImages?.length}
              sx={{
                color: '#9C27B0',
                '&:hover': {
                  backgroundColor: alpha('#9C27B0', 0.1),
                },
              }}
            >
              View Images
            </Button>
            <IconButton
              size="small"
              onClick={(e) => {
                setSelectedTaskForMenu(task);
                setTaskMenuAnchor(e.currentTarget);
              }}
              sx={{
                ml: 'auto',
                color: '#90CAF9',
              }}
            >
              <MoreVert />
            </IconButton>
          </CardActions>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '60vh',
        background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 100%)',
      }}>
        <CircularProgress sx={{ color: '#90CAF9' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ 
        py: 4,
        background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 100%)',
        minHeight: '100vh',
      }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchTasks}>
              <Refresh /> Retry
            </Button>
          }
          sx={{
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            background: alpha('#F44336', 0.1),
            border: `1px solid ${alpha('#F44336', 0.3)}`,
            color: '#FFCDD2',
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
      background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 100%)',
      minHeight: '100vh',
      color: '#E3F2FD',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography 
                variant="h4" 
                fontWeight={800}
                gutterBottom
                sx={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #90CAF9 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                My Assigned Tasks
              </Typography>
              <Typography variant="body1" sx={{ color: '#BBDEFB' }}>
                Manage and track all tasks assigned to you
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={fetchTasks}
              sx={{
                background: 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2196F3 0%, #1565C0 100%)',
                },
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { label: 'Total Tasks', value: stats.total, color: '#1976D2', icon: <Assignment /> },
            { label: 'Pending', value: stats.pending, color: '#FFA726', icon: <Pending /> },
            { label: 'In Progress', value: stats.inProgress, color: '#9C27B0', icon: <Build /> },
            { label: 'In Review', value: stats.inReview, color: '#FF9800', icon: <Warning /> },
            { label: 'Needs Revision', value: stats.needsRevision, color: '#F44336', icon: <Error /> },
            { label: 'Completed', value: stats.completed, color: '#4CAF50', icon: <CheckCircle /> },
          ].map((stat, index) => (
            <Grid item xs={12} sm={6} md={2} key={index}>
              <Card
                sx={{
                  borderRadius: 3,
                  backdropFilter: 'blur(10px)',
                  background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(13, 71, 161, 0.05) 100%)',
                  border: `1px solid ${alpha(stat.color, 0.3)}`,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: alpha(stat.color, 0.1),
                        color: stat.color,
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight={700} sx={{ color: '#E3F2FD' }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#BBDEFB' }}>
                        {stat.label}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Filters and Tabs */}
        <Paper
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(13, 71, 161, 0.05) 100%)',
            border: '1px solid rgba(66, 165, 245, 0.2)',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                color: '#90CAF9',
                '&.Mui-selected': {
                  color: '#FFFFFF',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#90CAF9',
              },
            }}
          >
            <Tab label="All Tasks" />
            <Tab label="Assigned" />
            <Tab label="In Progress" />
            <Tab label="In Review" />
            <Tab label="Needs Revision" />
            <Tab label="Completed" />
          </Tabs>

          <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#90CAF9' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flexGrow: 1,
                maxWidth: 300,
                '& .MuiOutlinedInput-root': {
                  color: '#E3F2FD',
                  '& fieldset': {
                    borderColor: alpha('#90CAF9', 0.3),
                  },
                  '&:hover fieldset': {
                    borderColor: '#90CAF9',
                  },
                },
              }}
            />

            <Button
              startIcon={<FilterList />}
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                color: '#90CAF9',
                borderColor: alpha('#90CAF9', 0.3),
              }}
              variant="outlined"
            >
              Filters
            </Button>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              PaperProps={{
                sx: {
                  mt: 1,
                  backdropFilter: 'blur(10px)',
                  background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.95) 0%, rgba(13, 71, 161, 0.9) 100%)',
                  border: '1px solid rgba(66, 165, 245, 0.3)',
                },
              }}
            >
              <MenuItem>
                <Typography sx={{ color: '#E3F2FD', fontWeight: 600 }}>Status</Typography>
              </MenuItem>
              {['all', 'assigned', 'in_progress', 'completed'].map((status) => (
                <MenuItem
                  key={status}
                  selected={statusFilter === status}
                  onClick={() => {
                    setStatusFilter(status);
                    setAnchorEl(null);
                  }}
                  sx={{ color: statusFilter === status ? '#90CAF9' : '#BBDEFB' }}
                >
                  {status === 'all' ? 'All Status' : status.replace('_', ' ')}
                </MenuItem>
              ))}
              
              <Divider sx={{ my: 1, borderColor: alpha('#90CAF9', 0.2) }} />
              
              <MenuItem>
                <Typography sx={{ color: '#E3F2FD', fontWeight: 600 }}>Priority</Typography>
              </MenuItem>
              {['all', 'high', 'medium', 'low'].map((priority) => (
                <MenuItem
                  key={priority}
                  selected={priorityFilter === priority}
                  onClick={() => {
                    setPriorityFilter(priority);
                    setAnchorEl(null);
                  }}
                  sx={{ color: priorityFilter === priority ? '#90CAF9' : '#BBDEFB' }}
                >
                  {priority === 'all' ? 'All Priority' : priority}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Paper>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <Paper
            sx={{
              p: 8,
              textAlign: 'center',
              borderRadius: 3,
              backdropFilter: 'blur(10px)',
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(13, 71, 161, 0.05) 100%)',
              border: '1px solid rgba(66, 165, 245, 0.2)',
            }}
          >
            <Typography variant="h6" sx={{ color: '#BBDEFB', mb: 2 }}>
              No tasks found
            </Typography>
            <Typography variant="body2" sx={{ color: '#90CAF9', mb: 3 }}>
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || tabValue !== 0
                ? 'Try adjusting your filters or search query'
                : 'You currently have no tasks assigned'}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchTasks}
              sx={{
                color: '#90CAF9',
                borderColor: alpha('#90CAF9', 0.3),
              }}
            >
              Refresh Tasks
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {filteredTasks.map((task) => (
              <Grid item xs={12} md={6} key={task._id}>
                <TaskCard task={task} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* View Task Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backdropFilter: 'blur(20px)',
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(13, 71, 161, 0.1) 100%)',
              border: '1px solid rgba(66, 165, 245, 0.3)',
              color: '#E3F2FD',
            },
          }}
        >
          {selectedTask && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{selectedTask.title}</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={getStatusText(
                        selectedTask.status, 
                        selectedTask.needsReview, 
                        selectedTask.adminApproved, 
                        selectedTask.adminRejected
                      )}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(
                          selectedTask.status, 
                          selectedTask.needsReview, 
                          selectedTask.adminApproved,
                          selectedTask.adminRejected
                        ).bg,
                        color: getStatusColor(
                          selectedTask.status, 
                          selectedTask.needsReview, 
                          selectedTask.adminApproved,
                          selectedTask.adminRejected
                        ).color,
                        border: `1px solid ${getStatusColor(
                          selectedTask.status, 
                          selectedTask.needsReview, 
                          selectedTask.adminApproved,
                          selectedTask.adminRejected
                        ).color}`,
                      }}
                    />
                    <Chip
                      label={selectedTask.priority}
                      size="small"
                      sx={{
                        backgroundColor: getPriorityColor(selectedTask.priority).bg,
                        color: getPriorityColor(selectedTask.priority).color,
                        border: `1px solid ${getPriorityColor(selectedTask.priority).color}`,
                      }}
                    />
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ color: '#BBDEFB', mb: 3 }}>
                    {selectedTask.description}
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ color: '#90CAF9', mb: 1 }}>
                        Details
                      </Typography>
                      <List dense>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary="Category"
                            secondary={selectedTask.category}
                            primaryTypographyProps={{ sx: { color: '#BBDEFB', fontSize: '0.875rem' } }}
                            secondaryTypographyProps={{ sx: { color: '#E3F2FD', fontSize: '0.875rem' } }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary="Severity"
                            secondary={selectedTask.severity}
                            primaryTypographyProps={{ sx: { color: '#BBDEFB', fontSize: '0.875rem' } }}
                            secondaryTypographyProps={{ sx: { color: '#E3F2FD', fontSize: '0.875rem' } }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary="Location"
                            secondary={selectedTask.location?.address}
                            primaryTypographyProps={{ sx: { color: '#BBDEFB', fontSize: '0.875rem' } }}
                            secondaryTypographyProps={{ sx: { color: '#E3F2FD', fontSize: '0.875rem' } }}
                          />
                        </ListItem>
                      </List>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ color: '#90CAF9', mb: 1 }}>
                        Timeline
                      </Typography>
                      <List dense>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary="Created"
                            secondary={format(parseISO(selectedTask.createdAt), 'PPpp')}
                            primaryTypographyProps={{ sx: { color: '#BBDEFB', fontSize: '0.875rem' } }}
                            secondaryTypographyProps={{ sx: { color: '#E3F2FD', fontSize: '0.875rem' } }}
                          />
                        </ListItem>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary="Estimated Completion"
                            secondary={selectedTask.estimatedCompletion 
                              ? format(parseISO(selectedTask.estimatedCompletion), 'PPpp')
                              : 'Not set'
                            }
                            primaryTypographyProps={{ sx: { color: '#BBDEFB', fontSize: '0.875rem' } }}
                            secondaryTypographyProps={{ sx: { color: '#E3F2FD', fontSize: '0.875rem' } }}
                          />
                        </ListItem>
                        {selectedTask.actualCompletion && (
                          <ListItem sx={{ px: 0 }}>
                            <ListItemText
                              primary="Actual Completion"
                              secondary={format(parseISO(selectedTask.actualCompletion), 'PPpp')}
                              primaryTypographyProps={{ sx: { color: '#BBDEFB', fontSize: '0.875rem' } }}
                              secondaryTypographyProps={{ sx: { color: '#E3F2FD', fontSize: '0.875rem' } }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Grid>
                  </Grid>

                  {/* Progress Section */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ color: '#90CAF9', mb: 1 }}>
                      Progress
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#BBDEFB' }}>
                          Current Progress
                        </Typography>
                        <Typography variant="caption" fontWeight={600} sx={{ color: getProgressColor(selectedTask.progress || 0) }}>
                          {selectedTask.progress || 0}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={selectedTask.progress || 0}
                        sx={{
                          height: 8,
                          borderRadius: 3,
                          backgroundColor: alpha('#90CAF9', 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            backgroundColor: getProgressColor(selectedTask.progress || 0),
                          },
                        }}
                      />
                    </Box>

                    {/* Progress Updates */}
                    {selectedTask.progressUpdates && selectedTask.progressUpdates.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ color: '#90CAF9', mb: 1 }}>
                          Progress Updates
                        </Typography>
                        <List dense>
                          {selectedTask.progressUpdates.slice(-3).reverse().map((update, index) => (
                            <ListItem key={index} sx={{ px: 0 }}>
                              <ListItemText
                                primary={update.description}
                                secondary={format(parseISO(update.timestamp), 'PPpp')}
                                primaryTypographyProps={{ sx: { color: '#E3F2FD', fontSize: '0.875rem' } }}
                                secondaryTypographyProps={{ sx: { color: '#90CAF9', fontSize: '0.75rem' } }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => setViewDialogOpen(false)}
                  sx={{ color: '#90CAF9' }}
                >
                  Close
                </Button>
                {/* Only show Update Progress if task is not completed/approved */}
                {(selectedTask.status !== 'completed' || selectedTask.adminApproved !== true) && (
                  <Button
                    variant="contained"
                    onClick={() => handleUpdateProgress(selectedTask)}
                    sx={{
                      background: 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #2196F3 0%, #1565C0 100%)',
                      },
                    }}
                  >
                    Update Progress
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Image Gallery Dialog */}
        <Dialog
          open={imageDialogOpen}
          onClose={() => setImageDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              backdropFilter: 'blur(20px)',
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(13, 71, 161, 0.1) 100%)',
              border: '1px solid rgba(66, 165, 245, 0.3)',
              color: '#E3F2FD',
            },
          }}
        >
          <DialogTitle>
            Task Images
          </DialogTitle>
          <DialogContent>
            {selectedImages.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PhotoCamera sx={{ fontSize: 48, color: '#90CAF9', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#BBDEFB', mb: 1 }}>
                  No Images Available
                </Typography>
                <Typography variant="body2" sx={{ color: '#90CAF9' }}>
                  This task doesn't have any images yet.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {selectedImages.map((image, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid rgba(66, 165, 245, 0.3)',
                      }}
                    >
                      <Box
                        component="img"
                        src={image.url}
                        alt={`Task image ${index + 1}`}
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'scale(1.02)',
                          },
                          transition: 'transform 0.3s ease',
                        }}
                        onClick={() => window.open(image.url, '_blank')}
                      />
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="caption" sx={{ color: '#90CAF9' }}>
                          {image.description || 'Task Image'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#BBDEFB', display: 'block' }}>
                          {image.uploadedAt && format(parseISO(image.uploadedAt), 'PPpp')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setImageDialogOpen(false)}
              sx={{ color: '#90CAF9' }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Task Actions Menu */}
        <Menu
          anchorEl={taskMenuAnchor}
          open={Boolean(taskMenuAnchor)}
          onClose={() => setTaskMenuAnchor(null)}
          PaperProps={{
            sx: {
              mt: 1,
              backdropFilter: 'blur(10px)',
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.95) 0%, rgba(13, 71, 161, 0.9) 100%)',
              border: '1px solid rgba(66, 165, 245, 0.3)',
            },
          }}
        >
          {/* Only show Update Progress if task is not completed/approved */}
          {(selectedTaskForMenu && 
            (selectedTaskForMenu.status !== 'completed' || selectedTaskForMenu.adminApproved !== true)) && (
            <MenuItem
              onClick={() => {
                if (selectedTaskForMenu) handleUpdateProgress(selectedTaskForMenu);
                setTaskMenuAnchor(null);
              }}
            >
              <Build fontSize="small" sx={{ mr: 1, color: '#90CAF9' }} />
              <Typography sx={{ color: '#E3F2FD' }}>Update Progress</Typography>
            </MenuItem>
          )}
          
          <MenuItem
            onClick={() => {
              if (selectedTaskForMenu) handleViewImages(selectedTaskForMenu);
              setTaskMenuAnchor(null);
            }}
          >
            <PhotoCamera fontSize="small" sx={{ mr: 1, color: '#90CAF9' }} />
            <Typography sx={{ color: '#E3F2FD' }}>View Images</Typography>
          </MenuItem>
          
          <MenuItem
            onClick={() => {
              if (selectedTaskForMenu) navigate(`/staff/upload-images?task=${selectedTaskForMenu._id}`);
              setTaskMenuAnchor(null);
            }}
          >
            <Upload fontSize="small" sx={{ mr: 1, color: '#90CAF9' }} />
            <Typography sx={{ color: '#E3F2FD' }}>Upload New Images</Typography>
          </MenuItem>
          
          <Divider sx={{ my: 1, borderColor: alpha('#90CAF9', 0.2) }} />
          
          <MenuItem
            onClick={() => {
              if (selectedTaskForMenu) handleViewTask(selectedTaskForMenu);
              setTaskMenuAnchor(null);
            }}
          >
            <Visibility fontSize="small" sx={{ mr: 1, color: '#90CAF9' }} />
            <Typography sx={{ color: '#E3F2FD' }}>View Details</Typography>
          </MenuItem>
        </Menu>

        {/* Pagination */}
        {filteredTasks.length > 0 && (
          <Paper
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 3,
              backdropFilter: 'blur(10px)',
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(13, 71, 161, 0.05) 100%)',
              border: '1px solid rgba(66, 165, 245, 0.2)',
            }}
          >
            <TablePagination
              component="div"
              count={tasks.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{
                color: '#E3F2FD',
                '& .MuiTablePagination-selectIcon': {
                  color: '#90CAF9',
                },
                '& .MuiTablePagination-actions': {
                  '& .MuiIconButton-root': {
                    color: '#90CAF9',
                  },
                },
              }}
            />
          </Paper>
        )}
      </motion.div>
    </Container>
  );
};

export default StaffTasks;