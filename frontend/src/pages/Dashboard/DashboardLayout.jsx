import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Refresh,
  MoreVert,
  Settings,
  Help,
  Notifications,
  TrendingUp,
  Report,
  CheckCircle,
  Schedule,
  Donation,
  Feedback,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { dashboardAPI } from '../../services/api';

const DashboardLayout = ({ children, title, subtitle, actions }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRefresh = () => {
    fetchDashboardStats();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleBadge = () => {
    const role = user?.role;
    const colors = {
      admin: 'error',
      staff: 'warning',
      citizen: 'primary',
      user: 'primary',
    };
    
    const labels = {
      admin: 'Administrator',
      staff: 'Staff Member',
      citizen: 'Citizen',
      user: 'Citizen',
    };
    
    return (
      <Chip
        label={labels[role] || 'User'}
        color={colors[role] || 'default'}
        size="small"
        sx={{ 
          ml: 1,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `0 0 15px ${theme.palette[colors[role] || 'primary'].main}33`,
        }}
      />
    );
  };

  return (
    <Container maxWidth="xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Typography 
                  variant="h3" 
                  fontWeight={800}
                  sx={{
                    background: 'linear-gradient(45deg, #fff 30%, #a5b4fc 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 30px rgba(165, 180, 252, 0.3)',
                  }}
                >
                  {getGreeting()}, {user?.name?.split(' ')[0]}!
                </Typography>
                {getRoleBadge()}
              </Box>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: alpha(theme.palette.common.white, 0.7),
                  fontSize: '1.1rem',
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.2)',
                }}
              >
                {subtitle || 'Here\'s what\'s happening with your reports'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                onClick={handleRefresh} 
                title="Refresh"
                sx={{
                  backdropFilter: 'blur(10px)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 0 20px rgba(165, 180, 252, 0.4)',
                  },
                }}
              >
                <Refresh sx={{ color: '#a5b4fc' }} />
              </IconButton>
              <IconButton 
                onClick={() => navigate('/settings')} 
                title="Settings"
                sx={{
                  backdropFilter: 'blur(10px)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 0 20px rgba(165, 180, 252, 0.4)',
                  },
                }}
              >
                <Settings sx={{ color: '#a5b4fc' }} />
              </IconButton>
              <IconButton 
                onClick={handleMenuOpen}
                sx={{
                  backdropFilter: 'blur(10px)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 0 20px rgba(165, 180, 252, 0.4)',
                  },
                }}
              >
                <MoreVert sx={{ color: '#a5b4fc' }} />
              </IconButton>
            </Box>
          </Box>

          {/* Quick Stats */}
          {stats && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                {
                  label: 'Total Reports',
                  value: stats.totalReports,
                  change: '+12%',
                  color: '#8b5cf6',
                  icon: <Report />,
                  gradient: 'linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%)',
                },
                {
                  label: 'Resolved',
                  value: stats.resolvedReports,
                  change: '+8%',
                  color: '#10b981',
                  icon: <CheckCircle />,
                  gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                },
                {
                  label: 'Pending',
                  value: stats.pendingReports,
                  change: '-5%',
                  color: '#f59e0b',
                  icon: <Schedule />,
                  gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                },
                {
                  label: 'Avg. Resolution',
                  value: `${stats.averageResolutionTime || 3}d`,
                  change: '-2%',
                  color: '#3b82f6',
                  icon: <TrendingUp />,
                  gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                },
              ].map((stat, index) => (
                <Grid item xs={12} sm={6} lg={3} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      sx={{
                        height: '100%',
                        backdropFilter: 'blur(20px)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: `
                          0 8px 32px rgba(0, 0, 0, 0.3),
                          inset 0 1px 0 rgba(255, 255, 255, 0.1)
                        `,
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
                          background: stat.gradient,
                          borderTopLeftRadius: '16px',
                          borderTopRightRadius: '16px',
                        },
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `
                            0 20px 40px rgba(0, 0, 0, 0.4),
                            inset 0 1px 0 rgba(255, 255, 255, 0.1),
                            0 0 30px ${stat.color}33
                          `,
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
                              background: 'rgba(255, 255, 255, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              boxShadow: `0 0 20px ${stat.color}33`,
                            }}
                          >
                            {React.cloneElement(stat.icon, { 
                              sx: { 
                                fontSize: 28,
                                color: stat.color,
                                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))'
                              }
                            })}
                          </Box>
                          <Chip
                            label={stat.change}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              backdropFilter: 'blur(10px)',
                              background: stat.change.startsWith('+') 
                                ? 'rgba(16, 185, 129, 0.2)' 
                                : 'rgba(239, 68, 68, 0.2)',
                              color: stat.change.startsWith('+') ? '#10b981' : '#ef4444',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            }}
                          />
                        </Box>
                        <Typography 
                          variant="h3" 
                          fontWeight={800}
                          sx={{
                            background: `linear-gradient(45deg, #fff 30%, ${stat.color} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 0.5,
                            textShadow: `0 0 20px ${stat.color}40`,
                          }}
                        >
                          {stat.value}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: alpha(theme.palette.common.white, 0.7),
                            fontSize: '0.9rem',
                          }}
                        >
                          {stat.label}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Main Content */}
        <Box sx={{ mb: 4 }}>
          {title && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Typography 
                variant="h4" 
                fontWeight={700}
                sx={{
                  mb: 3,
                  background: 'linear-gradient(45deg, #fff 30%, #a5b4fc 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 30px rgba(165, 180, 252, 0.3)',
                }}
              >
                {title}
              </Typography>
            </motion.div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {children}
          </motion.div>
        </Box>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card 
            sx={{
              mb: 4,
              backdropFilter: 'blur(20px)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography 
                variant="h5" 
                fontWeight={600}
                sx={{
                  mb: 3,
                  background: 'linear-gradient(45deg, #fff 30%, #a5b4fc 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Quick Actions
              </Typography>
              <Grid container spacing={3}>
                {[
                  {
                    label: 'Report New Issue',
                    description: 'Submit a road issue for review',
                    path: '/reports/new',
                    color: '#8b5cf6',
                    icon: <Report />,
                    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%)',
                  },
                  {
                    label: 'View My Reports',
                    description: 'Check status of your reports',
                    path: '/reports/my-reports',
                    color: '#10b981',
                    icon: <CheckCircle />,
                    gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                  },
                  {
                    label: 'Make a Donation',
                    description: 'Support road development',
                    path: '/donate',
                    color: '#f59e0b',
                    icon: <Donation />,
                    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                  },
                  {
                    label: 'Give Feedback',
                    description: 'Rate completed work',
                    path: '/feedback',
                    color: '#3b82f6',
                    icon: <Feedback />,
                    gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                  },
                ].map((action, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <motion.div whileHover={{ scale: 1.03 }}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          backdropFilter: 'blur(20px)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 3,
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '4px',
                            background: action.gradient,
                          },
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `
                              0 20px 40px rgba(0, 0, 0, 0.4),
                              0 0 30px ${action.color}33
                            `,
                            '& .action-icon': {
                              transform: 'scale(1.1)',
                              filter: `drop-shadow(0 0 15px ${action.color})`,
                            },
                          },
                          transition: 'all 0.3s ease',
                        }}
                        onClick={() => navigate(action.path)}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box
                            className="action-icon"
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: 2,
                              background: 'rgba(255, 255, 255, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mb: 2,
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            {React.cloneElement(action.icon, { 
                              sx: { 
                                fontSize: 28,
                                color: action.color,
                              }
                            })}
                          </Box>
                          <Typography 
                            variant="subtitle1" 
                            fontWeight={600}
                            sx={{
                              mb: 1,
                              color: '#fff',
                            }}
                          >
                            {action.label}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: alpha(theme.palette.common.white, 0.6),
                              lineHeight: 1.4,
                            }}
                          >
                            {action.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              backdropFilter: 'blur(20px)',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              borderRadius: 2,
              '& .MuiMenuItem-root': {
                color: '#fff',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                },
              },
            },
          }}
        >
          <MenuItem onClick={() => { navigate('/help'); handleMenuClose(); }}>
            <Help sx={{ mr: 1.5, color: '#a5b4fc' }} fontSize="small" />
            Help & Support
          </MenuItem>
          <MenuItem onClick={() => { navigate('/notifications'); handleMenuClose(); }}>
            <Notifications sx={{ mr: 1.5, color: '#a5b4fc' }} fontSize="small" />
            Notifications Settings
          </MenuItem>
          <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
            <Settings sx={{ mr: 1.5, color: '#a5b4fc' }} fontSize="small" />
            Edit Profile
          </MenuItem>
        </Menu>
      </motion.div>
    </Container>
  );
};

export default DashboardLayout;