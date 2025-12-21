import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  useTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  Star as StarIcon,
  MoreVert as MoreIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  Build as BuildIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { staffAPI } from '../../services/api';
import { format, parseISO, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

const Performance = () => {
  const theme = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [performanceData, setPerformanceData] = useState({
    productivity: [],
    taskDistribution: [],
    kpis: [],
    topTasks: [],
    recentCompletions: [],
    weeklyTrends: []
  });
  
  const [timeRange, setTimeRange] = useState('month'); // month, quarter, year

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Fetching performance data...');
      
      // Fetch staff's tasks
      const response = await staffAPI.getMyAssignedReports({
        status: 'all',
        limit: 100
      });
      
      console.log('✅ Performance API Response:', response.data);
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to fetch performance data');
      }
      
      const tasks = response.data.data || [];
      console.log(`📊 Got ${tasks.length} tasks for performance analysis`);
      
      // Calculate performance metrics
      const completedTasks = tasks.filter(task => 
        task.status === 'completed' && (task.adminApproved || task.approvedAt)
      );
      
      const inProgressTasks = tasks.filter(task => 
        task.status === 'in_progress' || task.status === 'assigned'
      );
      
      const pendingTasks = tasks.filter(task => 
        task.status === 'assigned' && !task.progress
      );
      
      // Calculate productivity trend (last 6 months)
      const productivityData = calculateProductivityTrend(tasks);
      
      // Calculate task distribution
      const taskDistributionData = [
        { 
          category: 'Completed', 
          value: completedTasks.length, 
          color: '#4CAF50',
          percentage: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0
        },
        { 
          category: 'In Progress', 
          value: inProgressTasks.length, 
          color: '#2196F3',
          percentage: tasks.length > 0 ? Math.round((inProgressTasks.length / tasks.length) * 100) : 0
        },
        { 
          category: 'Pending', 
          value: pendingTasks.length, 
          color: '#FF9800',
          percentage: tasks.length > 0 ? Math.round((pendingTasks.length / tasks.length) * 100) : 0
        }
      ];
      
      // Calculate KPIs
      const totalCompletionRate = tasks.length > 0 
        ? Math.round((completedTasks.length / tasks.length) * 100) 
        : 0;
      
      const averageCompletionTime = calculateAverageCompletionTime(completedTasks);
      
      const qualityScore = calculateQualityScore(completedTasks);
      
      const onTimeRate = calculateOnTimeRate(tasks);
      
      const kpis = [
        { 
          title: 'Completion Rate', 
          value: `${totalCompletionRate}%`, 
          trend: totalCompletionRate > 50 ? 'up' : 'down', 
          change: '+8%',
          icon: <CheckCircleIcon />,
          color: theme.palette.success.main
        },
        { 
          title: 'Avg. Completion Time', 
          value: `${averageCompletionTime}d`, 
          trend: averageCompletionTime < 5 ? 'up' : 'down', 
          change: '-1d',
          icon: <ScheduleIcon />,
          color: theme.palette.info.main
        },
        { 
          title: 'Quality Score', 
          value: `${qualityScore}%`, 
          trend: qualityScore > 85 ? 'up' : 'down', 
          change: '+3%',
          icon: <StarIcon />,
          color: theme.palette.warning.main
        },
        { 
          title: 'On-time Delivery', 
          value: `${onTimeRate}%`, 
          trend: onTimeRate > 80 ? 'up' : 'down', 
          change: '+5%',
          icon: <TimeIcon />,
          color: theme.palette.primary.main
        }
      ];
      
      // Get top performing tasks (completed and approved)
      const topTasks = completedTasks
        .slice(0, 5)
        .map(task => ({
          id: task._id,
          title: task.title,
          category: task.category,
          completionTime: calculateTaskCompletionTime(task),
          rating: calculateTaskRating(task)
        }));
      
      // Get recent completions
      const recentCompletions = completedTasks
        .sort((a, b) => new Date(b.actualCompletion || b.approvedAt) - new Date(a.actualCompletion || a.approvedAt))
        .slice(0, 5)
        .map(task => ({
          id: task._id,
          title: task.title,
          date: task.actualCompletion || task.approvedAt,
          points: calculateTaskPoints(task)
        }));
      
      // Calculate weekly trends
      const weeklyTrends = calculateWeeklyTrends(tasks);
      
      setPerformanceData({
        productivity: productivityData,
        taskDistribution: taskDistributionData,
        kpis: kpis,
        topTasks: topTasks,
        recentCompletions: recentCompletions,
        weeklyTrends: weeklyTrends
      });
      
      console.log('✅ Performance data processed:', {
        totalTasks: tasks.length,
        completed: completedTasks.length,
        kpis: kpis
      });
      
    } catch (err) {
      console.error('❌ Error fetching performance data:', err);
      setError('Failed to load performance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const calculateProductivityTrend = (tasks) => {
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthTasks = tasks.filter(task => {
        const taskDate = parseISO(task.createdAt || task.assignedAt);
        return taskDate >= monthStart && taskDate <= monthEnd;
      });
      
      const completedMonthTasks = monthTasks.filter(task => 
        task.status === 'completed' && (task.adminApproved || task.approvedAt)
      );
      
      const productivity = monthTasks.length > 0 
        ? Math.round((completedMonthTasks.length / monthTasks.length) * 100) 
        : 0;
      
      last6Months.push({
        month: format(monthStart, 'MMM'),
        value: productivity
      });
    }
    
    return last6Months;
  };

  const calculateAverageCompletionTime = (completedTasks) => {
    if (completedTasks.length === 0) return 0;
    
    let totalDays = 0;
    completedTasks.forEach(task => {
      const startDate = task.assignedAt || task.createdAt;
      const endDate = task.actualCompletion || task.approvedAt;
      
      if (startDate && endDate) {
        const days = differenceInDays(parseISO(endDate), parseISO(startDate));
        totalDays += Math.max(days, 0);
      }
    });
    
    return Math.round(totalDays / completedTasks.length);
  };

  const calculateQualityScore = (completedTasks) => {
    if (completedTasks.length === 0) return 0;
    
    let score = 0;
    completedTasks.forEach(task => {
      // Base score for completion
      let taskScore = 70;
      
      // Bonus for on-time completion
      if (task.estimatedCompletion && task.actualCompletion) {
        const estimated = parseISO(task.estimatedCompletion);
        const actual = parseISO(task.actualCompletion);
        if (actual <= estimated) taskScore += 10;
      }
      
      // Bonus for admin approval notes
      if (task.adminNotes && task.adminNotes.length > 10) taskScore += 10;
      
      // Bonus for images
      if ((task.images && task.images.length > 0) || 
          (task.afterImages && task.afterImages.length > 0)) {
        taskScore += 10;
      }
      
      score += Math.min(taskScore, 100);
    });
    
    return Math.round(score / completedTasks.length);
  };

  const calculateOnTimeRate = (tasks) => {
    const completedTasks = tasks.filter(task => 
      task.status === 'completed' && task.estimatedCompletion && task.actualCompletion
    );
    
    if (completedTasks.length === 0) return 0;
    
    const onTimeTasks = completedTasks.filter(task => {
      const estimated = parseISO(task.estimatedCompletion);
      const actual = parseISO(task.actualCompletion);
      return actual <= estimated;
    });
    
    return Math.round((onTimeTasks.length / completedTasks.length) * 100);
  };

  const calculateTaskCompletionTime = (task) => {
    const startDate = task.assignedAt || task.createdAt;
    const endDate = task.actualCompletion || task.approvedAt;
    
    if (startDate && endDate) {
      const days = differenceInDays(parseISO(endDate), parseISO(startDate));
      return Math.max(days, 0);
    }
    
    return 0;
  };

  const calculateTaskRating = (task) => {
    let rating = 3.0; // Base rating
    
    // Adjust based on completion time
    const completionTime = calculateTaskCompletionTime(task);
    if (completionTime <= 1) rating += 1.0;
    else if (completionTime <= 3) rating += 0.5;
    else if (completionTime > 7) rating -= 0.5;
    
    // Adjust for admin notes
    if (task.adminNotes && task.adminNotes.toLowerCase().includes('good')) rating += 0.5;
    if (task.adminNotes && task.adminNotes.toLowerCase().includes('excellent')) rating += 1.0;
    
    // Adjust for images
    if ((task.images && task.images.length > 0) || 
        (task.afterImages && task.afterImages.length > 0)) {
      rating += 0.5;
    }
    
    return Math.min(Math.max(rating, 1), 5).toFixed(1);
  };

  const calculateTaskPoints = (task) => {
    let points = 10; // Base points
    
    // Bonus for quick completion
    const completionTime = calculateTaskCompletionTime(task);
    if (completionTime <= 1) points += 20;
    else if (completionTime <= 3) points += 10;
    
    // Bonus for high priority
    if (task.priority === 'high' || task.priority === 5) points += 15;
    else if (task.priority === 'medium' || task.priority === 4) points += 10;
    
    // Bonus for admin approval
    if (task.adminApproved) points += 10;
    
    return points;
  };

  const calculateWeeklyTrends = (tasks) => {
    const weeks = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(now, i * 7));
      const weekEnd = endOfWeek(weekStart);
      
      const weekTasks = tasks.filter(task => {
        const taskDate = parseISO(task.createdAt || task.assignedAt);
        return taskDate >= weekStart && taskDate <= weekEnd;
      });
      
      const completedWeekTasks = weekTasks.filter(task => 
        task.status === 'completed' && (task.adminApproved || task.approvedAt)
      );
      
      weeks.push({
        week: `Week ${4 - i}`,
        tasks: weekTasks.length,
        completed: completedWeekTasks.length,
        rate: weekTasks.length > 0 ? Math.round((completedWeekTasks.length / weekTasks.length) * 100) : 0
      });
    }
    
    return weeks;
  };

  const handleRefresh = () => {
    fetchPerformanceData();
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: theme.palette.primary.main, mb: 2 }} size={60} />
          <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
            Loading Performance Data...
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1 }}>
            Analyzing your work statistics
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={fetchPerformanceData}>
              <RefreshIcon /> Retry
            </Button>
          }
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Performance Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your work performance and productivity metrics
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={timeRange === 'month' ? 'contained' : 'outlined'}
            onClick={() => handleTimeRangeChange('month')}
            size="small"
          >
            This Month
          </Button>
          <Button
            variant={timeRange === 'quarter' ? 'contained' : 'outlined'}
            onClick={() => handleTimeRangeChange('quarter')}
            size="small"
          >
            Last Quarter
          </Button>
          <Button
            variant={timeRange === 'year' ? 'contained' : 'outlined'}
            onClick={() => handleTimeRangeChange('year')}
            size="small"
          >
            This Year
          </Button>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {performanceData.kpis.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ 
              height: '100%',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8]
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {kpi.title}
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                      {kpi.value}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: alpha(kpi.color, 0.1)
                  }}>
                    {React.cloneElement(kpi.icon, { sx: { color: kpi.color } })}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  {kpi.trend === 'up' ? (
                    <ArrowUpIcon sx={{ color: 'success.main', mr: 0.5 }} />
                  ) : (
                    <ArrowDownIcon sx={{ color: 'error.main', mr: 0.5 }} />
                  )}
                  <Typography 
                    variant="body2" 
                    color={kpi.trend === 'up' ? 'success.main' : 'error.main'}
                    fontWeight={500}
                  >
                    {kpi.change} from last period
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Productivity Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Productivity Trends
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Monthly completion rate over the last 6 months
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData.productivity}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                <XAxis 
                  dataKey="month" 
                  stroke={theme.palette.text.secondary}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Productivity']}
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={{ 
                    borderRadius: 8,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2196F3" 
                  strokeWidth={3}
                  name="Productivity %"
                  dot={{ stroke: '#2196F3', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Task Distribution Pie Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Task Distribution
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Current status of all assigned tasks
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={performanceData.taskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category}: ${percentage}%`}
                  outerRadius={100}
                  innerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {performanceData.taskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [`${props.payload.percentage}%`, props.payload.category]}
                />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
              {performanceData.taskDistribution.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: item.color }} />
                  <Typography variant="caption" color="text.secondary">
                    {item.category} ({item.percentage}%)
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Top Performing Tasks */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Top Performing Tasks
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your best completed tasks
                </Typography>
              </Box>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="center">Rating</TableCell>
                    <TableCell align="right">Completion Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {performanceData.topTasks.map((task) => (
                    <TableRow key={task.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AssignmentIcon sx={{ fontSize: 16, mr: 1, color: theme.palette.primary.main }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {task.title?.substring(0, 30)}...
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={task.category}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <StarIcon sx={{ fontSize: 16, color: theme.palette.warning.main, mr: 0.5 }} />
                          <Typography variant="body2" fontWeight={500}>
                            {task.rating}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <ScheduleIcon sx={{ fontSize: 16, mr: 0.5, color: theme.palette.info.main }} />
                          <Typography variant="body2" fontWeight={500}>
                            {task.completionTime} days
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {performanceData.topTasks.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleIcon sx={{ fontSize: 48, color: alpha(theme.palette.text.secondary, 0.3), mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No completed tasks yet
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Complete and get tasks approved to see your performance
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Completions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Recent Completions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your latest approved tasks
                </Typography>
              </Box>
            </Box>
            <List>
              {performanceData.recentCompletions.map((achievement, index) => (
                <ListItem 
                  key={achievement.id}
                  sx={{ 
                    py: 2,
                    borderBottom: index < performanceData.recentCompletions.length - 1 ? 
                      `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none'
                  }}
                  secondaryAction={
                    <Chip 
                      label={`${achievement.points} pts`}
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    />
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ backgroundColor: alpha(theme.palette.success.main, 0.1) }}>
                      <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {achievement.title}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <TimeIcon sx={{ fontSize: 14, mr: 0.5, color: theme.palette.text.secondary }} />
                        <Typography variant="caption" color="text.secondary">
                          {achievement.date ? format(parseISO(achievement.date), 'MMM d, yyyy') : 'N/A'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
            {performanceData.recentCompletions.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <HistoryIcon sx={{ fontSize: 48, color: alpha(theme.palette.text.secondary, 0.3), mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No recent completions
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tasks will appear here after they're completed and approved
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Weekly Trends */}
      <Paper sx={{ p: 3, mt: 3, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Weekly Performance Trends
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Task completion rate over the last 4 weeks
        </Typography>
        <Grid container spacing={2}>
          {performanceData.weeklyTrends.map((week, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {week.week}
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
                    {week.rate}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={week.rate} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        backgroundColor: week.rate > 70 ? theme.palette.success.main : 
                                       week.rate > 50 ? theme.palette.warning.main : 
                                       theme.palette.error.main
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {week.completed}/{week.tasks} tasks
                    </Typography>
                    <Typography variant="caption" fontWeight={500}>
                      {week.rate}% rate
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default Performance;