// src/components/layout/Navbar/MainNavbar.jsx
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Button,
  Container,
  useTheme as useMuiTheme,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Search,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme as useCustomTheme } from '../../../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';

const MainNavbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout, loading } = useAuth();
  const { darkMode } = useCustomTheme(); // ✅ Get darkMode (or remove if not used)
  const theme = useMuiTheme();
  const navigate = useNavigate();

  const isMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: alpha(theme.palette.background.paper, 0.85),
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: alpha(theme.palette.background.paper, 0.95),
          },
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ 
            py: 1,
            minHeight: { xs: '56px', sm: '64px' },
          }}>
            {/* Logo with Neon Glow */}
            <Box
              component={Link}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                mr: 4,
                position: 'relative',
                '&:hover .logo-glow': {
                  opacity: 1,
                },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  position: 'relative',
                  boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 18,
                  }}
                >
                  R
                </Typography>
                {/* Neon Glow Effect */}
                <Box
                  className="logo-glow"
                  sx={{
                    position: 'absolute',
                    top: -2,
                    left: -2,
                    right: -2,
                    bottom: -2,
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%)',
                    filter: 'blur(10px)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    zIndex: -1,
                  }}
                />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: { xs: 'none', md: 'block' },
                }}
              >
                RoadCare
              </Typography>
            </Box>

            {/* Navigation Links with Glass Effect */}

{/* Navigation Links with Glass Effect */}
{/* Navigation Links with Glass Effect */}
<Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
  {/* Show Home and Gallery for everyone */}
  <Button
    component={Link}
    to="/"
    sx={{
      mx: 1,
      color: theme.palette.text.primary,
      fontWeight: 600,
      position: 'relative',
      overflow: 'hidden',
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '0%',
        height: '2px',
        background: 'linear-gradient(90deg, #6366F1 0%, #0EA5E9 100%)',
        transition: 'width 0.3s ease',
      },
      '&:hover::after': {
        width: '100%',
      },
    }}
  >
    Home
  </Button>
  
  <Button
    component={Link}
    to="/gallery"
    sx={{
      mx: 1,
      color: theme.palette.text.primary,
      fontWeight: 600,
      position: 'relative',
      overflow: 'hidden',
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '0%',
        height: '2px',
        background: 'linear-gradient(90deg, #6366F1 0%, #0EA5E9 100%)',
        transition: 'width 0.3s ease',
      },
      '&:hover::after': {
        width: '100%',
      },
    }}
  >
    Gallery
  </Button>

  {/* FIX: Only show role-specific links when user is logged in */}
  {user ? (
    <>
      {/* Citizen links */}
      {user.role === 'citizen' && (
        <>
          <Button
            component={Link}
            to="/reports/new"
            sx={{
              mx: 1,
              color: theme.palette.text.primary,
              fontWeight: 600,
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '0%',
                height: '2px',
                background: 'linear-gradient(90deg, #6366F1 0%, #0EA5E9 100%)',
                transition: 'width 0.3s ease',
              },
              '&:hover::after': {
                width: '100%',
              },
            }}
          >
            Report Issue
          </Button>
          <Button
            component={Link}
            to="/donate"
            sx={{
              mx: 1,
              color: theme.palette.text.primary,
              fontWeight: 600,
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '0%',
                height: '2px',
                background: 'linear-gradient(90deg, #6366F1 0%, #0EA5E9 100%)',
                transition: 'width 0.3s ease',
              },
              '&:hover::after': {
                width: '100%',
              },
            }}
          >
            Donate
          </Button>
          <Button
            component={Link}
            to="/dashboard"
            sx={{
              mx: 1,
              color: theme.palette.text.primary,
              fontWeight: 600,
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '0%',
                height: '2px',
                background: 'linear-gradient(90deg, #6366F1 0%, #0EA5E9 100%)',
                transition: 'width 0.3s ease',
              },
              '&:hover::after': {
                width: '100%',
              },
            }}
          >
            Dashboard
          </Button>
        </>
      )}

      {/* Staff link */}
      {user.role === 'staff' && (
        <Button
          component={Link}
          to="/staff/dashboard"
          sx={{
            mx: 1,
            color: theme.palette.text.primary,
            fontWeight: 600,
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '0%',
              height: '2px',
              background: 'linear-gradient(90deg, #6366F1 0%, #0EA5E9 100%)',
              transition: 'width 0.3s ease',
            },
            '&:hover::after': {
              width: '100%',
            },
          }}
        >
          Staff Dashboard
        </Button>
      )}

      {/* Admin link */}
      {user.role === 'admin' && (
        <Button
          component={Link}
          to="/admin/dashboard"
          sx={{
            mx: 1,
            color: theme.palette.text.primary,
            fontWeight: 600,
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '0%',
              height: '2px',
              background: 'linear-gradient(90deg, #6366F1 0%, #0EA5E9 100%)',
              transition: 'width 0.3s ease',
            },
            '&:hover::after': {
              width: '100%',
            },
          }}
        >
          Admin Dashboard
        </Button>
      )}
    </>
  ) : (
    // FIX: Show login/register prompts for logged-out users
    <>
      <Button
        component={Link}
        to="/about"
        sx={{
          mx: 1,
          color: theme.palette.text.primary,
          fontWeight: 600,
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '0%',
            height: '2px',
            background: 'linear-gradient(90deg, #6366F1 0%, #0EA5E9 100%)',
            transition: 'width 0.3s ease',
          },
          '&:hover::after': {
            width: '100%',
          },
        }}
      >
        About
      </Button>
      <Button
        component={Link}
        to="/how-it-works"
        sx={{
          mx: 1,
          color: theme.palette.text.primary,
          fontWeight: 600,
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '0%',
            height: '2px',
            background: 'linear-gradient(90deg, #6366F1 0%, #0EA5E9 100%)',
            transition: 'width 0.3s ease',
          },
          '&:hover::after': {
            width: '100%',
          },
        }}
      >
        How It Works
      </Button>
      <Button
        component={Link}
        to="/contact"
        sx={{
          mx: 1,
          color: theme.palette.text.primary,
          fontWeight: 600,
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '0%',
            height: '2px',
            background: 'linear-gradient(90deg, #6366F1 0%, #0EA5E9 100%)',
            transition: 'width 0.3s ease',
          },
          '&:hover::after': {
            width: '100%',
          },
        }}
      >
        Contact
      </Button>
    </>
  )}
</Box>

            {/* Right Section with Glass Buttons */}
            {/* Right Section with Glass Buttons */}
<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
  

  {/* Theme Toggle */}
  <ThemeToggle />

  {/* FIX: Show loading indicator while auth is loading */}
  {loading ? (
    <Box sx={{ width: 120, display: 'flex', justifyContent: 'center' }}>
      <CircularProgress size={24} />
    </Box>
  ) : user ? (
    <>
      {/* Notification Bell */}
      <NotificationBell />

      {/* User Avatar with Neon Border */}
      <IconButton
        onClick={handleProfileMenuOpen}
        sx={{
          p: 0.5,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%)',
            zIndex: 0,
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          '&:hover::before': {
            opacity: 1,
          },
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%)',
            fontSize: 16,
            fontWeight: 700,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </Avatar>
      </IconButton>
    </>
  ) : (
    <>
      <Button
        component={Link}
        to="/login"
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderWidth: 2,
          borderColor: alpha(theme.palette.primary.main, 0.3),
          fontWeight: 600,
          backdropFilter: 'blur(10px)',
          background: alpha(theme.palette.background.paper, 0.3),
          color: theme.palette.text.primary,
          '&:hover': {
            borderColor: theme.palette.primary.main,
            background: alpha(theme.palette.primary.main, 0.1),
          },
        }}
      >
        Login
      </Button>
      <Button
        component={Link}
        to="/register"
        variant="contained"
        sx={{
          borderRadius: 3,
          background: 'linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%)',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
          fontWeight: 600,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 30px rgba(99, 102, 241, 0.6)',
          },
        }}
      >
        Sign Up
      </Button>
    </>
  )}
</Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Profile Menu - FIXED: Using handleNavigation */}
<Menu
  anchorEl={anchorEl}
  open={isMenuOpen}
  onClose={handleMenuClose}
  PaperProps={{
    sx: {
      mt: 1.5,
      minWidth: 200,
      backdropFilter: 'blur(20px)',
      background: alpha(theme.palette.background.paper, 0.9),
      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    },
  }}
>
  {/* Show different dashboard based on role */}
  {user?.role === 'admin' && (
    <MenuItem
      onClick={() => handleNavigation('/admin/dashboard')}
      sx={{
        '&:hover': {
          background: alpha(theme.palette.primary.main, 0.1),
        },
      }}
    >
      Admin Dashboard
    </MenuItem>
  )}
  
  {user?.role === 'staff' && (
    <MenuItem
      onClick={() => handleNavigation('/staff/dashboard')}
      sx={{
        '&:hover': {
          background: alpha(theme.palette.primary.main, 0.1),
        },
      }}
    >
      Staff Dashboard
    </MenuItem>
  )}
  
  {user?.role === 'citizen' && (
    <MenuItem
      onClick={() => handleNavigation('/dashboard')}
      sx={{
        '&:hover': {
          background: alpha(theme.palette.primary.main, 0.1),
        },
      }}
    >
      Citizen Dashboard
    </MenuItem>
  )}

  <MenuItem
    onClick={() => handleNavigation('/profile')}
    sx={{
      '&:hover': {
        background: alpha(theme.palette.primary.main, 0.1),
      },
    }}
  >
    Profile
  </MenuItem>
  
  <MenuItem
    onClick={handleLogout}
    sx={{
      color: theme.palette.error.main,
      '&:hover': {
        background: alpha(theme.palette.error.main, 0.1),
      },
    }}
  >
    Logout
  </MenuItem>
</Menu>
    </>
  );
};

export default MainNavbar;