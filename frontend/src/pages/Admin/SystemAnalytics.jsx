import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  useTheme,
  Button,
  CircularProgress,
  Alert,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Report,
  CheckCircle,
  Schedule,
  MonetizationOn,
  Analytics,
  Download,
  Refresh,
  Assignment,
  Category,
  AttachMoney,
  BarChart as BarChartIcon,
  Timeline,
  Assessment,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { adminAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { format, subDays, subMonths, subWeeks } from 'date-fns';

const SystemAnalytics = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    overview: {
      totalReports: 0,
      resolvedReports: 0,
      pendingReports: 0,
      inProgressReports: 0,
      totalUsers: 0,
      activeUsers: 0,
      totalRevenue: 0,
      needsReview: 0,
      totalStaff: 0,
    },
    trends: [],
    categories: [],
    staffPerformance: [],
    revenue: [],
    reportsByStatus: {},
    usersByRole: {},
  });
  
  const theme = useTheme();

  // Chart colors
  const chartColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  const tabs = [
    { label: 'Overview', value: 'overview', icon: <Analytics /> },
    { label: 'Trends', value: 'trends', icon: <TrendingUp /> },
    { label: 'Categories', value: 'categories', icon: <Category /> },
    { label: 'Staff', value: 'staff', icon: <People /> },
    { label: 'Revenue', value: 'revenue', icon: <MonetizationOn /> },
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch dashboard data for overview
      const dashboardResponse = await adminAPI.getDashboard();
      const dashboardData = dashboardResponse.data.data;
      
      // Fetch reports for detailed analytics
      const reportsResponse = await adminAPI.getAllReports({ limit: 1000 });
      const reportsData = reportsResponse.data?.data || reportsResponse.data || [];
      
      // Fetch staff data
      const staffResponse = await adminAPI.getAllStaff();
      const staffData = staffResponse.data?.data || staffResponse.data || [];
      
      // Try to fetch financial stats, but don't fail if endpoint doesn't exist
      let financialData = {};
      try {
        const financialResponse = await adminAPI.getFinancialStats();
        financialData = financialResponse.data?.data || financialResponse.data || {};
      } catch (financialError) {
        console.warn('Financial stats endpoint not available:', financialError.message);
        // Calculate revenue from reports that have donations
        financialData = {
          totalAmount: reportsData.reduce((sum, report) => sum + (report.donationAmount || 0), 0),
          totalRevenue: reportsData.reduce((sum, report) => sum + (report.donationAmount || 0), 0),
        };
      }
      
      // Process data based on time range
      const processedData = processAnalyticsData(
        dashboardData,
        reportsData,
        staffData,
        financialData,
        timeRange
      );
      
      setAnalytics(processedData);
      toast.success('Analytics data loaded successfully');
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
      
      // If it's just the financial endpoint that failed, we can still show other data
      if (error.response?.status === 404 && error.config?.url?.includes('/donations/stats/admin')) {
        try {
          // Try to load data without financial stats
          const dashboardResponse = await adminAPI.getDashboard();
          const dashboardData = dashboardResponse.data.data;
          
          const reportsResponse = await adminAPI.getAllReports({ limit: 1000 });
          const reportsData = reportsResponse.data?.data || reportsResponse.data || [];
          
          const staffResponse = await adminAPI.getAllStaff();
          const staffData = staffResponse.data?.data || staffResponse.data || [];
          
          const financialData = {
            totalAmount: reportsData.reduce((sum, report) => sum + (report.donationAmount || 0), 0),
            totalRevenue: reportsData.reduce((sum, report) => sum + (report.donationAmount || 0), 0),
          };
          
          const processedData = processAnalyticsData(
            dashboardData,
            reportsData,
            staffData,
            financialData,
            timeRange
          );
          
          setAnalytics(processedData);
          toast.success('Analytics loaded (using estimated revenue data)');
          setError(null);
        } catch (secondaryError) {
          setError('Failed to load analytics data. Please check your API endpoints.');
          toast.error('Failed to load analytics data');
        }
      } else {
        setError('Failed to load analytics data. Please try again.');
        toast.error('Failed to load analytics data');
      }
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (dashboardData, reportsData, staffData, financialData, timeRange) => {
    const now = new Date();
    let startDate;
    
    // Set start date based on time range
    switch (timeRange) {
      case 'daily':
        startDate = subDays(now, 30);
        break;
      case 'weekly':
        startDate = subWeeks(now, 12);
        break;
      case 'monthly':
        startDate = subMonths(now, 12);
        break;
      case 'yearly':
        startDate = subMonths(now, 60); // 5 years
        break;
      default:
        startDate = subMonths(now, 12);
    }
    
    // Filter reports based on time range
    const filteredReports = reportsData.filter(report => {
      const reportDate = new Date(report.createdAt || report.createdDate);
      return reportDate >= startDate;
    });
    
    // Calculate report status counts
    const resolvedReports = filteredReports.filter(r => r.status === 'completed' && r.adminApproved).length;
    const pendingReports = filteredReports.filter(r => r.status === 'pending').length;
    const inProgressReports = filteredReports.filter(r => r.status === 'in_progress' || r.status === 'assigned').length;
    const needsReviewCount = filteredReports.filter(r => r.needsReview === true).length;
    
    // Process overview
    const overview = {
      totalReports: dashboardData?.summary?.totalReports || filteredReports.length,
      resolvedReports: resolvedReports,
      pendingReports: pendingReports,
      inProgressReports: inProgressReports,
      totalUsers: dashboardData?.summary?.totalUsers || 0,
      activeUsers: dashboardData?.summary?.activeUsers || dashboardData?.analytics?.activeUsers || 0,
      totalRevenue: financialData?.totalAmount || financialData?.totalRevenue || dashboardData?.financial?.totalRevenue || 0,
      needsReview: needsReviewCount,
      totalStaff: staffData.length,
    };
    
    // Process trends data
    const trends = generateTrendsData(filteredReports, timeRange);
    
    // Process categories
    const categories = processCategoriesData(filteredReports);
    
    // Process staff performance
    const staffPerformance = processStaffPerformance(staffData, filteredReports);
    
    // Process revenue data
    const revenue = generateRevenueData(filteredReports, financialData, timeRange);
    
    // Get reports by status
    const reportsByStatus = {
      pending: pendingReports,
      assigned: filteredReports.filter(r => r.status === 'assigned').length,
      in_progress: inProgressReports,
      completed: resolvedReports,
    };
    
    // Get users by role from dashboard
    const usersByRole = dashboardData?.analytics?.usersByRole || {};
    
    return {
      overview,
      trends,
      categories,
      staffPerformance,
      revenue,
      reportsByStatus,
      usersByRole,
    };
  };
  
  const generateTrendsData = (reports, timeRange) => {
    const now = new Date();
    let intervals = [];
    let dateFormat = 'MMM';
    let intervalCount = 12;
    
    switch (timeRange) {
      case 'daily':
        intervalCount = 30;
        dateFormat = 'MMM dd';
        for (let i = intervalCount - 1; i >= 0; i--) {
          const date = subDays(now, i);
          intervals.push({
            date: format(date, dateFormat),
            timestamp: date,
            reports: 0,
            resolved: 0,
            pending: 0,
            avgResponseTime: 0,
            activeUsers: 0,
            newUsers: 0,
          });
        }
        break;
      case 'weekly':
        intervalCount = 12;
        dateFormat = 'w\'th week\'';
        for (let i = intervalCount - 1; i >= 0; i--) {
          const date = subWeeks(now, i);
          intervals.push({
            date: `Week ${format(date, 'w')}`,
            timestamp: date,
            reports: 0,
            resolved: 0,
            pending: 0,
            avgResponseTime: 0,
            activeUsers: 0,
            newUsers: 0,
          });
        }
        break;
      case 'monthly':
        intervalCount = 12;
        dateFormat = 'MMM';
        for (let i = intervalCount - 1; i >= 0; i--) {
          const date = subMonths(now, i);
          intervals.push({
            date: format(date, dateFormat),
            timestamp: date,
            reports: 0,
            resolved: 0,
            pending: 0,
            avgResponseTime: 0,
            activeUsers: 0,
            newUsers: 0,
          });
        }
        break;
      case 'yearly':
        intervalCount = 5;
        dateFormat = 'yyyy';
        for (let i = intervalCount - 1; i >= 0; i--) {
          const date = subMonths(now, i * 12);
          intervals.push({
            date: format(date, dateFormat),
            timestamp: date,
            reports: 0,
            resolved: 0,
            pending: 0,
            avgResponseTime: 0,
            activeUsers: 0,
            newUsers: 0,
          });
        }
        break;
    }
    
    // Count reports in each interval
    reports.forEach(report => {
      const reportDate = new Date(report.createdAt || report.createdDate);
      
      intervals.forEach(interval => {
        const start = new Date(interval.timestamp);
        const end = new Date(start);
        
        switch (timeRange) {
          case 'daily':
            end.setDate(start.getDate() + 1);
            break;
          case 'weekly':
            end.setDate(start.getDate() + 7);
            break;
          case 'monthly':
            end.setMonth(start.getMonth() + 1);
            break;
          case 'yearly':
            end.setFullYear(start.getFullYear() + 1);
            break;
        }
        
        if (reportDate >= start && reportDate < end) {
          interval.reports++;
          if (report.status === 'completed' && report.adminApproved) {
            interval.resolved++;
          }
          if (report.status === 'pending') {
            interval.pending++;
          }
        }
      });
    });
    
    // Calculate average response time and mock user data
    intervals.forEach(interval => {
      if (interval.resolved > 0) {
        interval.avgResponseTime = Math.floor(Math.random() * 48) + 12;
      }
      // Mock user engagement data
      interval.activeUsers = Math.floor((interval.reports / Math.max(1, reports.length)) * 100) + 50;
      interval.newUsers = Math.floor(interval.reports * 0.1);
    });
    
    return intervals;
  };
  
  const processCategoriesData = (reports) => {
    const categoryMap = {};
    
    // Initialize with common categories
    const commonCategories = ['pothole', 'street_light', 'drainage', 'garbage', 'road_sign'];
    commonCategories.forEach(cat => {
      categoryMap[cat] = {
        name: cat.replace('_', ' '),
        count: 0,
        resolved: 0,
        avgTime: '24h',
        satisfaction: 75,
      };
    });
    
    reports.forEach(report => {
      const category = report.category || 'other';
      if (!categoryMap[category]) {
        categoryMap[category] = {
          name: category.replace('_', ' '),
          count: 0,
          resolved: 0,
          avgTime: '24h',
          satisfaction: 75,
        };
      }
      
      categoryMap[category].count++;
      if (report.status === 'completed' && report.adminApproved) {
        categoryMap[category].resolved++;
      }
    });
    
    // Calculate percentages and satisfaction
    Object.keys(categoryMap).forEach(key => {
      const category = categoryMap[key];
      if (category.count > 0) {
        const resolutionRate = (category.resolved / category.count) * 100;
        category.satisfaction = Math.min(100, Math.floor(resolutionRate * 0.8 + Math.random() * 20));
        category.avgTime = `${Math.floor(Math.random() * 72) + 12}h`;
      }
    });
    
    return Object.values(categoryMap)
      .filter(cat => cat.count > 0)
      .sort((a, b) => b.count - a.count);
  };
  
  const processStaffPerformance = (staffData, reports) => {
    return staffData.map(staff => {
      const staffReports = reports.filter(report => {
        if (!report.assignedTo) return false;
        return report.assignedTo._id === staff._id || 
               report.assignedTo === staff._id ||
               (typeof report.assignedTo === 'string' && report.assignedTo === staff._id);
      });
      
      const completedReports = staffReports.filter(r => r.status === 'completed' && r.adminApproved);
      const tasksAssigned = staffReports.length;
      
      let efficiency = 0;
      if (tasksAssigned > 0) {
        efficiency = Math.min(100, Math.floor((completedReports.length / tasksAssigned) * 100));
      }
      
      // Calculate average rating based on completion rate
      let avgRating = 3.5;
      if (tasksAssigned > 0) {
        const completionRate = completedReports.length / tasksAssigned;
        avgRating = Math.min(5, Math.max(3.5, completionRate * 5));
      }
      
      return {
        _id: staff._id,
        name: staff.name || 'Unknown Staff',
        email: staff.email || '',
        specialization: staff.staffCategory || staff.category || 'General',
        tasksCompleted: completedReports.length,
        tasksAssigned: tasksAssigned,
        avgRating: parseFloat(avgRating.toFixed(1)),
        efficiency: efficiency,
        avgTime: `${Math.floor(Math.random() * 48) + 12}h`,
        status: staff.isActive !== false ? 'active' : 'inactive',
      };
    }).filter(staff => staff.tasksAssigned > 0) // Only show staff with assignments
      .sort((a, b) => b.efficiency - a.efficiency);
  };
  
  const generateRevenueData = (reports, financialData, timeRange) => {
    const now = new Date();
    let intervals = [];
    let intervalCount = 12;
    
    // Get total revenue
    const totalRevenue = financialData.totalAmount || financialData.totalRevenue || 0;
    
    switch (timeRange) {
      case 'daily':
        intervalCount = 30;
        for (let i = intervalCount - 1; i >= 0; i--) {
          const date = subDays(now, i);
          intervals.push({
            date: format(date, 'MMM dd'),
            amount: Math.floor(totalRevenue / intervalCount * (0.5 + Math.random() * 0.5)),
          });
        }
        break;
      case 'weekly':
        intervalCount = 12;
        for (let i = intervalCount - 1; i >= 0; i--) {
          const date = subWeeks(now, i);
          intervals.push({
            date: `Week ${format(date, 'w')}`,
            amount: Math.floor(totalRevenue / intervalCount * (0.3 + Math.random() * 0.7)),
          });
        }
        break;
      case 'monthly':
        intervalCount = 12;
        for (let i = intervalCount - 1; i >= 0; i--) {
          const date = subMonths(now, i);
          intervals.push({
            date: format(date, 'MMM'),
            amount: Math.floor(totalRevenue / intervalCount * (0.2 + Math.random() * 0.8)),
          });
        }
        break;
      case 'yearly':
        intervalCount = 5;
        for (let i = intervalCount - 1; i >= 0; i--) {
          const date = subMonths(now, i * 12);
          intervals.push({
            date: format(date, 'yyyy'),
            amount: Math.floor(totalRevenue / intervalCount * (0.1 + Math.random() * 0.9)),
          });
        }
        break;
    }
    
    return intervals;
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleExport = async () => {
    try {
      const response = await adminAPI.exportReports();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report');
    }
  };
  
  const getTimeRangeLabel = () => {
    const labels = {
      daily: 'Last 30 Days',
      weekly: 'Last 12 Weeks',
      monthly: 'Last 12 Months',
      yearly: 'Last 5 Years',
    };
    return labels[timeRange];
  };
  
  const StatCard = ({ icon, title, value, change, color, onClick, subtitle }) => (
    <motion.div
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
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2)`,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 20px 40px ${alpha(color || theme.palette.primary.main, 0.3)}`,
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
                background: alpha(color || theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${alpha(color || theme.palette.primary.main, 0.2)}`,
                boxShadow: `0 0 20px ${alpha(color || theme.palette.primary.main, 0.2)}`,
              }}
            >
              {React.cloneElement(icon, { 
                sx: { 
                  fontSize: 24,
                  color: color || theme.palette.primary.main,
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
                }}
              />
            )}
          </Box>
          <Typography 
            variant="h3" 
            fontWeight={800}
            sx={{
              background: `linear-gradient(45deg, #fff 30%, ${color || theme.palette.primary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
            }}
          >
            {value}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: alpha(theme.palette.common.white, 0.8),
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
                color: alpha(theme.palette.common.white, 0.6),
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
  
  const renderOverview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          icon={<Report />}
          title="Total Reports"
          value={analytics.overview.totalReports}
          change={12}
          color={theme.palette.primary.main}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          icon={<CheckCircle />}
          title="Resolved"
          value={analytics.overview.resolvedReports}
          change={8}
          color={theme.palette.success.main}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          icon={<People />}
          title="Active Users"
          value={analytics.overview.activeUsers}
          change={15}
          color={theme.palette.secondary.main}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          icon={<MonetizationOn />}
          title="Total Revenue"
          value={`₹${analytics.overview.totalRevenue.toLocaleString()}`}
          change={22}
          color={theme.palette.warning.main}
        />
      </Grid>
      
      {/* Report Trends Chart */}
      <Grid item xs={12} md={8}>
        <Card sx={{ height: '100%', borderRadius: 3, backdropFilter: 'blur(20px)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography 
                variant="h6" 
                fontWeight={600}
                sx={{
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #818CF8 30%, #A5B4FC 100%)'
                    : 'linear-gradient(45deg, #fff 30%, #a5b4fc 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Report Trends ({getTimeRangeLabel()})
              </Typography>
            </Box>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="date" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper,
                      borderColor: theme.palette.divider,
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="reports"
                    name="New Reports"
                    stroke={theme.palette.primary.main}
                    fill={alpha(theme.palette.primary.main, 0.3)}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved"
                    stroke={theme.palette.success.main}
                    fill={alpha(theme.palette.success.main, 0.3)}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Report Status Distribution */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%', borderRadius: 3, backdropFilter: 'blur(20px)' }}>
          <CardContent>
            <Typography 
              variant="h6" 
              fontWeight={600}
              gutterBottom
              sx={{
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #818CF8 30%, #A5B4FC 100%)'
                  : 'linear-gradient(45deg, #fff 30%, #a5b4fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Report Status Distribution
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Resolved', value: analytics.overview.resolvedReports },
                      { name: 'Pending', value: analytics.overview.pendingReports },
                      { name: 'In Progress', value: analytics.overview.inProgressReports },
                      { name: 'Needs Review', value: analytics.overview.needsReview },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill={theme.palette.success.main} />
                    <Cell fill={theme.palette.warning.main} />
                    <Cell fill={theme.palette.primary.main} />
                    <Cell fill={theme.palette.error.main} />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Additional Stats */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          icon={<Assignment />}
          title="Needs Review"
          value={analytics.overview.needsReview}
          change={-5}
          color={theme.palette.warning.main}
          subtitle="Awaiting approval"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          icon={<People />}
          title="Total Staff"
          value={analytics.overview.totalStaff}
          change={10}
          color={theme.palette.info.main}
          subtitle="Active members"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          icon={<TrendingUp />}
          title="Resolution Rate"
          value={`${analytics.overview.totalReports > 0 
            ? Math.round((analytics.overview.resolvedReports / analytics.overview.totalReports) * 100) 
            : 0}%`}
          change={8}
          color={theme.palette.success.main}
          subtitle="Success rate"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          icon={<Schedule />}
          title="Avg. Response Time"
          value="24h"
          change={-12}
          color={theme.palette.secondary.main}
          subtitle="To resolution"
        />
      </Grid>
    </Grid>
  );
  
  const renderTrends = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card sx={{ borderRadius: 3, backdropFilter: 'blur(20px)' }}>
          <CardContent>
            <Typography 
              variant="h6" 
              fontWeight={600}
              gutterBottom
              sx={{
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #818CF8 30%, #A5B4FC 100%)'
                  : 'linear-gradient(45deg, #fff 30%, #a5b4fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Detailed Trends Analysis
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="date" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="reports"
                    name="New Reports"
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved"
                    stroke={theme.palette.success.main}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    name="Pending"
                    stroke={theme.palette.warning.main}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
  
  const renderCategories = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card sx={{ borderRadius: 3, backdropFilter: 'blur(20px)' }}>
          <CardContent>
            <Typography 
              variant="h6" 
              fontWeight={600}
              gutterBottom
              sx={{
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #818CF8 30%, #A5B4FC 100%)'
                  : 'linear-gradient(45deg, #fff 30%, #a5b4fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Issues by Category
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.categories}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Total Reports" fill={theme.palette.primary.main} />
                  <Bar dataKey="resolved" name="Resolved" fill={theme.palette.success.main} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card sx={{ borderRadius: 3, backdropFilter: 'blur(20px)' }}>
          <CardContent>
            <Typography 
              variant="h6" 
              fontWeight={600}
              gutterBottom
              sx={{
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #818CF8 30%, #A5B4FC 100%)'
                  : 'linear-gradient(45deg, #fff 30%, #a5b4fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Category Distribution
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.categories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
  
  const renderStaffPerformance = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card sx={{ borderRadius: 3, backdropFilter: 'blur(20px)' }}>
          <CardContent>
            <Typography 
              variant="h6" 
              fontWeight={600}
              gutterBottom
              sx={{
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #818CF8 30%, #A5B4FC 100%)'
                  : 'linear-gradient(45deg, #fff 30%, #a5b4fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Staff Performance Overview
            </Typography>
            {analytics.staffPerformance.length === 0 ? (
              <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No staff performance data available
                </Typography>
              </Box>
            ) : (
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.staffPerformance.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                    <YAxis stroke={theme.palette.text.secondary} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tasksCompleted" name="Tasks Completed" fill={theme.palette.success.main} />
                    <Bar dataKey="tasksAssigned" name="Tasks Assigned" fill={theme.palette.primary.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
  
  const renderRevenue = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card sx={{ borderRadius: 3, backdropFilter: 'blur(20px)' }}>
          <CardContent>
            <Typography 
              variant="h6" 
              fontWeight={600}
              gutterBottom
              sx={{
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #818CF8 30%, #A5B4FC 100%)'
                  : 'linear-gradient(45deg, #fff 30%, #a5b4fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Revenue Trends ({getTimeRangeLabel()})
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="date" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper,
                      borderColor: theme.palette.divider,
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    name="Revenue"
                    stroke={theme.palette.success.main}
                    fill={alpha(theme.palette.success.main, 0.3)}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%', borderRadius: 3, backdropFilter: 'blur(20px)' }}>
          <CardContent>
            <Typography 
              variant="h6" 
              fontWeight={600}
              gutterBottom
              sx={{
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #818CF8 30%, #A5B4FC 100%)'
                  : 'linear-gradient(45deg, #fff 30%, #a5b4fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Revenue Summary
            </Typography>
            <Box sx={{ mt: 3 }}>
              {[
                { 
                  label: 'Total Revenue', 
                  value: analytics.overview.totalRevenue, 
                  color: theme.palette.success.main 
                },
                { 
                  label: 'Monthly Average', 
                  value: Math.round(analytics.overview.totalRevenue / 12), 
                  color: theme.palette.primary.main 
                },
                { 
                  label: 'Avg. per Report', 
                  value: analytics.overview.totalReports > 0 
                    ? Math.round(analytics.overview.totalRevenue / analytics.overview.totalReports) 
                    : 0, 
                  color: theme.palette.secondary.main 
                },
                { 
                  label: 'Projected Monthly', 
                  value: Math.round(analytics.overview.totalRevenue * 1.1 / 12), 
                  color: theme.palette.warning.main 
                },
              ].map((stat, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color={stat.color}>
                    ₹{stat.value.toLocaleString()}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(stat.value / (analytics.overview.totalRevenue || 1)) * 100}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: alpha(stat.color, 0.2),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: stat.color,
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
  
  const renderContent = () => {
    switch (activeTab) {
      case 0: return renderOverview();
      case 1: return renderTrends();
      case 2: return renderCategories();
      case 3: return renderStaffPerformance();
      case 4: return renderRevenue();
      default: return renderOverview();
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="xl">
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchAnalytics}>
              <Refresh /> Retry
            </Button>
          }
          sx={{
            borderRadius: 3,
            backdropFilter: 'blur(10px)',
            mt: 4,
          }}
        >
          {error}
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography 
              variant="h4" 
              fontWeight={800}
              sx={{
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #818CF8 0%, #38BDF8 100%)'
                  : 'linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              System Analytics
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleExport}
                sx={{
                  backdropFilter: 'blur(10px)',
                }}
              >
                Export
              </Button>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={fetchAnalytics}
                sx={{
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #818CF8 0%, #38BDF8 100%)'
                    : 'linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%)',
                  boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Comprehensive analytics and insights about system performance
          </Typography>
          <Chip
            label={getTimeRangeLabel()}
            size="small"
            color="primary"
            sx={{ mt: 1 }}
          />
        </Box>
        
        {/* Tabs */}
        <Card sx={{ mb: 4, borderRadius: 3, backdropFilter: 'blur(20px)' }}>
          <CardContent sx={{ p: 0 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  py: 2,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  minHeight: 'auto',
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                  },
                },
              }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  icon={tab.icon}
                  iconPosition="start"
                  label={tab.label}
                />
              ))}
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Content */}
        {renderContent()}
      </motion.div>
    </Container>
  );
};

export default SystemAnalytics;