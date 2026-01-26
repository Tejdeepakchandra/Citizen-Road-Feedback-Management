import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  useTheme,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNotifications } from '../hooks/useNotifications';
import { useSocket } from '../hooks/useSocket';

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

const NotificationsPage = () => {
  const muiTheme = useTheme();
  const { notifications, fetchNotifications, markAsRead, deleteNotification, markAllAsRead, loading } = useNotifications();
  const { socket } = useSocket();
  const [currentPage, setCurrentPage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    console.log('📄 NotificationsPage mounted, fetching notifications');
    fetchNotifications();
  }, [fetchNotifications]);

  // Update unread count
  useEffect(() => {
    const unread = notifications.filter(notif => !notif.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Setup socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    console.log('🔗 Setting up socket listeners on notifications page');

    socket.on('notification:new', () => {
      console.log('📬 New notification received');
      fetchNotifications();
    });

    socket.on('notification:update', () => {
      console.log('📖 Notification updated');
      fetchNotifications();
    });

    socket.on('notification:delete', () => {
      console.log('🗑️ Notification deleted');
      fetchNotifications();
    });

    return () => {
      socket.off('notification:new');
      socket.off('notification:update');
      socket.off('notification:delete');
    };
  }, [socket, fetchNotifications]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'normal':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type) => {
    const typeMap = {
      report_created: '📋 Report',
      report_assigned: '🎯 Task',
      status_update: '📌 Update',
      progress_update: '⏳ Progress',
      report_completed: '✨ Completed',
      feedback_request: '💬 Feedback',
      feedback_submitted: '⭐ Review',
      donation_received: '💰 Donation',
      donation_refunded: '💸 Refund',
      broadcast: '📢 Announcement',
      system: '⚙️ System',
      alert: '⚠️ Alert',
      info: 'ℹ️ Info',
      warning: '⚠️ Warning',
    };
    return typeMap[type] || '📬 Notification';
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedNotifications = notifications.slice(startIdx, endIdx);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
              Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All notifications read'}
            </Typography>
          </Box>
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleMarkAllAsRead}
              sx={{ textTransform: 'none' }}
            >
              Mark all as read
            </Button>
          )}
        </Box>
      </Box>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Alert severity="info">No notifications yet</Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            {paginatedNotifications.map((notification) => (
              <Grid item xs={12} key={notification._id}>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: notification.read
                      ? 'transparent'
                      : muiTheme.palette.mode === 'dark'
                        ? 'rgba(71, 85, 105, 0.2)'
                        : '#f9f9f9',
                    border: `1px solid ${muiTheme.palette.divider}`,
                    '&:hover': {
                      backgroundColor: muiTheme.palette.mode === 'dark'
                        ? 'rgba(71, 85, 105, 0.3)'
                        : '#f5f5f5',
                    },
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 2 }}>
                    {/* Content */}
                    <Box sx={{ flex: 1 }}>
                      {/* Type Badge */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          label={getTypeLabel(notification.type)}
                          size="small"
                          color={getPriorityColor(notification.priority)}
                          variant="outlined"
                        />
                        {!notification.read && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: '#2196F3',
                            }}
                          />
                        )}
                      </Box>

                      {/* Title */}
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: notification.read ? 400 : 600,
                          mb: 0.5,
                        }}
                      >
                        {notification.title}
                      </Typography>

                      {/* Message */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {notification.message}
                      </Typography>

                      {/* Time */}
                      <Typography variant="caption" color="text.disabled">
                        {formatDate(notification.createdAt || notification.timestamp)}
                      </Typography>

                      {/* Action Button */}
                      {notification.actionUrl && (
                        <Box sx={{ mt: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            href={notification.actionUrl}
                          >
                            {notification.actionLabel || 'View'}
                          </Button>
                        </Box>
                      )}
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {!notification.read && (
                        <Button
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleMarkAsRead(notification._id)}
                          variant="outlined"
                        >
                          Mark read
                        </Button>
                      )}
                      <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(notification._id)}
                        variant="outlined"
                        color="error"
                      >
                        Delete
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, value) => setCurrentPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default NotificationsPage;
