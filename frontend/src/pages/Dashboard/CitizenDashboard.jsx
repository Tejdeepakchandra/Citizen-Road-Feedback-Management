import React, { useState, useEffect } from 'react';
import {
  Grid,
  Box,
  Typography,
  Container,
  Button,
  useTheme,
  Skeleton,
  Alert,
  alpha,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  AttachMoney as DonateIcon,
  Feedback as FeedbackIcon,
  TrendingUp,
  CheckCircle,
  Pending,
  Report,
  Warning,
  PhotoLibrary,
  ArrowForward,
  Bolt,
  Verified,
  History,
  Assignment,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CategoryChart from '../../components/dashboard/charts/CategoryChart';
import ProgressChart from '../../components/dashboard/charts/ProgressChart';
import ActivityFeed from '../../components/dashboard/widgets/ActivityFeed';
import { dashboardAPI, reportAPI , userAPI} from '../../services/api';

const CitizenDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading} = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalReports: 0,
    resolvedReports: 0,
    pendingReports: 0,
    assignedReports: 0, 
    inProgressReports: 0,
    averageResolutionTime: 0,
  });
  const [categoryData, setCategoryData] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  
  const generateRealMonthlyProgressData = (reports) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const monthlyData = [];
  
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentDate.getMonth() - i + 12) % 12;
    const year = monthIndex > currentDate.getMonth() ? currentYear - 1 : currentYear;
    const monthName = months[monthIndex];
    
    const monthReports = reports.filter(report => {
      if (!report.createdAt) return false;
      const reportDate = new Date(report.createdAt);
      return (
        reportDate.getMonth() === monthIndex &&
        reportDate.getFullYear() === year
      );
    });
    
    // Count by status including assigned
    const resolvedReports = monthReports.filter(report => {
      const status = report.status?.toLowerCase?.() || report.status || '';
      return ['completed', 'resolved'].includes(status);
    }).length;
    
    const pendingReports = monthReports.filter(report => {
      const status = report.status?.toLowerCase?.() || report.status || '';
      return ['pending'].includes(status);
    }).length;
    
    const assignedReports = monthReports.filter(report => { // Add this
      const status = report.status?.toLowerCase?.() || report.status || '';
      return ['assigned'].includes(status);
    }).length;
    
    const inProgressReports = monthReports.filter(report => {
      const status = report.status?.toLowerCase?.() || report.status || '';
      return ['in_progress'].includes(status);
    }).length;
    
    monthlyData.push({
      month: `${monthName} ${year}`,
      name: monthName,
      reports: monthReports.length,
      resolved: resolvedReports,
      pending: pendingReports,
      assigned: assignedReports, // Add this
      inProgress: inProgressReports,
      progress: monthReports.length > 0 
        ? Math.round((resolvedReports / monthReports.length) * 100)
        : 0,
    });
  }
  
  return monthlyData;
};

  const fetchDashboardData = async () => {
  try {
    setLoading(true);
    setError(null);

    // ✅ 1. First, get corrected stats from dashboard API
    const statsResponse = await dashboardAPI.getCitizenDashboard();
    let dashboardData = statsResponse.data.data || statsResponse.data;

    console.log('Dashboard API Response:', statsResponse);
    console.log('Dashboard Data:', dashboardData);

    // ✅ 2. Then get reports for display and category data
    const myReportsRes = await reportAPI.getMyReports();
    const allReports = myReportsRes.data.data || [];
    
    // ✅ Debug: Check report statuses
    console.log('=== ALL REPORTS ===');
    allReports.forEach(report => {
      console.log(`Report: ${report.title}, Status: ${report.status}, ID: ${report._id}`);
    });
    
    // ✅ 3. Also calculate from reports to compare (debug only)
    const totalReports = allReports.length;
    const resolvedReports = allReports.filter(report => 
      report.status === 'completed' || report.status === 'resolved'
    ).length;
    const pendingReports = allReports.filter(report => 
      report.status === 'pending'
    ).length;

    const assignedReports = allReports.filter(report =>  // Add this
      report.status === 'assigned'
    ).length;

    const inProgressReports = allReports.filter(report => 
      report.status === 'in_progress' || report.status === 'assigned'
    ).length;
    
    console.log('Calculated from reports (for comparison):', {
      total: totalReports,
      resolved: resolvedReports,
      pending: pendingReports,
      inProgress: inProgressReports
    });

    console.log('Using dashboard API data:', {
      total: dashboardData.totalReports,
      resolved: dashboardData.resolved,
      pending: dashboardData.pending,
      inProgress: dashboardData.inProgress
    });

    // ✅ 4. Use the corrected dashboard API data (this is what matters)
    setStats({
      totalReports: dashboardData.totalReports || 0,
      resolvedReports: dashboardData.resolved || 0,
      pendingReports: dashboardData.pending || 0,
      assignedReports: assignedReports || 0, // Add this
      inProgressReports: dashboardData.inProgress || 0,
      averageResolutionTime: dashboardData.avgResolutionTime || 0,
    });

    // ✅ 5. Get category distribution from reports
    const categoryMap = {};
    allReports.forEach(report => {
      if (report.category) {
        categoryMap[report.category] = (categoryMap[report.category] || 0) + 1;
      }
    });
    
    const categoryArray = Object.keys(categoryMap).map(name => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: categoryMap[name]
    }));
    setCategoryData(categoryArray);

    // ✅ 6. Set recent reports for display
    setRecentReports(allReports.slice(0, 4));

    // ✅ 7. Generate monthly progress data
    const monthlyProgress = generateRealMonthlyProgressData(allReports);
    console.log('Monthly Progress Data:', monthlyProgress);
    setMonthlyData(monthlyProgress);

  } catch (err) {
    console.error('Failed to fetch dashboard data:', err);
    const errorMsg = err.response?.data?.message || err.message || 'Failed to load dashboard data';
    const errorCode = err.response?.status || 'unknown';
    console.error(`❌ Error ${errorCode}: ${errorMsg}`);
    setError(`${errorMsg} (Error: ${errorCode})`);
    setMonthlyData([]);
  } finally {
    setLoading(false);
  }
};

// Then simplify your useEffect:
useEffect(() => {
  if (!authLoading && user && isAuthenticated) {
    fetchDashboardData();
  }
}, [authLoading, user, isAuthenticated]);// ADD dependencies

    if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show loading while fetching data
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }


  // StatCard component
  // In your StatCard component, replace hardcoded colors:
const StatCard = ({ title, value, icon, gradient, trend, trendValue, subtitle }) => {
  // Use theme colors instead of hardcoded values
   const getColorFromGradient = () => {
    if (!gradient) return '#8B5CF6';
    const colors = gradient.match(/#[0-9A-Fa-f]{6}/g);
    return colors?.[0] || '#8B5CF6';
  };
  const cardColor = getColorFromGradient();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          height: '100%',
          backdropFilter: 'blur(20px)',
          background: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.02)',
          border: theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: theme.shadows[2],
          borderRadius: 4,
          overflow: 'visible',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: gradient || 'linear-gradient(135deg, #8B5CF6 0%, #0EA5E9 100%)',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
          },
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
          },
          transition: 'all 0.3s ease',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: 3,
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: theme.palette.mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.2)'
                  : '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: `0 0 20px ${alpha(cardColor, 0.1)}`,
              }}
            >
              {React.cloneElement(icon, { 
                sx: { 
                  fontSize: 28,
                  color: cardColor,
                }
              })}
            </Box>
            {trend && (
              <Box
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)',
                  background: trend === 'up' 
                    ? alpha(theme.palette.success.main, 0.2)
                    : alpha(theme.palette.error.main, 0.2),
                  color: trend === 'up' ? theme.palette.success.main : theme.palette.error.main,
                  border: theme.palette.mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid rgba(0, 0, 0, 0.1)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                {trend === 'up' ? '↗' : '↘'} {trendValue}%
              </Box>
            )}
          </Box>
          <Typography 
            variant="h3" 
            fontWeight={800}
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.text.primary} 30%, ${cardColor} 100%)`,
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
              color: theme.palette.text.secondary,
              fontSize: '0.9rem',
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

  // QuickActionCard component
  const QuickActionCard = ({ title, description, icon, gradient, onClick }) => {
  const getColorFromGradient = () => {
    if (!gradient) return '#8B5CF6';
    const colors = gradient.match(/#[0-9A-F]{6}/gi);
    return colors ? colors[0] : '#8B5CF6';
  };

  const cardColor = getColorFromGradient();

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card
        onClick={onClick}
        sx={{
          cursor: 'pointer',
          height: '100%',
          borderRadius: 4,
          backdropFilter: 'blur(20px)',
          background: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(255, 255, 255, 0.8)',
          border: theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.2)'
            : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: theme.shadows[3],
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: theme.shadows[8],
            borderColor: alpha(cardColor, 0.5),
            '& .gradient-overlay': {
              opacity: 0.2,
            },
            '& .action-icon': {
              transform: 'scale(1.1)',
            },
          },
          transition: 'all 0.3s ease',
        }}
      >
        <Box
          className="gradient-overlay"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: gradient,
            opacity: 0.1,
            transition: 'opacity 0.3s ease',
          }}
        />

        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Box
              className="action-icon"
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                background: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: theme.palette.mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.2)'
                  : '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: `0 0 20px ${alpha(cardColor, 0.1)}`,
                transition: 'all 0.3s ease',
              }}
            >
              {React.cloneElement(icon, {
                sx: {
                  fontSize: 28,
                  color: cardColor,
                },
              })}
            </Box>
          </Box>

          <Typography
            variant="h6"
            fontWeight={700}
            gutterBottom
            sx={{
              color: theme.palette.text.primary,
              mb: 1,
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.875rem',
              lineHeight: 1.5,
            }}
          >
            {description}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

  const quickActions = [
    {
      title: 'Report New Issue',
      description: 'Submit a new road issue for review',
      icon: <AddIcon fontSize="large" />,
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #0EA5E9 100%)',
      onClick: () => navigate('/reports/new'),
    },
    {
      title: 'Make a Donation',
      description: 'Support road improvement projects',
      icon: <DonateIcon fontSize="large" />,
      gradient: 'linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)',
      onClick: () => navigate('/donations'),
    },
    {
      title: 'Give Feedback',
      description: 'Rate completed work and share your thoughts',
      icon: <FeedbackIcon fontSize="large" />,
      gradient: 'linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)',
      onClick: () => navigate('/feedback'),
    },
    {
      title: 'View Gallery',
      description: 'See before/after images of completed projects',
      icon: <PhotoLibrary fontSize="large" />,
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
      onClick: () => navigate('/gallery'),
    },
  ];

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Skeleton variant="text" height={60} width="40%" />
              <Skeleton variant="text" height={30} width="60%" />
            </Grid>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item}>
                <Skeleton variant="rounded" height={150} />
              </Grid>
            ))}
            <Grid item xs={12} md={6}>
              <Skeleton variant="rounded" height={350} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rounded" height={350} />
            </Grid>
          </Grid>
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
        {/* Header with Neon Gradient */}
        <Box sx={{ mb: 6, pt: 2 }}>
          <Typography 
            variant="h2" 
            fontWeight={800} 
            gutterBottom
            sx={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #0EA5E9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
              textShadow: '0 0 30px rgba(139, 92, 246, 0.3)',
            }}
          >
            Welcome back, {user?.name || 'Citizen'}!
          </Typography>
          <Typography 
            variant="h6" 
            sx={{
              fontWeight: 400,
              opacity: 0.8,
              maxWidth: '600px',
              color: alpha(theme.palette.common.white, 0.7),
            }}
          >
            Here's what's happening with your reports and community initiatives
          </Typography>
        </Box>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Alert 
              severity="error" 
              sx={{ 
                mb: 4,
                borderRadius: 3,
                backdropFilter: 'blur(10px)',
                background: alpha('#EF4444', 0.1),
                border: `1px solid ${alpha('#EF4444', 0.2)}`,
              }}
            >
              {error}
            </Alert>
          </motion.div>
        )}

        {/* Stats Cards with Glassmorphism */}
<Grid container spacing={3} sx={{ mb: 5 }}>
  <Grid item xs={12} sm={6} md={2.4}>
    <StatCard
      title="Total Reports"
      value={stats.totalReports}
      icon={<Report />}
      gradient="linear-gradient(135deg, #8B5CF6 0%, #0EA5E9 100%)"
      trend="up"
      trendValue={12}
    />
  </Grid>
  <Grid item xs={12} sm={6} md={2.4}>
    <StatCard
      title="Resolved"
      value={stats.resolvedReports}
      icon={<CheckCircle />}
      gradient="linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)"
      subtitle={`${stats.totalReports > 0 ? ((stats.resolvedReports / stats.totalReports) * 100).toFixed(1) : 0}% resolved`}
    />
  </Grid>
  <Grid item xs={12} sm={6} md={2.4}>
    <StatCard
      title="Pending"
      value={stats.pendingReports}
      icon={<Pending />}
      gradient="linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)"
      subtitle={`${stats.totalReports > 0 ? ((stats.pendingReports / stats.totalReports) * 100).toFixed(1) : 0}% pending`}
    />
  </Grid>
  <Grid item xs={12} sm={6} md={2.4}>
    <StatCard
      title="Assigned"
      value={stats.assignedReports}
      icon={<Assignment />} // You'll need to import this
      gradient="linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
      subtitle={`${stats.totalReports > 0 ? ((stats.assignedReports / stats.totalReports) * 100).toFixed(1) : 0}% assigned`}
    />
  </Grid>
  <Grid item xs={12} sm={6} md={2.4}>
    <StatCard
      title="In Progress"
      value={stats.inProgressReports}
      icon={<Bolt />}
      gradient="linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)"
      subtitle={`${stats.totalReports > 0 ? ((stats.inProgressReports / stats.totalReports) * 100).toFixed(1) : 0}% in progress`}
    />
  </Grid>
</Grid>

        {/* Quick Actions with Glassmorphism */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography 
              variant="h5" 
              fontWeight={700}
              sx={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #0EA5E9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Verified sx={{ fontSize: 20, color: '#10B981' }} />
              <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.7) }}>
                Make an impact today
              </Typography>
            </Box>
          </Box>
          <Grid container spacing={3}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <QuickActionCard {...action} />
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Charts Section with Glass Cards */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  backdropFilter: 'blur(20px)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1)
                  `,
                  overflow: 'hidden',
                  '&:hover': {
                    boxShadow: '0 25px 50px rgba(139, 92, 246, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography 
                      variant="h6" 
                      fontWeight={600}
                      sx={{
                        background: 'linear-gradient(45deg, #fff 30%, #a5b4fc 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Issue Categories
                    </Typography>
                    <TrendingUp sx={{ color: '#0EA5E9' }} />
                  </Box>
                  <Box sx={{ height: 400 }}>
                    <CategoryChart data={categoryData} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  backdropFilter: 'blur(20px)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1)
                  `,
                  overflow: 'hidden',
                  '&:hover': {
                    boxShadow: '0 25px 50px rgba(14, 165, 233, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography 
                      variant="h6" 
                      fontWeight={600}
                      sx={{
                        background: 'linear-gradient(45deg, #fff 30%, #a5b4fc 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Monthly Progress
                    </Typography>
                    <History sx={{ color: '#10B981' }} />
                  </Box>
                  <Box sx={{ height: 400 }}>
                    <ProgressChart data={monthlyData} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Recent Reports Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <Card
            sx={{
              mb: 4,
              borderRadius: 4,
              backdropFilter: 'blur(20px)',
              background: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
              overflow: 'hidden',
              '&:hover': {
                boxShadow: '0 25px 50px rgba(139, 92, 246, 0.3)',
              },
              transition: 'all 0.3s ease',
              
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography 
                  variant="h5" 
                  fontWeight={700}
                  sx={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #0EA5E9 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    
                  }}
                >
                  Your Recent Reports ({recentReports.length})
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/reports/my-reports')}
                  endIcon={<ArrowForward />}
                  sx={{
                    backdropFilter: 'blur(10px)',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
                    borderRadius: 2,
                    fontWeight: 600,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  View All
                </Button>
              </Box>
              
              {recentReports.length > 0 ? (
                <Grid container spacing={2}>
                  {recentReports.slice(0, 4).map((report, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Card
                        sx={{
                          backdropFilter: 'blur(10px)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 2,
                          cursor: 'pointer',
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 0.08)',
                          },
                        }}
                        onClick={() => navigate(`/reports/${report._id}`)}
                      >
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight={600} sx={{ color: theme.palette.text.primary  }}>
                            {report.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary  }}>
                            {report.category} • {report.status}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert 
                  severity="info" 
                  sx={{
                    borderRadius: 3,
                    backdropFilter: 'blur(10px)',
                    background: alpha('#0EA5E9', 0.1),
                    border: `1px solid ${alpha('#0EA5E9', 0.2)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AddIcon sx={{ color: '#0EA5E9' }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        No reports yet
                      </Typography>
                      <Typography variant="caption">
                        Click "Report New Issue" to get started and make a difference in your community.
                      </Typography>
                    </Box>
                  </Box>
                </Alert>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Feed & Community Impact */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  backdropFilter: 'blur(20px)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1)
                  `,
                  overflow: 'hidden',
                  '&:hover': {
                    boxShadow: '0 25px 50px rgba(16, 185, 129, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography 
                      variant="h5" 
                      fontWeight={700}
                      sx={{
                        background: 'linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Activity Feed
                    </Typography>
                    <TrendingUp sx={{ color: '#10B981' }} />
                  </Box>
                  <ActivityFeed />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  backdropFilter: 'blur(20px)',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(14, 165, 233, 0.05) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 4,
                }}
              >
                <Typography 
                  variant="h4" 
                  fontWeight={800} 
                  gutterBottom
                  sx={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #0EA5E9 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2,
                  }}
                >
                  Community Impact
                </Typography>
                <Typography variant="body1" sx={{ color: alpha('#fff', 0.8), mb: 3 }}>
                  Together, we've resolved {stats.resolvedReports} issues and improved countless lives
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/gallery')}
                  sx={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #0EA5E9 100%)',
                    boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
                    borderRadius: 3,
                    px: 5,
                    py: 1.5,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 40px rgba(139, 92, 246, 0.6)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  See Transformations
                </Button>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default CitizenDashboard;