import React, { useState } from 'react';
import {
  Box,
  List,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle,
  Delete,
  FilterList,
  MoreVert,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';
import NotificationItem from './NotificationItem';
import { formatDistanceToNow } from 'date-fns';

const NotificationList = () => {
  const [filter, setFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleFilterSelect = (selectedFilter) => {
    setFilter(selectedFilter);
    handleFilterClose();
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleDeleteAll = () => {
    notifications.forEach((notification) => {
      deleteNotification(notification._id);
    });
  };

  const filters = [
    { value: 'all', label: 'All Notifications' },
    { value: 'unread', label: 'Unread Only' },
    { value: 'read', label: 'Read Only' },
    { value: 'system', label: 'System Updates' },
    { value: 'report', label: 'Report Updates' },
    { value: 'donation', label: 'Donations' },
  ];

  return (
    <Box sx={{ maxWidth: 400, width: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
          <Typography variant="h6" fontWeight={600}>
            Notifications
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size="small"
            onClick={handleFilterClick}
            title="Filter notifications"
          >
            <FilterList />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleMarkAllAsRead}
            title="Mark all as read"
            disabled={unreadCount === 0}
          >
            <CheckCircle />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleDeleteAll}
            title="Delete all"
            disabled={notifications.length === 0}
          >
            <Delete />
          </IconButton>
        </Box>
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleFilterClose}
      >
        {filters.map((filterItem) => (
          <MenuItem
            key={filterItem.value}
            onClick={() => handleFilterSelect(filterItem.value)}
            selected={filter === filterItem.value}
          >
            {filterItem.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          <AnimatePresence>
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <NotificationItem
                  notification={notification}
                  onDelete={deleteNotification}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </List>
      ) : (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            color: theme.palette.text.secondary,
          }}
        >
          <NotificationsIcon sx={{ fontSize: 48, opacity: 0.5, mb: 2 }} />
          <Typography variant="body1">
            No notifications found
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {filter !== 'all'
              ? `Try changing the filter to see more notifications`
              : `You're all caught up!`}
          </Typography>
        </Box>
      )}

      {/* Footer Actions */}
      {filteredNotifications.length > 0 && (
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Button
            size="small"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
          <Button
            size="small"
            color="error"
            onClick={handleDeleteAll}
          >
            Clear all
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default NotificationList;