// src/components/layout/Sidebar/UserSidebar.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  List,
  Divider,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  alpha,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Dashboard,
  AddCircle,
  ListAlt,
  PhotoLibrary,
  Paid,
  Settings,
  ChevronLeft,
  ChevronRight,
  HelpOutline,
  Feedback,
} from "@mui/icons-material";
import SidebarItem from "./SidebarItem";
import { useAuth } from "../../../context/AuthContext";
import { useSidebar } from "../../../context/SidebarContext";
import { dashboardAPI } from "../../../services/api";

const UserSidebar = () => {
  const { collapsed, toggleSidebar } = useSidebar();
  const [stats, setStats] = useState({ total: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user,isAuthenticated } = useAuth();

 useEffect(() => {
    // Only fetch if user is authenticated
    if (user && isAuthenticated) {
      fetchUserStats();
    } else {
      setLoading(false);
    }
  }, [user, isAuthenticated]); 

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await dashboardAPI.getCitizenStats();
      
      let data = response.data;
      if (data && data.data) {
        data = data.data;
      }
      
      setStats({
        total: data.totalReports || data.total || 0,
        resolved: data.resolved || data.resolvedCount || 0,
      });
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
      setError("Failed to load statistics");
      setStats({ total: 0, resolved: 0 });
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: <Dashboard />,
      path: "/dashboard",
      exact: true,
      color: "#6366F1",
      gradient: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
    },
    {
      title: "New Report",
      icon: <AddCircle />,
      path: "/reports/new",
      color: "#10B981",
      gradient: "linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)",
    },
    {
      title: "My Reports",
      icon: <ListAlt />,
      path: "/reports/my-reports",
      color: "#F59E0B",
      gradient: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)",
    },
    {
      title: "My Feedback",
      icon: <Feedback />,
      path: "/feedback",
      color: "#EC4899",
      gradient: "linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)",
    },
    {
      title: "Gallery",
      icon: <PhotoLibrary />,
      path: "/gallery",
      color: "#0EA5E9",
      gradient: "linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)",
    },
    {
      title: "Donations",
      icon: <Paid />,
      path: "/donate",
      color: "#8B5CF6",
      gradient: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
    },
    {
      title: "Settings",
      icon: <Settings />,
      path: "/settings",
      color: "#64748B",
      gradient: "linear-gradient(135deg, #64748B 0%, #475569 100%)",
    },
  ];

  if (!user || !isAuthenticated || isMobile) return null;

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        backdropFilter: 'blur(30px) saturate(200%)',
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        borderRight: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        boxShadow: `inset -2px 0 20px ${alpha(theme.palette.primary.main, 0.05)}`,
        transition: theme.transitions.create(['width', 'transform'], {
          easing: theme.transitions.easing.easeInOut,
          duration: theme.transitions.duration.standard,
        }),
        overflowX: 'hidden',
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%)',
          borderRadius: '4px',
        },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header with Logo and Toggle */}
      <Box
        sx={{
          p: collapsed ? 2 : 3,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          minHeight: 64,
          background: `linear-gradient(90deg, ${alpha(
            theme.palette.primary.main,
            0.05
          )} 0%, transparent 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
              }}
            >
              <Typography
                sx={{
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  fontSize: "1.1rem",
                }}
              >
                {user?.name?.split(" ")[0] || "User"}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: alpha(theme.palette.text.secondary, 0.7),
                  display: "block",
                }}
              >
                {user?.email?.split("@")[0] || "user"}
              </Typography>
            </Box>
          </Box>
        )}
        
        <IconButton
          onClick={toggleSidebar}
          sx={{
            backdropFilter: "blur(10px)",
            backgroundColor: alpha(theme.palette.background.paper, 0.3),
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            width: 32,
            height: 32,
            marginLeft: collapsed ? 0 : 1,
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              borderColor: theme.palette.primary.main,
            },
          }}
        >
          {collapsed ? (
            <ChevronRight sx={{ fontSize: 18 }} />
          ) : (
            <ChevronLeft sx={{ fontSize: 18 }} />
          )}
        </IconButton>
      </Box>

      {/* User Stats Section */}
      {!collapsed && (
        <Box sx={{ p: 3 }}>
          <Typography
            variant="caption"
            sx={{
              color: alpha(theme.palette.text.secondary, 0.7),
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              mb: 2,
              display: "block",
            }}
          >
            Your Activity
          </Typography>
          
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            {/* Total Reports Card */}
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 2,
                backdropFilter: "blur(10px)",
                background: alpha(theme.palette.primary.main, 0.08),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                textAlign: "center",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
                },
              }}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: theme.palette.primary.main }} />
              ) : error ? (
                <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
                  Error
                </Typography>
              ) : (
                <>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    sx={{
                      color: theme.palette.primary.main,
                      mb: 0.5,
                    }}
                  >
                    {stats.total}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.8),
                      fontWeight: 500,
                    }}
                  >
                    Total Reports
                  </Typography>
                </>
              )}
            </Box>
            
            {/* Resolved Reports Card */}
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 2,
                backdropFilter: "blur(10px)",
                background: alpha(theme.palette.success.main, 0.08),
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                textAlign: "center",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.1)}`,
                },
              }}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: theme.palette.success.main }} />
              ) : error ? (
                <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
                  Error
                </Typography>
              ) : (
                <>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    sx={{
                      color: theme.palette.success.main,
                      mb: 0.5,
                    }}
                  >
                    {stats.resolved}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.8),
                      fontWeight: 500,
                    }}
                  >
                    Resolved
                  </Typography>
                </>
              )}
            </Box>
          </Box>
          
          {/* Progress Bar */}
          {!loading && !error && stats.total > 0 && (
            <Box sx={{ mt: 1 }}>
              <Box
                sx={{
                  height: 4,
                  borderRadius: 2,
                  background: alpha(theme.palette.divider, 0.2),
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    width: `${(stats.resolved / stats.total) * 100}%`,
                    background: "linear-gradient(90deg, #10B981 0%, #0EA5E9 100%)",
                    borderRadius: 2,
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: alpha(theme.palette.text.secondary, 0.7),
                  mt: 0.5,
                  display: "block",
                  textAlign: "center",
                }}
              >
                {Math.round((stats.resolved / stats.total) * 100)}% resolved
              </Typography>
            </Box>
          )}
          
          {!loading && stats.total === 0 && (
            <Typography
              variant="caption"
              sx={{
                color: alpha(theme.palette.text.secondary, 0.7),
                display: "block",
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              No reports yet
            </Typography>
          )}
        </Box>
      )}

      <Divider sx={{ 
        borderColor: alpha(theme.palette.divider, 0.08), 
        mx: 2 
      }} />

      {/* Navigation Menu */}
      <List sx={{ px: 2, py: 2, flex: 1 }}>
        {menuItems.map((item, index) => (
          <SidebarItem
            key={index}
            item={item}
            collapsed={collapsed}
          />
        ))}
      </List>

      {/* Help & Support Section */}
      <Box sx={{ p: 2, mt: "auto" }}>
        {!collapsed ? (
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              backdropFilter: "blur(20px)",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(14, 165, 233, 0.02) 100%)",
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s ease",
              "&:hover": {
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(14, 165, 233, 0.04) 100%)",
                borderColor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <HelpOutline sx={{ color: "#fff", fontSize: 18 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ 
                    color: theme.palette.text.primary, 
                    mb: 0.5 
                  }}
                >
                  Need Help?
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ 
                    color: alpha(theme.palette.text.secondary, 0.7), 
                    lineHeight: 1.4 
                  }}
                >
                  Our support team is here to help you 24/7
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : (
          <Tooltip title="Need Help?" placement="right" arrow>
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <IconButton
                sx={{
                  backdropFilter: "blur(10px)",
                  backgroundColor: alpha(theme.palette.background.paper, 0.3),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  width: 40,
                  height: 40,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                <HelpOutline sx={{ 
                  fontSize: 20, 
                  color: theme.palette.primary.main 
                }} />
              </IconButton>
            </Box>
          </Tooltip>
        )}

        {/* Version Info */}
        {!collapsed && (
          <Typography
            variant="caption"
            sx={{
              color: alpha(theme.palette.text.secondary, 0.5),
              fontSize: "0.65rem",
              display: "block",
              textAlign: "center",
              mt: 2,
            }}
          >
            RoadCare v1.0
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default UserSidebar;