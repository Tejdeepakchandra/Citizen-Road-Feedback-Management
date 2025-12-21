// components/layout/Navbar/NotificationBell.jsx
import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications] = useState([
    { id: 1, text: 'New report submitted', time: '2 hours ago' },
    { id: 2, text: 'Your donation was received', time: '1 day ago' },
    { id: 3, text: 'Issue #1234 was resolved', time: '2 days ago' },
  ]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
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
        <Badge badgeContent={notifications.length} color="error">
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
      >
        <Box sx={{ width: 320, maxHeight: 400, overflow: 'auto' }}>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <MenuItem key={notification.id} onClick={handleClose}>
                <Box sx={{ py: 1 }}>
                  <Typography variant="body2">{notification.text}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notification.time}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                No notifications
              </Typography>
            </MenuItem>
          )}
        </Box>
      </Menu>
    </>
  );
};

export default NotificationBell;