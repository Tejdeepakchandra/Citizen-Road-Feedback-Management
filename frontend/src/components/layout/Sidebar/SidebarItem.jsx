import React from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Box,
  Typography,
  useTheme,
  Tooltip,
  alpha,
} from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import {Link as RouterLink} from 'react-router-dom';

const SidebarItem = ({ item, collapsed, showBadge = false, badgeContent = 0 }) => {
  const theme = useTheme();
  const location = useLocation();
  
  // Check if the current route is active
  const isActive = location.pathname === item.path || 
                   (item.exact ? false : location.pathname.startsWith(item.path));

  const activeStyle = {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    backdropFilter: 'blur(10px)',
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
    '& .MuiListItemText-primary': {
      color: theme.palette.primary.main,
      fontWeight: 600,
    },
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.15),
    },
  };

  const baseStyle = {
    borderRadius: 2,
    mb: 0.5,
    position: 'relative',
    overflow: 'hidden',
    borderLeft: '3px solid transparent',
    '&:hover': {
      backgroundColor: alpha(theme.palette.action.hover, 0.05),
    },
    transition: 'all 0.2s ease',
  };

  // Icon with optional badge
  const IconWithBadge = () => {
    const iconElement = (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {item.icon}
      </Box>
    );

    if (showBadge && badgeContent > 0) {
      return (
        <Badge
          badgeContent={badgeContent}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.6rem',
              height: 18,
              minWidth: 18,
              right: -3,
              top: -3,
              border: `2px solid ${theme.palette.background.paper}`,
            },
          }}
        >
          {iconElement}
        </Badge>
      );
    }

    return iconElement;
  };

  const content = (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <ListItemButton
        component={RouterLink}
        to={item.path}
        end={item.exact}
        sx={{
          ...baseStyle,
          ...(isActive && activeStyle),
          pl: collapsed ? 2 : 2,
          pr: collapsed ? 2 : 1.5,
          py: 1.25,
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: collapsed ? 'auto' : 40,
            mr: collapsed ? 0 : 1.5,
            justifyContent: 'center',
            color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
            fontSize: '1.25rem',
          }}
        >
          <IconWithBadge />
        </ListItemIcon>
        
        {!collapsed && (
          <>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography 
                    variant="body2" 
                    fontWeight={isActive ? 600 : 500}
                    sx={{
                      color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                    }}
                  >
                    {item.title}
                  </Typography>
                  
                  {/* Badge on the right side for non-collapsed */}
                  {showBadge && badgeContent > 0 && (
                    <Badge
                      badgeContent={badgeContent}
                      color="error"
                      sx={{
                        ml: 1,
                        '& .MuiBadge-badge': {
                          fontSize: '0.65rem',
                          height: 20,
                          minWidth: 20,
                        },
                      }}
                    />
                  )}
                </Box>
              }
            />
          </>
        )}
      </ListItemButton>
    </ListItem>
  );

  if (collapsed) {
    return (
      <Tooltip 
        title={
          <Box>
            <Typography variant="body2">{item.title}</Typography>
            {showBadge && badgeContent > 0 && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                {badgeContent} new
              </Typography>
            )}
          </Box>
        } 
        placement="right" 
        arrow
        componentsProps={{
          tooltip: {
            sx: {
              backdropFilter: 'blur(10px)',
              backgroundColor: alpha(theme.palette.background.paper, 0.95),
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
              py: 1,
              px: 1.5,
            },
          },
          arrow: {
            sx: {
              color: alpha(theme.palette.background.paper, 0.95),
            },
          },
        }}
      >
        {content}
      </Tooltip>
    );
  }

  return content;
};

export default SidebarItem;