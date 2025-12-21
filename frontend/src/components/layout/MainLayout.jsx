import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Container, useTheme as useMuiTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import MainNavbar from './Navbar/MainNavbar';
import UserSidebar from './Sidebar/UserSidebar';
import AdminSidebar from './Sidebar/AdminSidebar';
import StaffSidebar from './Sidebar/StaffSidebar';
import MainFooter from './Footer/MainFooter';

const MainLayout = () => {
  const { darkMode } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { currentWidth } = useSidebar();
  const theme = useMuiTheme();
  const location = useLocation();

  // Add dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Determine which sidebar to show based on user role
  const renderSidebar = () => {
    if (!user || !isAuthenticated) return null;
    
    switch (user.role) {
      case 'admin':
        return <AdminSidebar />;
      case 'staff':
        return <StaffSidebar />;
      default:
        return <UserSidebar />;
    }
  };

  const sidebar = renderSidebar();
  const hasSidebar = !!sidebar;

  // Check if current route is admin route
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isStaffRoute = location.pathname.startsWith('/staff');
  
  // Set appropriate background based on route
  const getBackground = () => {
    if (isAdminRoute) {
      return darkMode 
        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
    } else if (isStaffRoute) {
      return darkMode 
        ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)'
        : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
    }
    return darkMode 
      ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
      : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)';
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: getBackground(),
        transition: 'background 0.5s ease',
      }}
    >
      {/* Main Navbar - Always visible */}
      <MainNavbar />

      {/* Main Content Area */}
      <Box sx={{ 
        display: 'flex', 
        flex: 1, 
        position: 'relative',
        mt: { xs: '56px', sm: '64px' }
      }}>
        {/* Sidebar Container */}
        {sidebar && (
          <Box
            sx={{
              position: 'fixed',
              zIndex: 100,
              height: 'calc(100vh - 64px)',
              top: '64px',
              left: 0,
              width: `${currentWidth}px`,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.easeInOut,
                duration: theme.transitions.duration.standard,
              }),
              overflow: 'hidden',
            }}
          >
            {sidebar}
          </Box>
        )}

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            ml: hasSidebar ? { xs: 0, md: `${currentWidth}px` } : 0,
            width: hasSidebar ? { xs: '100%', md: `calc(100% - ${currentWidth}px)` } : '100%',
            transition: theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.standard,
            }),
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Container
            maxWidth="xl"
            sx={{
              py: 4,
              px: { xs: 2, sm: 3, md: 4 },
              flex: 1,
              width: '100%',
              maxWidth: '100% !important',
            }}
          >
            {/* Use Outlet to render child routes */}
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  width: '100%'
                }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Container>

          {/* Footer - Hide on admin pages */}
          {!isAdminRoute && !isStaffRoute && <MainFooter />}
        </Box>
      </Box>

      {/* Floating background elements */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {/* Animated background particles */}
        {[...Array(15)].map((_, i) => (
          <Box
            key={i}
            component={motion.div}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            sx={{
              position: 'absolute',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: `radial-gradient(circle, 
                ${isAdminRoute 
                  ? darkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'
                  : darkMode ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.03)'
                } 0%, 
                transparent 70%)`,
              filter: 'blur(40px)',
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default MainLayout;