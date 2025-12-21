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
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Assignment,
  AttachMoney,
  PhotoLibrary,
  NotificationsActive,
  Timer,
  CheckCircle,
  Error,
  Pending,
  Visibility,
  Refresh,
  Download,
  MoreVert,
  Security,
  Storage,
  BarChart,
  Construction,
  Flag,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { format, subDays } from 'date-fns';

const AdminDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch admin dashboard stats
      const dashboardResponse = await adminAPI.getDashboard();
      const dashboard = dashboardResponse.data.data;
      setDashboardData(dashboard);

      // Fetch recent activity
      const activityResponse = await adminAPI.getAdminActivity({ limit: 5 });
      setRecentActivity(activityResponse.data.data || []);

    } catch (err) {
      console.error('Failed to fetch admin dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDashboardData();
    }
  }, [user]);

  const StatCard = ({ title, value, icon, change, color, onClick, subtitle }) => {
    const cardColor = color || '#6366F1';
    
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
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2)`,
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 20px 40px ${alpha(cardColor, 0.3)}`,
              borderColor: alpha(cardColor, 0.3),
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
                  background: alpha(cardColor, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${alpha(cardColor, 0.2)}`,
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
                    backgroundColor: change > 0 ? alpha('#10B981', 0.2) : alpha('#EF4444', 0.2),
                    color: change > 0 ? '#10B981' : '#EF4444',
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>
            <Typography 
              variant="h3" 
              fontWeight={800}
              sx={{
                background: `linear-gradient(45deg, #fff 30%, ${cardColor} 100%)`,
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
  };

  const QuickActionButton = ({ icon, label, onClick, color = 'primary' }) => (
    <Button
      variant="outlined"
      startIcon={icon}
      onClick={onClick}
      sx={{
        borderRadius: 2,
        py: 1.5,
        backdropFilter: 'blur(10px)',
        background: alpha(theme.palette.background.paper, 0.3),
        border: `2px solid ${alpha(theme.palette[color].main, 0.3)}`,
        color: theme.palette[color].main,
        fontWeight: 600,
        '&:hover': {
          background: alpha(theme.palette[color].main, 0.1),
          borderColor: theme.palette[color].main,
          transform: 'translateY(-2px)',
        },
        transition: 'all 0.3s ease',
      }}
    >
      {label}
    </Button>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
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
          }}
        >
          {error}
        </Alert>
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
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography 
                variant="h2" 
                fontWeight={800} 
                gutterBottom
                sx={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
                  textShadow: '0 0 30px rgba(99, 102, 241, 0.3)',
                }}
              >
                Admin Dashboard
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
                Welcome back, {user?.name || 'Administrator'}. Here's your system overview.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => alert('Export feature coming soon!')}
                sx={{
                  backdropFilter: 'blur(10px)',
                }}
              >
                Export
              </Button>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={fetchDashboardData}
                sx={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%)',
                  boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
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
              background: 'linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3,
            }}
          >
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <QuickActionButton
              icon={<People />}
              label="Manage Users"
              onClick={() => navigate('/admin/users')}
              color="primary"
            />
            <QuickActionButton
              icon={<Assignment />}
              label="Review Reports"
              onClick={() => navigate('/admin/reports')}
              color="warning"
            />
            <QuickActionButton
              icon={<PhotoLibrary />}
              label="Approve Images"
              onClick={() => navigate('/admin/images/pending')}
              color="secondary"
            />
            <QuickActionButton
              icon={<AttachMoney />}
              label="View Donations"
              onClick={() => navigate('/admin/financial/donations')}
              color="success"
            />
            <QuickActionButton
              icon={<Storage />}
              label="System Health"
              onClick={() => navigate('/admin/system')}
              color="info"
            />
          </Box>
        </Box>

        {/* Summary Stats */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Users"
              value={dashboardData?.summary?.totalUsers || 0}
              icon={<People />}
              change={dashboardData?.recentActivity?.newUsers || 0}
              color="#2196f3"
              onClick={() => navigate('/admin/users')}
              subtitle={`${dashboardData?.summary?.activeUsers || 0} active`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Reports"
              value={dashboardData?.summary?.totalReports || 0}
              icon={<Assignment />}
              change={dashboardData?.recentActivity?.newReports || 0}
              color="#ff9800"
              onClick={() => navigate('/admin/reports')}
              subtitle={`${dashboardData?.summary?.pendingImages || 0} pending`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Revenue"
              value={`₹${dashboardData?.financial?.totalRevenue?.toLocaleString() || 0}`}
              icon={<AttachMoney />}
              change={dashboardData?.recentActivity?.newDonations || 0}
              color="#4caf50"
              onClick={() => navigate('/admin/financial/donations')}
              subtitle={`${dashboardData?.financial?.totalTransactions || 0} transactions`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Images"
              value={dashboardData?.summary?.pendingImages || 0}
              icon={<PhotoLibrary />}
              color="#9c27b0"
              onClick={() => navigate('/admin/images/pending')}
              subtitle="Awaiting approval"
            />
          </Grid>
        </Grid>

        {/* Charts and Tables */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {/* User Distribution */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                backdropFilter: 'blur(20px)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography 
                    variant="h6" 
                    fontWeight={600}
                    sx={{
                      background: 'linear-gradient(45deg, #fff 30%, #a5b4fc 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    User Distribution
                  </Typography>
                  <Button size="small" onClick={() => navigate('/admin/users')}>
                    View All
                  </Button>
                </Box>
                <Box sx={{ mt: 2 }}>
                  {dashboardData?.analytics?.usersByRole && Object.entries(dashboardData.analytics.usersByRole).map(([role, count]) => (
                    <Box key={role} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ color: alpha('#fff', 0.8) }}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ color: '#fff' }}>
                          {count}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(count / dashboardData.summary.totalUsers) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha('#fff', 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: role === 'citizen' ? '#2196f3' :
                                     role === 'staff' ? '#ff9800' : '#4caf50',
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Report Status */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                backdropFilter: 'blur(20px)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography 
                    variant="h6" 
                    fontWeight={600}
                    sx={{
                      background: 'linear-gradient(45deg, #fff 30%, #a5b4fc 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Report Status
                  </Typography>
                  <Button size="small" onClick={() => navigate('/admin/reports')}>
                    View All
                  </Button>
                </Box>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {dashboardData?.analytics?.reportsByStatus && Object.entries(dashboardData.analytics.reportsByStatus).map(([status, count]) => (
                    <Grid item xs={6} key={status}>
                      <Paper
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          backdropFilter: 'blur(10px)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="h5" fontWeight={700} sx={{ color: '#fff', mb: 0.5 }}>
                          {count}
                        </Typography>
                        <Chip
                          label={status}
                          size="small"
                          sx={{
                            bgcolor: status === 'pending' ? 'warning.main' :
                                     status === 'in_progress' ? 'info.main' :
                                     status === 'completed' ? 'success.main' : 'error.main',
                            color: 'white',
                            fontWeight: 600,
                          }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Activity & Top Donors */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {/* Recent Activity */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                backdropFilter: 'blur(20px)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography 
                    variant="h6" 
                    fontWeight={600}
                    sx={{
                      background: 'linear-gradient(45deg, #fff 30%, #a5b4fc 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Recent Activity
                  </Typography>
                  <Button size="small" onClick={() => navigate('/admin/activity')}>
                    View All
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <Paper
                        key={index}
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          backdropFilter: 'blur(10px)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 2,
                        }}
                      >
                        <Avatar
                          src={activity.user?.avatar}
                          sx={{ width: 40, height: 40 }}
                        >
                          {activity.user?.name?.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={500} sx={{ color: '#fff' }}>
                            {activity.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: alpha('#fff', 0.6) }}>
                            {activity.type} • {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                          </Typography>
                        </Box>
                        <Chip
                          label={activity.action}
                          size="small"
                          color={activity.action === 'approved' ? 'success' : 'primary'}
                        />
                      </Paper>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: alpha('#fff', 0.6), textAlign: 'center', py: 4 }}>
                      No recent activity
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Donors */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                backdropFilter: 'blur(20px)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography 
                    variant="h6" 
                    fontWeight={600}
                    sx={{
                      background: 'linear-gradient(45deg, #fff 30%, #a5b4fc 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Top Donors
                  </Typography>
                  <Button size="small" onClick={() => navigate('/admin/financial/donations')}>
                    View All
                  </Button>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: alpha('#fff', 0.7) }}>Donor</TableCell>
                        <TableCell align="right" sx={{ color: alpha('#fff', 0.7) }}>Amount</TableCell>
                        <TableCell align="right" sx={{ color: alpha('#fff', 0.7) }}>Donations</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboardData?.financial?.topDonors?.map((donor) => (
                        <TableRow key={donor.userId} hover sx={{ '&:hover': { backgroundColor: alpha('#fff', 0.05) } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar src={donor.avatar} sx={{ width: 32, height: 32 }}>
                                {donor.name?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500} sx={{ color: '#fff' }}>
                                  {donor.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: alpha('#fff', 0.6) }}>
                                  {donor.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#fff' }}>
                              ₹{donor.totalAmount?.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={donor.donationCount}
                              size="small"
                              variant="outlined"
                              sx={{ color: '#fff', borderColor: alpha('#fff', 0.3) }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* System Info */}
        <Card
          sx={{
            borderRadius: 3,
            backdropFilter: 'blur(20px)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography 
              variant="h6" 
              fontWeight={600}
              gutterBottom
              sx={{
                background: 'linear-gradient(45deg, #fff 30%, #a5b4fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3,
              }}
            >
              System Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
                    Last Updated
                  </Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ color: '#fff' }}>
                    {dashboardData?.timestamp ? format(new Date(dashboardData.timestamp), 'PPpp') : 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
                    Active Users (7 days)
                  </Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ color: '#fff' }}>
                    {dashboardData?.summary?.activeUsers || 0}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
                    Platform Status
                  </Typography>
                  <Chip
                    label="Healthy"
                    color="success"
                    size="small"
                    icon={<CheckCircle />}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
                    Pending Tasks
                  </Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ color: 'warning.main' }}>
                    {dashboardData?.summary?.pendingImages || 0} images
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
};

export default AdminDashboard;