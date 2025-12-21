import React from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Box,
  Typography,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  Report,
  Assignment,
  CheckCircle,
  Warning,
  Error,
  Paid,
  Feedback,
  Close,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../context/NotificationContext';

const NotificationItem = ({ notification, onDelete }) => {
  const theme = useTheme();
  const { markAsRead } = useNotifications();

  const getIcon = (type) => {
    const iconMap = {
      report: <Report />,
      assignment: <Assignment />,
      status_update: <CheckCircle />,
      warning: <Warning />,
      error: <Error />,
      donation: <Paid />,
      feedback: <Feedback />,
    };
    return iconMap[type] || <NotificationIcon />;
  };

  const getColor = (type) => {
    const colorMap = {
      report: theme.palette.primary.main,
      assignment: theme.palette.info.main,
      status_update: theme.palette.success.main,
      warning: theme.palette.warning.main,
      error: theme.palette.error.main,
      donation: theme.palette.success.main,
      feedback: theme.palette.secondary.main,
    };
    return colorMap[type] || theme.palette.grey[600];
  };

  const getPriorityChip = (priority) => {
    const colorMap = {
      high: 'error',
      medium: 'warning',
      low: 'info',
    };
    return (
      <Chip
        label={priority}
        size="small"
        color={colorMap[priority]}
        sx={{ height: 16, fontSize: '0.6rem', ml: 1 }}
      />
    );
  };

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    // Handle navigation based on notification type
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification._id);
    }
  };

  return (
    <ListItem
      disablePadding
      sx={{
        backgroundColor: notification.read ? 'transparent' : `${getColor(notification.type)}08`,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <ListItemButton
        onClick={handleClick}
        sx={{
          py: 1.5,
          '&:hover': {
            backgroundColor: `${theme.palette.action.hover} !important`,
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: `${getColor(notification.type)}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: getColor(notification.type),
            }}
          >
            {getIcon(notification.type)}
          </Box>
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" fontWeight={notification.read ? 400 : 600}>
                {notification.title}
              </Typography>
              {notification.priority === 'high' && !notification.read && (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.error.main,
                    ml: 1,
                  }}
                />
              )}
            </Box>
          }
          secondary={
            <Box>
              <Typography variant="body2" color="text.secondary" noWrap>
                {notification.message}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </Typography>
                {notification.priority && getPriorityChip(notification.priority)}
              </Box>
            </Box>
          }
        />
        <ListItemSecondaryAction>
          <IconButton
            edge="end"
            size="small"
            onClick={handleDelete}
            sx={{
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItemButton>
    </ListItem>
  );
};

export default NotificationItem;