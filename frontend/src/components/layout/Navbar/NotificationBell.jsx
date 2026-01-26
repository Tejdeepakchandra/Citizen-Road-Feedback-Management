// components/layout/Navbar/NotificationBell.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import { useNotifications } from '../../../hooks/useNotifications';
import { useSocket } from '../../../hooks/useSocket';
import { useAuth } from '../../../context/AuthContext';

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-IN', {
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

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead, 
    deleteNotification, 
    markAllAsRead 
  } = useNotifications();
  const { socket } = useSocket();

  // Get role-based notifications URL
  const getNotificationsPath = () => {
    if (!user) return '/notifications';
    
    const role = user.role?.toLowerCase();
    if (role === 'admin') return '/admin/notifications';
    if (role === 'staff') return '/staff/notifications';
    if (role === 'user' || role === 'citizen') return '/user/notifications';
    return '/notifications';
  };

  const handleViewAll = () => {
    handleClose();
    navigate(getNotificationsPath());
  };

  // Fetch initial notifications on mount
  useEffect(() => {
    console.log('🔔 NotificationBell mounted, fetching initial notifications');
    fetchNotifications();
  }, [fetchNotifications]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) {
      console.log('⚠️ Socket not available yet');
      return;
    }

    console.log('🔗 Setting up socket listeners for real-time notifications');

    // Listen for new notifications
    socket.on('notification:new', (data) => {
      console.log('📬 New notification received:', data);
      // Refresh to get updated list
      fetchNotifications();
    });

    // Listen for notification updates
    socket.on('notification:update', (data) => {
      console.log('📖 Notification updated:', data);
      fetchNotifications();
    });

    // Listen for notification deletion
    socket.on('notification:delete', (data) => {
      console.log('🗑️ Notification deleted:', data.notificationId);
      fetchNotifications();
    });

    return () => {
      socket.off('notification:new');
      socket.off('notification:update');
      socket.off('notification:delete');
    };
  }, [socket, fetchNotifications]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId
            ? { ...notif, read: true }
            : notif
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      // Refresh notifications list
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      // Refresh notifications list
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      // Delete all read notifications one by one
      const readNotifs = notifications.filter(n => n.read);
      for (const notif of readNotifs) {
        await deleteNotification(notif._id);
      }
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete read notifications:', error);
    }
  };

  // Get priority color
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

  // Get type icon/label
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
      warning: '⚠️ Warning'
    };
    return typeMap[type] || '📬 Notification';
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          backdropFilter: 'blur(10px)',
          background: 'rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          '&:hover': {
            background: 'rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            backgroundColor: muiTheme.palette.mode === 'dark' 
              ? 'rgba(30, 41, 59, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            color: muiTheme.palette.text.primary,
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            py: 1.5,
            backgroundColor: muiTheme.palette.mode === 'dark'
              ? 'rgba(51, 65, 85, 0.5)'
              : '#f5f5f5',
            borderBottom: `1px solid ${muiTheme.palette.divider}`,
          }}
        >
          <Typography variant="h6">Notifications</Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {unreadCount > 0 && (
              <Button
                size="small"
                startIcon={<DoneAllIcon />}
                onClick={handleMarkAllAsRead}
                title="Mark all notifications as read"
              >
                Mark all
              </Button>
            )}
            {notifications.filter(n => n.read).length > 0 && (
              <Button
                size="small"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteAllRead}
                title="Delete all read notifications"
                sx={{ color: 'error.main' }}
              >
                Clear read
              </Button>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Notifications List */}
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <Box
                key={notification._id}
                sx={{
                  p: 2,
                  borderBottom: index < notifications.length - 1 ? `1px solid ${muiTheme.palette.divider}` : 'none',
                  backgroundColor: notification.read 
                    ? 'transparent'
                    : muiTheme.palette.mode === 'dark'
                      ? 'rgba(71, 85, 105, 0.2)'
                      : '#f9f9f9',
                  '&:hover': {
                    backgroundColor: muiTheme.palette.mode === 'dark'
                      ? 'rgba(71, 85, 105, 0.3)'
                      : '#f5f5f5',
                  },
                  transition: 'background-color 0.2s',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    gap: 1,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    {/* Type Badge + Title */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
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
                      variant="subtitle2"
                      sx={{
                        fontWeight: notification.read ? 400 : 600,
                        mb: 0.5,
                      }}
                    >
                      {notification.title}
                    </Typography>

                    {/* Message */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
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
                          onClick={() => {
                            console.log('🔗 Navigating to:', notification.actionUrl);
                            navigate(notification.actionUrl);
                            handleClose();
                            // Mark as read when clicked
                            if (!notification.read) {
                              handleMarkAsRead(notification._id);
                            }
                          }}
                        >
                          {notification.actionLabel || 'View'}
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {/* Delete & Mark as Read Buttons */}
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 0.5,
                    }}
                  >
                    {!notification.read && (
                      <IconButton
                        size="small"
                        onClick={() => handleMarkAsRead(notification._id)}
                        title="Mark as read"
                      >
                        <DoneAllIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(notification._id)}
                      title="Delete"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            ))
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsIcon
                sx={{
                  fontSize: 48,
                  color: '#ccc',
                  mb: 1,
                }}
              />
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
            </Box>
          )}
        </Box>

        {/* View All Link */}
        {notifications.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Button
                size="small"
                color="primary"
                onClick={handleViewAll}
              >
                View All Notifications
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;