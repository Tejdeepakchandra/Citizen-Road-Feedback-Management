import React from 'react';
import { Avatar, IconButton, Box, Typography, useTheme } from '@mui/material';
import { KeyboardArrowDown } from '@mui/icons-material';
import { useAuth } from '../../../context/AuthContext';

const UserAvatar = ({ onMenuOpen }) => {
  const { user } = useAuth();
  const theme = useTheme();

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
    ];
    const index = name?.length % colors.length || 0;
    return colors[index];
  };

  return (
    <IconButton
      onClick={onMenuOpen}
      sx={{
        p: 0.5,
        borderRadius: 2,
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: getAvatarColor(user?.name),
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {user?.name ? getInitials(user.name) : 'U'}
        </Avatar>
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Typography variant="body2" fontWeight={600} lineHeight={1}>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" lineHeight={1}>
            {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Citizen'}
          </Typography>
        </Box>
        <KeyboardArrowDown sx={{ fontSize: 16, color: 'text.secondary' }} />
      </Box>
    </IconButton>
  );
};

export default UserAvatar;