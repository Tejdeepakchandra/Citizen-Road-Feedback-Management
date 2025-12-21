// src/pages/Staff/StaffProfile.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Divider,
  Tab,
  Tabs,
  Paper,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Snackbar,
  Badge,
} from '@mui/material';
import {
  Construction,
  Assignment,
  CheckCircle,
  Warning,
  Schedule,
  TrendingUp,
  History,
  Person,
  LocationOn,
  Phone,
  Email,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const StaffProfile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    assignedTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    efficiency: 85,
    rating: 4.5,
  });
  const [currentTasks, setCurrentTasks] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (user) {
      fetchStaffData();
    }
  }, [user]);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      // Mock API call - replace with actual endpoint
      setStats({
        assignedTasks: 15,
        completedTasks: 12,
        pendingTasks: 3,
        efficiency: 85,
        rating: 4.5,
      });

      setCurrentTasks([
        { id: 1, title: 'Inspect pothole on Main St', priority: 'High', deadline: 'Today', status: 'in-progress' },
        { id: 2, title: 'Review drainage issue report', priority: 'Medium', deadline: 'Tomorrow', status: 'pending' },
        { id: 3, title: 'Update street light status', priority: 'Low', deadline: '2 days', status: 'pending' },
      ]);
    } catch (error) {
      console.error('Failed to fetch staff data:', error);
      showSnackbar('Failed to load staff data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleTaskStatusChange = (taskId, newStatus) => {
    setCurrentTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
    showSnackbar('Task status updated', 'success');
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Staff Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Task management and work profile
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Left Sidebar - Staff Info */}
          <Grid item xs={12} md={4}>
            <Card sx={{ position: 'sticky', top: 20 }}>
              <CardContent sx={{ textAlign: 'center', p: 4 }}>
                {/* Staff Badge */}
                <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                  <Avatar
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      mx: 'auto', 
                      mb: 2,
                      bgcolor: 'primary.main',
                      fontSize: '3rem'
                    }}
                  >
                    <Construction fontSize="large" />
                  </Avatar>
                  <Chip
                    label="STAFF"
                    color="primary"
                    sx={{ 
                      position: 'absolute', 
                      bottom: -10, 
                      left: '50%', 
                      transform: 'translateX(-50%)',
                      fontWeight: 700
                    }}
                  />
                </Box>

                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {user.email}
                </Typography>
                
                <Chip 
                  label={user.staffCategory || 'Field Staff'} 
                  color="secondary"
                  size="small"
                  sx={{ mb: 1 }}
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                  <Rating value={stats.rating} readOnly precision={0.5} size="small" />
                  <Typography variant="caption">({stats.rating})</Typography>
                </Box>

                <Typography variant="caption" color="text.secondary" display="block">
                  Employee ID: {user.employeeId || 'STF001'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Department: {user.department || 'Infrastructure'}
                </Typography>

                <Divider sx={{ my: 3 }} />

                {/* Work Stats */}
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Work Performance
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" display="block" gutterBottom>
                      Task Efficiency
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={stats.efficiency} 
                        sx={{ flexGrow: 1 }}
                        color={stats.efficiency > 80 ? 'success' : stats.efficiency > 60 ? 'warning' : 'error'}
                      />
                      <Typography variant="caption">
                        {stats.efficiency}%
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Assigned Tasks:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {stats.assignedTasks}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Completed:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {stats.completedTasks}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Pending:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {stats.pendingTasks}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Quick Actions */}
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Quick Actions
                  </Typography>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    size="small"
                    href="/staff/dashboard"
                    startIcon={<Assignment />}
                    sx={{ mb: 1, justifyContent: 'flex-start' }}
                  >
                    View Tasks
                  </Button>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    size="small"
                    href="/reports"
                    startIcon={<Warning />}
                    sx={{ mb: 1, justifyContent: 'flex-start' }}
                  >
                    Review Reports
                  </Button>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    size="small"
                    href="/staff/tasks"
                    startIcon={<CheckCircle />}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Mark Tasks Complete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab icon={<Construction />} label="Current Tasks" />
                <Tab icon={<History />} label="Work History" />
                <Tab icon={<TrendingUp />} label="Performance" />
                <Tab icon={<Person />} label="Profile" />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {/* Current Tasks Tab */}
                {activeTab === 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" fontWeight={600}>
                        Current Assignments ({currentTasks.length})
                      </Typography>
                      <Button variant="contained" size="small">
                        <Assignment sx={{ mr: 1 }} />
                        New Task
                      </Button>
                    </Box>
                    
                    {currentTasks.map((task) => (
                      <Card key={task.id} sx={{ mb: 2, p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {task.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                              <Chip 
                                label={task.priority} 
                                size="small"
                                color={
                                  task.priority === 'High' ? 'error' :
                                  task.priority === 'Medium' ? 'warning' : 'default'
                                }
                              />
                              <Chip 
                                label={`Deadline: ${task.deadline}`} 
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                              size="small" 
                              variant={task.status === 'in-progress' ? 'contained' : 'outlined'}
                              onClick={() => handleTaskStatusChange(task.id, 'in-progress')}
                            >
                              In Progress
                            </Button>
                            <Button 
                              size="small" 
                              variant={task.status === 'pending' ? 'contained' : 'outlined'}
                              onClick={() => handleTaskStatusChange(task.id, 'pending')}
                            >
                              Pending
                            </Button>
                            <Button 
                              size="small" 
                              variant={task.status === 'completed' ? 'contained' : 'outlined'}
                              color="success"
                              onClick={() => handleTaskStatusChange(task.id, 'completed')}
                            >
                              Complete
                            </Button>
                          </Box>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                )}

                {/* Work History Tab */}
                {activeTab === 1 && (
                  <Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Work History
                    </Typography>
                    
                    <Card sx={{ p: 3, mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Monthly Summary
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="success.main">12</Typography>
                            <Typography variant="caption">Completed Tasks</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="warning.main">3</Typography>
                            <Typography variant="caption">Pending Tasks</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary.main">85%</Typography>
                            <Typography variant="caption">Efficiency</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Card>

                    <Typography variant="subtitle2" gutterBottom>
                      Recent Completed Tasks
                    </Typography>
                    {[1, 2, 3].map((i) => (
                      <Card key={i} sx={{ p: 2, mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <CheckCircle color="success" />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1">Fixed drainage issue on Park Road</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Completed 2 days ago • Rating: 4.5/5
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                )}

                {/* Performance Tab */}
                {activeTab === 2 && (
                  <Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Performance Metrics
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Card sx={{ p: 3 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Task Completion Rate
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CircularProgress 
                              variant="determinate" 
                              value={(stats.completedTasks / stats.assignedTasks) * 100 || 0} 
                              size={80}
                            />
                            <Box>
                              <Typography variant="h4">
                                {stats.assignedTasks > 0 ? Math.round((stats.completedTasks / stats.assignedTasks) * 100) : 0}%
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {stats.completedTasks} of {stats.assignedTasks} tasks
                              </Typography>
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Card sx={{ p: 3 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Average Rating
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />
                            <Box>
                              <Typography variant="h4">{stats.rating}/5</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Based on 24 reviews
                              </Typography>
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Profile Tab */}
                {activeTab === 3 && (
                  <Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Personal Information
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          value={user.name || ''}
                          disabled
                          InputProps={{
                            startAdornment: (
                              <Person sx={{ mr: 1, color: 'text.secondary' }} />
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          value={user.email || ''}
                          disabled
                          InputProps={{
                            startAdornment: (
                              <Email sx={{ mr: 1, color: 'text.secondary' }} />
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone Number"
                          value={user.phone || ''}
                          disabled
                          InputProps={{
                            startAdornment: (
                              <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Staff Category"
                          value={user.staffCategory || 'Field Staff'}
                          disabled
                          InputProps={{
                            startAdornment: (
                              <Construction sx={{ mr: 1, color: 'text.secondary' }} />
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Work Area"
                          value={user.workArea || 'City Center Zone'}
                          disabled
                          InputProps={{
                            startAdornment: (
                              <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                            ),
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Snackbar for notifications */}
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
  );
};

export default StaffProfile;