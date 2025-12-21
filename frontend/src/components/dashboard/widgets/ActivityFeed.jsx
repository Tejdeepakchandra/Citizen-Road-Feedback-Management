// src/components/dashboard/widgets/ActivityFeed.jsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Report as ReportIcon,
  CheckCircle,
  Warning,
  Assignment,
  Paid,
  Feedback,
  MoreVert,
  TrendingUp,
  Error,
  AddCircle,
  ThumbUp,
  Comment,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { dashboardAPI } from '../../../services/api';

const ActivityFeed = () => {
  const theme = useTheme();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  // In ActivityFeed.jsx
// Replace your fetchActivities function with this:
const fetchActivities = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Try to get activities from API
    console.log('Fetching activities from API...');
    const response = await dashboardAPI.getRecentActivities();
    console.log('API Response:', response);
    
    let activitiesData = response.data.data || response.data || [];
    
    // If no data from API, generate activities from stats
    if (!activitiesData || activitiesData.length === 0) {
      console.log('No activities from API, generating from stats...');
      activitiesData = await generateActivitiesFromReports();
    }
    
    // Ensure each activity has a unique ID
    const processedActivities = activitiesData.map((activity, index) => ({
      ...activity,
      id: activity.id || activity._id || `activity-${Date.now()}-${index}`,
      type: activity.type || 'activity',
      title: activity.title || 'Activity',
      description: activity.description || '',
      time: activity.time || 'Recently',
      icon: activity.icon || <ReportIcon />,
      color: activity.color || theme.palette.primary.main,
    }));
    
    setActivities(processedActivities.slice(0, 6));
    
  } catch (err) {
    console.error('Failed to fetch activities from API:', err);
    setError('Could not load recent activities. Showing sample data.');
    
    // Fallback to generated activities
    try {
      const fallbackActivities = await generateActivitiesFromReports();
      setActivities(fallbackActivities.slice(0, 6));
    } catch (fallbackErr) {
      console.error('Fallback also failed:', fallbackErr);
      const defaultActivities = getDefaultActivities();
      // Ensure default activities have unique IDs
      const uniqueDefaultActivities = defaultActivities.map((activity, index) => ({
        ...activity,
        id: `default-${Date.now()}-${index}`,
      }));
      setActivities(uniqueDefaultActivities);
    }
  } finally {
    setLoading(false);
  }
};

  const generateActivitiesFromReports = async () => {
    try {
      const response = await dashboardAPI.getCitizenStats();
      const stats = response.data.data || response.data;
      
      const generatedActivities = [];
      const now = new Date();
      
      // Add activities based on stats
      if (stats.totalReports > 0) {
        generatedActivities.push({
          id: 1,
          type: 'report',
          title: 'Total Reports',
          description: `You've submitted ${stats.totalReports} reports`,
          time: 'Just now',
          icon: <ReportIcon />,
          color: theme.palette.primary.main,
        });
      }
      
      if (stats.resolved > 0) {
        generatedActivities.push({
          id: 2,
          type: 'completion',
          title: 'Issues Resolved',
          description: `${stats.resolved} reports have been resolved`,
          time: 'Recently',
          icon: <CheckCircle />,
          color: theme.palette.success.main,
        });
      }
      
      if (stats.pending > 0) {
        generatedActivities.push({
          id: 3,
          type: 'progress',
          title: 'Pending Issues',
          description: `${stats.pending} reports are pending review`,
          time: 'Ongoing',
          icon: <Warning />,
          color: theme.palette.warning.main,
        });
      }
      
      // Add some generic activities
      generatedActivities.push(
        {
          id: 4,
          type: 'feedback',
          title: 'Community Impact',
          description: 'Your reports help improve local infrastructure',
          time: 'Always',
          icon: <ThumbUp />,
          color: theme.palette.secondary.main,
        },
        {
          id: 5,
          type: 'donation',
          title: 'Support RoadCare',
          description: 'Consider donating to support maintenance work',
          time: 'Opportunity',
          icon: <Paid />,
          color: theme.palette.info.main,
        },
        {
          id: 6,
          type: 'report',
          title: 'New Report',
          description: 'Click "Report New Issue" to submit a report',
          time: 'Ready when you are',
          icon: <AddCircle />,
          color: theme.palette.primary.main,
        }
      );
      
      return generatedActivities;
    } catch (err) {
      console.error('Failed to generate activities:', err);
      return getDefaultActivities();
    }
  };

  const getDefaultActivities = () => {
    return [
      {
        id: 1,
        type: 'report',
        title: 'Welcome to RoadCare',
        description: 'Start by submitting your first road issue report',
        time: 'Get started',
        icon: <ReportIcon />,
        color: theme.palette.primary.main,
      },
      {
        id: 2,
        type: 'info',
        title: 'How it Works',
        description: 'Report issues, track progress, see results',
        time: 'Learn more',
        icon: <Assignment />,
        color: theme.palette.info.main,
      },
      {
        id: 3,
        type: 'community',
        title: 'Community Impact',
        description: 'Join others in improving local infrastructure',
        time: 'Make a difference',
        icon: <ThumbUp />,
        color: theme.palette.success.main,
      },
    ];
  };

  const getStatusChip = (type) => {
    const statusMap = {
      report: { label: 'Report', color: 'primary' },
      task: { label: 'Task', color: 'info' },
      donation: { label: 'Donation', color: 'success' },
      progress: { label: 'In Progress', color: 'warning' },
      completion: { label: 'Completed', color: 'success' },
      feedback: { label: 'Feedback', color: 'secondary' },
      info: { label: 'Info', color: 'info' },
      community: { label: 'Community', color: 'success' },
    };
    const status = statusMap[type] || { label: 'Activity', color: 'default' };
    return (
      <Chip
        label={status.label}
        size="small"
        color={status.color}
        sx={{ height: 20, fontSize: '0.65rem' }}
      />
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Recent Activity
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={30} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Recent Activity
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            Recent Activity
          </Typography>
          <IconButton size="small" onClick={fetchActivities}>
            <MoreVert />
          </IconButton>
        </Box>
        
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {activities.length > 0 ? (
            activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderBottom: index < activities.length - 1
                      ? `1px solid ${theme.palette.divider}`
                      : 'none',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: `${activity.color}20`,
                        color: activity.color,
                        width: 40,
                        height: 40,
                      }}
                    >
                      {activity.icon}
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {activity.title}
                        </Typography>
                        {getStatusChip(activity.type)}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {activity.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {activity.time}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            ))
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No activities yet
              </Typography>
            </Box>
          )}
        </Box>
        
        {activities.length > 0 && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography
              variant="body2"
              color="primary"
              sx={{ 
                cursor: 'pointer', 
                '&:hover': { textDecoration: 'underline' },
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5
              }}
              onClick={fetchActivities}
            >
              Refresh Activity
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;