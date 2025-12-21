import React from 'react';
import { Badge, BadgeProps, styled } from '@mui/material';

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: 6,
    top: 6,
    border: `2px solid ${theme.palette.background.paper}`,
    padding: '0 4px',
    fontSize: '0.65rem',
    fontWeight: 600,
  },
}));

const NotificationBadge = ({ children, count, max = 99, ...props }) => {
  return (
    <StyledBadge
      badgeContent={count > max ? `${max}+` : count}
      color="error"
      max={max}
      {...props}
    >
      {children}
    </StyledBadge>
  );
};

export default NotificationBadge;