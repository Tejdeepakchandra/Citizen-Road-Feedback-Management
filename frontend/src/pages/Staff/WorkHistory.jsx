import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Avatar,
  LinearProgress,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  History,
  CalendarToday,
  LocationOn,
  CheckCircle,
  Build,
  Assignment,
  Search,
  FilterList,
  Download,
  Refresh,
  Visibility,
  PhotoCamera,
  Timeline as TimelineIcon,
  TrendingUp,
  Category,
  Person,
  DateRange,
  ArrowForward,
  Error,
  Warning,
  Verified,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab'
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { staffAPI } from '../../services/api';
import { format, parseISO, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, isToday, isThisWeek, isThisMonth } from 'date-fns';

const WorkHistory = () => {
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
    completed: 0,
    inProgress: 0,
    inReview: 0,
    needsRevision: 0,
    avgCompletionTime: 0,
  });
  
  // Filter states
  const [timeFilter, setTimeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchWorkHistory();
  }, [timeFilter]);

  useEffect(() => {
    filterTasks();
  }, [tasks, statusFilter, categoryFilter, searchQuery]);

  const fetchWorkHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate date range based on filter
      let startDate;
      const now = new Date();
      
      switch (timeFilter) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = startOfWeek(now);
          break;
        case 'month':
          startDate = startOfMonth(now);
          break;
        case 'quarter':
          startDate = subDays(now, 90);
          break;
        default:
          startDate = null;
      }
      
      const params = {};
      if (startDate) {
        params.createdAt_gte = startDate.toISOString();
      }
      
      const response = await staffAPI.getMyTasks(params);
      
      // Debug log the response
      console.log('WorkHistory API Response:', response);
      
      // Extract data based on the API response structure
      let data = [];
      if (response.data && response.data.data) {
        data = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data && response.data.reports) {
        data = response.data.reports;
      } else if (response.data && response.data.tasks) {
        data = response.data.tasks;
      } else if (response.data && response.data.success) {
        data = response.data.data || [];
      } else {
        data = response.data ? [response.data] : [];
      }
      
      console.log('Processed tasks data:', data);
      
      // Process tasks with proper status logic
      const processedTasks = data.map((task) => {
        console.log(`Processing task ${task._id}:`, {
          status: task.status,
          needsReview: task.needsReview,
          adminApproved: task.adminApproved,
          adminRejected: task.adminRejected,
          adminNotes: task.adminNotes,
          rejectionReason: task.rejectionReason,
          approvedAt: task.approvedAt,
          rejectedAt: task.rejectedAt,
          actualCompletion: task.actualCompletion,
          completedAt: task.completedAt,
          completionTime: task.completionTime
        });
        
        // CORRECT STATUS LOGIC BASED ON ISSUE:
        // 1. Check if task has adminApproved field
        // 2. If not, check for completion indicators
        // 3. Use default logic for undefined fields
        
        const adminApproved = task.adminApproved || false;
        const adminRejected = task.adminRejected || false;
        const needsReview = task.needsReview || false;
        
        // If status is 'completed' but adminApproved is undefined,
        // we need to check other indicators
        let isActuallyCompleted = false;
        let isActuallyInReview = false;
        
        if (task.status === 'completed') {
          if (adminApproved === true) {
            isActuallyCompleted = true;
            isActuallyInReview = false;
          } else if (adminRejected === true) {
            isActuallyCompleted = false;
            isActuallyInReview = false;
          } else if (adminApproved === undefined || adminApproved === false) {
            // Check for other completion indicators
            if (task.approvedAt || task.actualCompletion || task.completedAt) {
              // Has some completion timestamp, assume approved
              isActuallyCompleted = true;
              isActuallyInReview = false;
            } else {
              // No approval indicators, assume in review
              isActuallyCompleted = false;
              isActuallyInReview = true;
            }
          }
        }
        
        return {
          ...task,
          needsReview: isActuallyInReview,
          adminApproved: isActuallyCompleted,
          adminRejected: adminRejected,
          progress: task.progress || 0,
          // Ensure we have actual completion date
          actualCompletion: task.actualCompletion || task.completedAt || task.approvedAt
        };
      });
      
      setTasks(processedTasks);
      
      // Apply time filter to calculate stats
      let filteredData = [...processedTasks];
      if (timeFilter !== 'all') {
        filteredData = filteredData.filter(task => {
          const taskDate = parseISO(task.createdAt || task.assignedAt || task.date);
          switch (timeFilter) {
            case 'today':
              return isToday(taskDate);
            case 'week':
              return isThisWeek(taskDate);
            case 'month':
              return isThisMonth(taskDate);
            case 'quarter':
              return isWithinInterval(taskDate, {
                start: subDays(now, 90),
                end: now
              });
            default:
              return true;
          }
        });
      }
      
      // Calculate stats with corrected logic
      const completedTasks = filteredData.filter(task => {
        // A task is completed when:
        // 1. status is 'completed' AND adminApproved is true
        // OR if adminApproved is undefined but has approval indicators
        return task.status === 'completed' && 
               (task.adminApproved === true || 
                task.approvedAt || 
                task.actualCompletion);
      });
      
      const inProgressTasks = filteredData.filter(task => 
        (task.status === 'in_progress' || task.status === 'assigned') && 
        task.adminRejected !== true
      );
      
      const inReviewTasks = filteredData.filter(task => 
        task.status === 'completed' && 
        task.needsReview === true
      );
      
      const needsRevisionTasks = filteredData.filter(task => 
        task.adminRejected === true
      );
      
      // Calculate average completion time (only for completed approved tasks)
      const totalCompletionTime = completedTasks.reduce((acc, task) => {
        const completionDate = task.actualCompletion || task.approvedAt || task.completedAt;
        if (completionDate && task.assignedAt) {
          const diff = new Date(completionDate) - new Date(task.assignedAt);
          return acc + (diff / (1000 * 60 * 60 * 24)); // Convert to days
        }
        return acc;
      }, 0);
      
      const avgCompletionTime = completedTasks.length > 0 
        ? totalCompletionTime / completedTasks.length 
        : 0;
      
      console.log('Stats calculated:', {
        total: filteredData.length,
        completed: completedTasks.length,
        inProgress: inProgressTasks.length,
        inReview: inReviewTasks.length,
        needsRevision: needsRevisionTasks.length,
        completedTasks: completedTasks.map(t => ({ 
          id: t._id, 
          title: t.title, 
          status: t.status, 
          adminApproved: t.adminApproved,
          approvedAt: t.approvedAt,
          actualCompletion: t.actualCompletion
        }))
      });
      
      setStats({
        total: filteredData.length,
        completed: completedTasks.length,
        inProgress: inProgressTasks.length,
        inReview: inReviewTasks.length,
        needsRevision: needsRevisionTasks.length,
        avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
      });
      
    } catch (err) {
      console.error('Failed to fetch work history:', err);
      setError('Failed to load work history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];
    
    // Apply time filter first
    if (timeFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(task => {
        const taskDate = parseISO(task.createdAt || task.assignedAt || task.date);
        switch (timeFilter) {
          case 'today':
            return isToday(taskDate);
          case 'week':
            return isThisWeek(taskDate);
          case 'month':
            return isThisMonth(taskDate);
          case 'quarter':
            return isWithinInterval(taskDate, {
              start: subDays(now, 90),
              end: now
            });
          default:
            return true;
        }
      });
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter with corrected logic
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => {
        switch (statusFilter) {
          case 'completed_approved':
            return task.status === 'completed' && 
                   (task.adminApproved === true || 
                    task.approvedAt || 
                    task.actualCompletion);
          case 'in_review':
            return task.status === 'completed' && 
                   task.needsReview === true;
          case 'in_progress':
            return (task.status === 'in_progress' || task.status === 'assigned') && 
                   task.adminRejected !== true;
          case 'needs_revision':
            return task.adminRejected === true;
          case 'assigned':
            return task.status === 'assigned';
          default:
            return task.status === statusFilter;
        }
      });
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => task.category === categoryFilter);
    }
    
    setFilteredTasks(filtered);
    setPage(0); // Reset to first page when filters change
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter);
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setViewDialogOpen(true);
  };

  const getStatusColor = (status, needsReview = false, adminApproved = false, adminRejected = false, approvedAt = null, actualCompletion = null) => {
    // If admin rejected, show error color
    if (adminRejected === true) {
      return { bg: alpha('#F44336', 0.1), color: '#F44336' };
    }
    
    // If needs review, show warning color
    if (needsReview === true) {
      return { bg: alpha('#FF9800', 0.1), color: '#FF9800' };
    }
    
    // If admin approved OR has approval indicators, show success
    if (adminApproved === true || approvedAt || actualCompletion) {
      return { bg: alpha('#4CAF50', 0.1), color: '#4CAF50' };
    }
    
    switch (status) {
      case 'pending': 
        return { bg: alpha('#757575', 0.1), color: '#757575' };
      case 'assigned': 
        return { bg: alpha('#2196F3', 0.1), color: '#2196F3' };
      case 'in_progress': 
        return { bg: alpha('#9C27B0', 0.1), color: '#9C27B0' };
      case 'completed': 
        // Default completed without approval (should be "In Review")
        return { bg: alpha('#FF9800', 0.1), color: '#FF9800' };
      case 'rejected': 
        return { bg: alpha('#F44336', 0.1), color: '#F44336' };
      default: 
        return { bg: alpha('#9E9E9E', 0.1), color: '#9E9E9E' };
    }
  };

  const getStatusText = (status, needsReview = false, adminApproved = false, adminRejected = false, approvedAt = null, actualCompletion = null) => {
    if (adminRejected === true) {
      return 'Needs Revision';
    }
    
    if (needsReview === true) {
      return 'In Review';
    }
    
    if (adminApproved === true || approvedAt || actualCompletion) {
      return 'Completed';
    }
    
    switch (status) {
      case 'pending': return 'Pending';
      case 'assigned': return 'Assigned';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'In Review'; // Default for completed without approval
      case 'rejected': return 'Rejected';
      default: return status?.replace('_', ' ') || 'Unknown';
    }
  };

  const getCompletionTimeColor = (days) => {
    if (days <= 1) return '#4CAF50'; // Green for <= 1 day
    if (days <= 3) return '#FF9800'; // Orange for <= 3 days
    return '#F44336'; // Red for > 3 days
  };

  const getProgressColor = (progress) => {
    if (progress < 30) return '#F44336';
    if (progress < 70) return '#FF9800';
    return '#4CAF50';
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getTimeFilterLabel = (filter) => {
    switch (filter) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'quarter': return 'Last 3 Months';
      default: return 'All Time';
    }
  };

  const getTimelineIcon = (status, needsReview, adminApproved, adminRejected, approvedAt, actualCompletion) => {
    if (adminRejected) {
      return <Error />;
    } else if (adminApproved || approvedAt || actualCompletion) {
      return <CheckCircle />;
    } else if (needsReview) {
      return <Warning />;
    } else if (status === 'completed') {
      return <CheckCircle />;
    } else if (status === 'in_progress') {
      return <Build />;
    } else if (status === 'assigned') {
      return <Assignment />;
    } else {
      return <Assignment />;
    }
  };

  const StatCard = ({ icon, label, value, color, subtitle }) => (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        backdropFilter: 'blur(10px)',
        background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(13, 71, 161, 0.05) 100%)',
        border: `1px solid ${alpha(color, 0.3)}`,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 32px ${alpha(color, 0.2)}`,
        },
        transition: 'all 0.3s ease',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: alpha(color, 0.1),
              color: color,
            }}
          >
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ color: '#E3F2FD' }}>
              {value}
            </Typography>
            <Typography variant="body2" sx={{ color: '#BBDEFB' }}>
              {label}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: '#90CAF9' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const TimeFilterButton = ({ filter, label, icon }) => (
    <Button
      variant={timeFilter === filter ? 'contained' : 'outlined'}
      startIcon={icon}
      onClick={() => handleTimeFilterChange(filter)}
      sx={{
        borderRadius: 2,
        textTransform: 'none',
        ...(timeFilter === filter
          ? {
              background: 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)',
              color: '#FFFFFF',
            }
          : {
              color: '#90CAF9',
              borderColor: alpha('#90CAF9', 0.3),
              '&:hover': {
                borderColor: '#90CAF9',
                backgroundColor: alpha('#90CAF9', 0.1),
              },
            }),
      }}
    >
      {label}
    </Button>
  );

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
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
            <Button color="inherit" size="small" onClick={fetchWorkHistory}>
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
            Work History
          </Typography>
          <Typography variant="body1" sx={{ color: '#BBDEFB' }}>
            Track your completed work and performance over time
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              icon={<History />}
              label="Total Tasks"
              value={stats.total}
              color="#1976D2"
              subtitle={getTimeFilterLabel(timeFilter)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              icon={<CheckCircle />}
              label="Completed"
              value={stats.completed}
              color="#4CAF50"
              subtitle="Approved by admin"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              icon={<Warning />}
              label="In Review"
              value={stats.inReview}
              color="#FF9800"
              subtitle="Awaiting approval"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              icon={<Error />}
              label="Needs Revision"
              value={stats.needsRevision}
              color="#F44336"
              subtitle="Returned by admin"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              icon={<TimelineIcon />}
              label="Avg. Completion"
              value={`${stats.avgCompletionTime}d`}
              color="#9C27B0"
              subtitle="Days per task"
            />
          </Grid>
        </Grid>

        {/* Time Filter Buttons */}
        <Paper
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(13, 71, 161, 0.05) 100%)',
            border: '1px solid rgba(66, 165, 245, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TimeFilterButton filter="all" label="All Time" icon={<History />} />
            <TimeFilterButton filter="today" label="Today" icon={<CalendarToday />} />
            <TimeFilterButton filter="week" label="This Week" icon={<DateRange />} />
            <TimeFilterButton filter="month" label="This Month" icon={<CalendarToday />} />
            <TimeFilterButton filter="quarter" label="Last 3 Months" icon={<TrendingUp />} />
          </Box>
        </Paper>

        {/* Filters and Tabs */}
        <Paper
          sx={{
            p: 2,
            mb: 3,
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
              mb: 2,
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
            <Tab label="List View" />
            <Tab label="Timeline View" />
            <Tab label="Analytics" />
          </Tabs>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search work history..."
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

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: '#90CAF9' }}>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="completed_approved">Completed</MenuItem>
                <MenuItem value="in_review">In Review</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="needs_revision">Needs Revision</MenuItem>
                <MenuItem value="assigned">Assigned</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: '#90CAF9' }}>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
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
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="pothole">Pothole</MenuItem>
                <MenuItem value="lighting">Lighting</MenuItem>
                <MenuItem value="drainage">Drainage</MenuItem>
                <MenuItem value="garbage">Garbage</MenuItem>
                <MenuItem value="signboard">Signboard</MenuItem>
              </Select>
            </FormControl>

            <Button
              startIcon={<Refresh />}
              onClick={fetchWorkHistory}
              sx={{
                color: '#90CAF9',
                borderColor: alpha('#90CAF9', 0.3),
              }}
              variant="outlined"
            >
              Refresh
            </Button>
          </Box>
        </Paper>

        {/* Main Content based on Tab */}
        {tabValue === 0 ? (
          /* List View */
          <Paper
            sx={{
              borderRadius: 3,
              backdropFilter: 'blur(10px)',
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(13, 71, 161, 0.05) 100%)',
              border: '1px solid rgba(66, 165, 245, 0.2)',
              overflow: 'hidden',
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#90CAF9', fontWeight: 600 }}>Task</TableCell>
                    <TableCell sx={{ color: '#90CAF9', fontWeight: 600 }}>Category</TableCell>
                    <TableCell sx={{ color: '#90CAF9', fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ color: '#90CAF9', fontWeight: 600 }}>Progress</TableCell>
                    <TableCell sx={{ color: '#90CAF9', fontWeight: 600 }}>Assigned</TableCell>
                    <TableCell sx={{ color: '#90CAF9', fontWeight: 600 }}>Completed</TableCell>
                    <TableCell sx={{ color: '#90CAF9', fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" sx={{ color: '#90CAF9' }}>
                          No tasks found for the selected filters
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTasks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((task) => {
                      const statusText = getStatusText(
                        task.status, 
                        task.needsReview, 
                        task.adminApproved, 
                        task.adminRejected,
                        task.approvedAt,
                        task.actualCompletion
                      );
                      const statusColors = getStatusColor(
                        task.status, 
                        task.needsReview, 
                        task.adminApproved,
                        task.adminRejected,
                        task.approvedAt,
                        task.actualCompletion
                      );
                      
                      // Calculate completion time
                      let completionTime = null;
                      const completionDate = task.actualCompletion || task.approvedAt || task.completedAt;
                      if (completionDate && task.assignedAt) {
                        completionTime = ((new Date(completionDate) - new Date(task.assignedAt)) / (1000 * 60 * 60 * 24)).toFixed(1);
                      }
                      
                      const progressColor = getProgressColor(task.progress || 0);
                      
                      return (
                        <TableRow 
                          key={task._id}
                          hover 
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: alpha('#1976D2', 0.05),
                              cursor: 'pointer'
                            },
                          }}
                          onClick={() => handleViewTask(task)}
                        >
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={500} sx={{ color: '#E3F2FD' }}>
                                {task.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#90CAF9' }}>
                                {task.description?.substring(0, 50)}...
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={task.category}
                              size="small"
                              sx={{
                                backgroundColor: alpha('#1976D2', 0.1),
                                color: '#90CAF9',
                                border: `1px solid ${alpha('#90CAF9', 0.3)}`,
                              }}
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
                                  width: 60,
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: alpha('#90CAF9', 0.1),
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                    backgroundColor: progressColor,
                                  },
                                }}
                              />
                              <Typography variant="caption" sx={{ color: '#BBDEFB', minWidth: 30 }}>
                                {task.progress || 0}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#E3F2FD' }}>
                              {format(parseISO(task.createdAt || task.assignedAt || task.date), 'MMM d')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {completionDate ? (
                              <Box>
                                <Typography variant="body2" sx={{ color: '#E3F2FD' }}>
                                  {format(parseISO(completionDate), 'MMM d')}
                                </Typography>
                                {completionTime && (
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: getCompletionTimeColor(completionTime),
                                    }}
                                  >
                                    {completionTime} days
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Typography variant="caption" sx={{ color: '#FFA726' }}>
                                {statusText === 'In Review' ? 'Awaiting review' : 'Not completed'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTask(task);
                              }}
                              sx={{
                                color: '#90CAF9',
                                '&:hover': {
                                  backgroundColor: alpha('#90CAF9', 0.1),
                                },
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {filteredTasks.length > 0 && (
              <TablePagination
                component="div"
                count={filteredTasks.length}
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
            )}
          </Paper>
        ) : tabValue === 1 ? (
          /* Timeline View */
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              backdropFilter: 'blur(10px)',
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(13, 71, 161, 0.05) 100%)',
              border: '1px solid rgba(66, 165, 245, 0.2)',
            }}
          >
            <Typography variant="h6" sx={{ color: '#E3F2FD', mb: 3 }}>
              Work Timeline
            </Typography>
            
            {filteredTasks.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" sx={{ color: '#90CAF9' }}>
                  No tasks found for the selected filters
                </Typography>
              </Box>
            ) : (
              <Timeline position="alternate">
                {filteredTasks.slice(0, 10).map((task, index) => {
                  const statusText = getStatusText(
                    task.status, 
                    task.needsReview, 
                    task.adminApproved, 
                    task.adminRejected,
                    task.approvedAt,
                    task.actualCompletion
                  );
                  const statusColors = getStatusColor(
                    task.status, 
                    task.needsReview, 
                    task.adminApproved,
                    task.adminRejected,
                    task.approvedAt,
                    task.actualCompletion
                  );
                  
                  return (
                    <TimelineItem key={task._id}>
                      <TimelineOppositeContent
                        sx={{ 
                          color: '#90CAF9',
                          flex: 0.2,
                          textAlign: 'right',
                          pr: 2,
                        }}
                      >
                        <Typography variant="caption">
                          {format(parseISO(task.createdAt || task.assignedAt || task.date), 'MMM d, yyyy')}
                        </Typography>
                        {task.actualCompletion && (
                          <Typography variant="caption" sx={{ display: 'block', color: '#BBDEFB' }}>
                            Completed: {format(parseISO(task.actualCompletion), 'MMM d')}
                          </Typography>
                        )}
                        {task.approvedAt && (
                          <Typography variant="caption" sx={{ display: 'block', color: '#4CAF50' }}>
                            Approved: {format(parseISO(task.approvedAt), 'MMM d')}
                          </Typography>
                        )}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot
                          sx={{ 
                            backgroundColor: statusColors.color,
                            boxShadow: `0 0 10px ${alpha(statusColors.color, 0.5)}`,
                          }}
                        >
                          {getTimelineIcon(
                            task.status, 
                            task.needsReview, 
                            task.adminApproved, 
                            task.adminRejected,
                            task.approvedAt,
                            task.actualCompletion
                          )}
                        </TimelineDot>
                        {index < filteredTasks.length - 1 && (
                          <TimelineConnector sx={{ backgroundColor: alpha('#90CAF9', 0.3) }} />
                        )}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Card
                          sx={{
                            backgroundColor: alpha('#1565C0', 0.1),
                            border: `1px solid ${alpha('#90CAF9', 0.3)}`,
                            borderRadius: 2,
                            '&:hover': {
                              backgroundColor: alpha('#1565C0', 0.2),
                            },
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ color: '#E3F2FD' }}>
                                {task.title}
                              </Typography>
                              <Chip
                                label={statusText}
                                size="small"
                                sx={{
                                  backgroundColor: statusColors.bg,
                                  color: statusColors.color,
                                  border: `1px solid ${statusColors.color}`,
                                }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ color: '#BBDEFB', mb: 1 }}>
                              {task.category} • {task.severity}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#90CAF9' }}>
                              {task.description?.substring(0, 80)}...
                            </Typography>
                            
                            {/* Show additional info based on status */}
                            {(statusText === 'In Review') && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                <Warning sx={{ fontSize: 16, color: '#FF9800' }} />
                                <Typography variant="caption" sx={{ color: '#FF9800' }}>
                                  Awaiting admin approval
                                </Typography>
                              </Box>
                            )}
                            
                            {(statusText === 'Needs Revision' && task.rejectionReason) && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                <ThumbDown sx={{ fontSize: 16, color: '#F44336' }} />
                                <Typography variant="caption" sx={{ color: '#F44336' }}>
                                  {task.rejectionReason}
                                </Typography>
                              </Box>
                            )}
                            
                            {(statusText === 'Completed' && task.adminNotes) && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                <ThumbUp sx={{ fontSize: 16, color: '#4CAF50' }} />
                                <Typography variant="caption" sx={{ color: '#4CAF50' }}>
                                  {task.adminNotes}
                                </Typography>
                              </Box>
                            )}
                            
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                              <Button
                                size="small"
                                endIcon={<ArrowForward />}
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
                            </Box>
                          </CardContent>
                        </Card>
                      </TimelineContent>
                    </TimelineItem>
                  );
                })}
              </Timeline>
            )}
          </Paper>
        ) : (
          /* Analytics View */
          <Grid container spacing={3}>
            {/* Category Distribution */}
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  backdropFilter: 'blur(10px)',
                  background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(13, 71, 161, 0.05) 100%)',
                  border: '1px solid rgba(66, 165, 245, 0.2)',
                  height: '100%',
                }}
              >
                <Typography variant="h6" sx={{ color: '#E3F2FD', mb: 3 }}>
                  Category Distribution
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {['pothole', 'lighting', 'drainage', 'garbage', 'signboard'].map((category) => {
                    const categoryTasks = filteredTasks.filter(t => t.category === category);
                    const percentage = filteredTasks.length > 0 
                      ? (categoryTasks.length / filteredTasks.length) * 100 
                      : 0;
                    
                    return (
                      <Box key={category} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ color: '#BBDEFB', textTransform: 'capitalize' }}>
                            {category}
                          </Typography>
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#E3F2FD' }}>
                            {categoryTasks.length} ({Math.round(percentage)}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: alpha('#90CAF9', 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              backgroundColor: '#90CAF9',
                            },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            </Grid>

            {/* Status Distribution */}
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  backdropFilter: 'blur(10px)',
                  background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(13, 71, 161, 0.05) 100%)',
                  border: '1px solid rgba(66, 165, 245, 0.2)',
                  height: '100%',
                }}
              >
                <Typography variant="h6" sx={{ color: '#E3F2FD', mb: 3 }}>
                  Status Distribution
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {[
                    { label: 'Completed', value: stats.completed, color: '#4CAF50', icon: <CheckCircle /> },
                    { label: 'In Review', value: stats.inReview, color: '#FF9800', icon: <Warning /> },
                    { label: 'Needs Revision', value: stats.needsRevision, color: '#F44336', icon: <Error /> },
                    { label: 'In Progress', value: stats.inProgress, color: '#9C27B0', icon: <Build /> },
                  ].map((status) => {
                    const percentage = stats.total > 0 
                      ? (status.value / stats.total) * 100 
                      : 0;
                    
                    return (
                      <Box key={status.label} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Box sx={{ color: status.color }}>
                            {status.icon}
                          </Box>
                          <Typography variant="body2" sx={{ color: '#BBDEFB', flex: 1 }}>
                            {status.label}
                          </Typography>
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#E3F2FD', minWidth: 40 }}>
                            {status.value}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#90CAF9', minWidth: 40 }}>
                            ({Math.round(percentage)}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: alpha('#90CAF9', 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              backgroundColor: status.color,
                            },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            </Grid>

            {/* Performance Metrics */}
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  backdropFilter: 'blur(10px)',
                  background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(13, 71, 161, 0.05) 100%)',
                  border: '1px solid rgba(66, 165, 245, 0.2)',
                }}
              >
                <Typography variant="h6" sx={{ color: '#E3F2FD', mb: 3 }}>
                  Performance Metrics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4} md={2.4}>
                    <Card
                      sx={{
                        p: 2,
                        backgroundColor: alpha('#4CAF50', 0.1),
                        border: `1px solid ${alpha('#4CAF50', 0.3)}`,
                        borderRadius: 2,
                        textAlign: 'center',
                        height: '100%',
                      }}
                    >
                      <Typography variant="h4" fontWeight={700} sx={{ color: '#4CAF50' }}>
                        {stats.completed}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#BBDEFB', display: 'block' }}>
                        Approved Tasks
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2.4}>
                    <Card
                      sx={{
                        p: 2,
                        backgroundColor: alpha('#1976D2', 0.1),
                        border: `1px solid ${alpha('#1976D2', 0.3)}`,
                        borderRadius: 2,
                        textAlign: 'center',
                        height: '100%',
                      }}
                    >
                      <Typography variant="h4" fontWeight={700} sx={{ color: '#90CAF9' }}>
                        {stats.avgCompletionTime}d
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#BBDEFB', display: 'block' }}>
                        Avg. Completion Time
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2.4}>
                    <Card
                      sx={{
                        p: 2,
                        backgroundColor: alpha('#FF9800', 0.1),
                        border: `1px solid ${alpha('#FF9800', 0.3)}`,
                        borderRadius: 2,
                        textAlign: 'center',
                        height: '100%',
                      }}
                    >
                      <Typography variant="h4" fontWeight={700} sx={{ color: '#FF9800' }}>
                        {stats.inReview}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#BBDEFB', display: 'block' }}>
                        In Review
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2.4}>
                    <Card
                      sx={{
                        p: 2,
                        backgroundColor: alpha('#F44336', 0.1),
                        border: `1px solid ${alpha('#F44336', 0.3)}`,
                        borderRadius: 2,
                        textAlign: 'center',
                        height: '100%',
                      }}
                    >
                      <Typography variant="h4" fontWeight={700} sx={{ color: '#F44336' }}>
                        {stats.needsRevision}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#BBDEFB', display: 'block' }}>
                        Needs Revision
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2.4}>
                    <Card
                      sx={{
                        p: 2,
                        backgroundColor: alpha('#9C27B0', 0.1),
                        border: `1px solid ${alpha('#9C27B0', 0.3)}`,
                        borderRadius: 2,
                        textAlign: 'center',
                        height: '100%',
                      }}
                    >
                      <Typography variant="h4" fontWeight={700} sx={{ color: '#9C27B0' }}>
                        {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#BBDEFB', display: 'block' }}>
                        Approval Rate
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Task Details Dialog */}
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
                  <Chip
                    label={getStatusText(
                      selectedTask.status, 
                      selectedTask.needsReview, 
                      selectedTask.adminApproved, 
                      selectedTask.adminRejected,
                      selectedTask.approvedAt,
                      selectedTask.actualCompletion
                    )}
                    size="small"
                    sx={{
                      backgroundColor: getStatusColor(
                        selectedTask.status, 
                        selectedTask.needsReview, 
                        selectedTask.adminApproved,
                        selectedTask.adminRejected,
                        selectedTask.approvedAt,
                        selectedTask.actualCompletion
                      ).bg,
                      color: getStatusColor(
                        selectedTask.status, 
                        selectedTask.needsReview, 
                        selectedTask.adminApproved,
                        selectedTask.adminRejected,
                        selectedTask.approvedAt,
                        selectedTask.actualCompletion
                      ).color,
                      border: `1px solid ${getStatusColor(
                        selectedTask.status, 
                        selectedTask.needsReview, 
                        selectedTask.adminApproved,
                        selectedTask.adminRejected,
                        selectedTask.approvedAt,
                        selectedTask.actualCompletion
                      ).color}`,
                    }}
                  />
                </Box>
              </DialogTitle>
              <DialogContent>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ color: '#BBDEFB', mb: 3 }}>
                    {selectedTask.description}
                  </Typography>

                  <Grid container spacing={3} sx={{ mb: 3 }}>
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
                            primary="Assigned"
                            secondary={format(parseISO(selectedTask.createdAt || selectedTask.assignedAt || selectedTask.date), 'PPpp')}
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
                        {selectedTask.approvedAt && (
                          <ListItem sx={{ px: 0 }}>
                            <ListItemText
                              primary="Approved"
                              secondary={format(parseISO(selectedTask.approvedAt), 'PPpp')}
                              primaryTypographyProps={{ sx: { color: '#BBDEFB', fontSize: '0.875rem' } }}
                              secondaryTypographyProps={{ sx: { color: '#4CAF50', fontSize: '0.875rem' } }}
                            />
                          </ListItem>
                        )}
                        {selectedTask.rejectedAt && (
                          <ListItem sx={{ px: 0 }}>
                            <ListItemText
                              primary="Rejected"
                              secondary={format(parseISO(selectedTask.rejectedAt), 'PPpp')}
                              primaryTypographyProps={{ sx: { color: '#BBDEFB', fontSize: '0.875rem' } }}
                              secondaryTypographyProps={{ sx: { color: '#F44336', fontSize: '0.875rem' } }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Grid>
                  </Grid>

                  {/* Admin Notes / Rejection Reason */}
                  {(selectedTask.adminNotes || selectedTask.rejectionReason) && (
                    <Box sx={{ mt: 2, mb: 3 }}>
                      {selectedTask.adminNotes && (
                        <Box sx={{ mb: selectedTask.rejectionReason ? 2 : 0 }}>
                          <Typography variant="subtitle2" sx={{ color: '#4CAF50', mb: 1 }}>
                            <ThumbUp sx={{ fontSize: 16, mr: 1 }} />
                            Admin Approval Notes
                          </Typography>
                          <Card
                            sx={{
                              backgroundColor: alpha('#4CAF50', 0.1),
                              border: `1px solid ${alpha('#4CAF50', 0.3)}`,
                              p: 2,
                            }}
                          >
                            <Typography variant="body2" sx={{ color: '#BBDEFB' }}>
                              {selectedTask.adminNotes}
                            </Typography>
                          </Card>
                        </Box>
                      )}
                      {selectedTask.rejectionReason && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#F44336', mb: 1 }}>
                            <ThumbDown sx={{ fontSize: 16, mr: 1 }} />
                            Rejection Reason
                          </Typography>
                          <Card
                            sx={{
                              backgroundColor: alpha('#F44336', 0.1),
                              border: `1px solid ${alpha('#F44336', 0.3)}`,
                              p: 2,
                            }}
                          >
                            <Typography variant="body2" sx={{ color: '#BBDEFB' }}>
                              {selectedTask.rejectionReason}
                            </Typography>
                          </Card>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Progress Section */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#90CAF9', mb: 1 }}>
                      Progress: {selectedTask.progress || 0}%
                    </Typography>
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
                </Box>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => setViewDialogOpen(false)}
                  sx={{ color: '#90CAF9' }}
                >
                  Close
                </Button>
                {(selectedTask.status !== 'completed' || selectedTask.adminApproved !== true) && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      setViewDialogOpen(false);
                      navigate(`/staff/update-progress/${selectedTask._id}`);
                    }}
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
      </motion.div>
    </Container>
  );
};

export default WorkHistory;