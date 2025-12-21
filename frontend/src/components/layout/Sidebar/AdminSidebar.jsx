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
  Badge,
  Avatar,
} from "@mui/material";
import {
  Dashboard,
  People,
  Assignment,
  PhotoLibrary,
  AttachMoney,
  Settings,
  ChevronLeft,
  ChevronRight,
  HelpOutline,
  Construction,
  BarChart,
  Storage,
  Security,
  Flag,
  ReceiptLong,
  NotificationsActive,
  CheckCircle,
  Warning,
  Home,
  Logout,
} from "@mui/icons-material";
import SidebarItem from "./SidebarItem";
import { useAuth } from "../../../context/AuthContext";
import { useSidebar } from "../../../context/SidebarContext";
import { adminAPI } from "../../../services/api";
import { useNavigate, useLocation } from "react-router-dom";

const AdminSidebar = () => {
  const { collapsed, toggleSidebar } = useSidebar();
  const [stats, setStats] = useState({ 
    pendingImages: 0, 
    pendingReports: 0,
    totalUsers: 0 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user && isAuthenticated && user.role === 'admin') {
      fetchAdminStats();
    } else {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch admin dashboard stats
      const response = await adminAPI.getDashboard();
      const data = response.data.data;
      
      setStats({
        pendingImages: data.summary?.pendingImages || 0,
        pendingReports: data.summary?.totalReports - (data.summary?.resolvedReports || 0) || 0,
        totalUsers: data.summary?.totalUsers || 0
      });
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
      setError("Failed to load statistics");
      setStats({ pendingImages: 0, pendingReports: 0, totalUsers: 0 });
    } finally {
      setLoading(false);
    }
  };

  const adminMenuItems = [
    {
      title: "Dashboard",
      icon: <Dashboard />,
      path: "/admin/dashboard",
      exact: true,
      color: "#6366F1",
      gradient: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
    },
    {
      title: "User Management",
      icon: <People />,
      path: "/admin/users", // ADD THIS - default page when clicking main item

      children: [
        { 
          title: "All Users", 
          path: "/admin/users",
          icon: <People fontSize="small" /> 
        },
        { 
          title: "Staff Management", 
          path: "/admin/staff",
          icon: <Construction fontSize="small" />,
          badge: stats.totalUsers > 0 ? "Staff" : null
        },
        { 
          title: "Create User", 
          path: "/admin/users/create",
          icon: <People fontSize="small" />
        },
      ],
      color: "#10B981",
      gradient: "linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)",
    },
    
  {
  title: "Issue Management",
  icon: <Assignment />,
  path: "/admin/reports", // 👈 ADD THIS - default page when clicking main item
  children: [
    { 
      title: "All Reports", 
      path: "/admin/reports",
      icon: <Assignment fontSize="small" />
    },
    { 
      title: "Pending Assignments", 
      path: "/admin/reports/pending",
      icon: <Warning fontSize="small" />,
      badge: stats.pendingReports > 0 ? stats.pendingReports : null
    },
    { 
      title: "Issue Categories", 
      path: "/admin/reports/categories",
      icon: <Flag fontSize="small" />
    },
  ],
  color: "#F59E0B",
  gradient: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)",
},
    {
      title: "Image Approvals",
      icon: <PhotoLibrary />,
      path: "/admin/image-approvals",
      color: "#EC4899",
      gradient: "linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)",
      badge: stats.pendingImages > 0 ? stats.pendingImages : null
    },
    {
      title: "Gallery",
      icon: <PhotoLibrary />,
      path: "/admin/gallery",
      color: "#0EA5E9",
      gradient: "linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)",
    },
    {
      title: "Financial",
      icon: <AttachMoney />,
      children: [
        { 
          title: "Donations", 
          path: "/admin/financial/donations",
          icon: <AttachMoney fontSize="small" />
        },
        { 
          title: "Financial Reports", 
          path: "/admin/financial/reports",
          icon: <ReceiptLong fontSize="small" />
        },
        { 
          title: "Transaction Log", 
          path: "/admin/financial/transactions",
          icon: <BarChart fontSize="small" />
        },
      ],
      color: "#8B5CF6",
      gradient: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
    },
    {
      title: "Analytics",
      icon: <BarChart />,
      path: "/admin/analytics",
      color: "#3B82F6",
      gradient: "linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)",
    },
    
    {
      title: "Settings",
      icon: <Settings />,
      path: "/admin/settings",
      color: "#64748B",
      gradient: "linear-gradient(135deg, #64748B 0%, #475569 100%)",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleViewPublicSite = () => {
    navigate("/dashboard");
  };

  if (!user || !isAuthenticated || user.role !== 'admin' || isMobile) return null;

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
              <Security sx={{ color: "#fff", fontSize: 20 }} />
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
                Admin Panel
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: alpha(theme.palette.text.secondary, 0.7),
                  display: "block",
                }}
              >
                {user?.email?.split("@")[0] || "admin"}
              </Typography>
            </Box>
          </Box>
        )}
        
        {collapsed && (
          <Tooltip title="Admin Panel" placement="right">
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
              <Security sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
          </Tooltip>
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

      {/* Admin Stats Section */}
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
            System Status
          </Typography>
          
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
            {/* Pending Images Card */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backdropFilter: "blur(10px)",
                background: alpha(theme.palette.warning.main, 0.08),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                textAlign: "center",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 8px 24px ${alpha(theme.palette.warning.main, 0.1)}`,
                },
              }}
              onClick={() => navigate('/admin/images/pending')}
              style={{ cursor: 'pointer' }}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: theme.palette.warning.main }} />
              ) : error ? (
                <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
                  Error
                </Typography>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
                    <PhotoLibrary sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                    <Typography
                      variant="h5"
                      fontWeight={800}
                      sx={{
                        color: theme.palette.warning.main,
                      }}
                    >
                      {stats.pendingImages}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.8),
                      fontWeight: 500,
                    }}
                  >
                    Pending Images
                  </Typography>
                </>
              )}
            </Box>
            
            {/* Pending Reports Card */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backdropFilter: "blur(10px)",
                background: alpha(theme.palette.info.main, 0.08),
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                textAlign: "center",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.1)}`,
                },
              }}
              onClick={() => navigate('/admin/reports/pending')}
              style={{ cursor: 'pointer' }}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: theme.palette.info.main }} />
              ) : error ? (
                <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
                  Error
                </Typography>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
                    <Warning sx={{ fontSize: 16, color: theme.palette.info.main }} />
                    <Typography
                      variant="h5"
                      fontWeight={800}
                      sx={{
                        color: theme.palette.info.main,
                      }}
                    >
                      {stats.pendingReports}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.8),
                      fontWeight: 500,
                    }}
                  >
                    Pending Reports
                  </Typography>
                </>
              )}
            </Box>
            
            {/* Total Users Card */}
            <Box
              sx={{
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
              onClick={() => navigate('/admin/users')}
              style={{ cursor: 'pointer' }}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: theme.palette.success.main }} />
              ) : error ? (
                <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
                  Error
                </Typography>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
                    <People sx={{ fontSize: 16, color: theme.palette.success.main }} />
                    <Typography
                      variant="h5"
                      fontWeight={800}
                      sx={{
                        color: theme.palette.success.main,
                      }}
                    >
                      {stats.totalUsers}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.8),
                      fontWeight: 500,
                    }}
                  >
                    Total Users
                  </Typography>
                </>
              )}
            </Box>
          </Box>
          
          {/* System Health Indicator */}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: alpha(theme.palette.text.secondary, 0.7),
                  fontWeight: 500,
                }}
              >
                System Health
              </Typography>
              <CheckCircle sx={{ fontSize: 14, color: theme.palette.success.main }} />
            </Box>
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
                  width: "95%",
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
              95% optimal
            </Typography>
          </Box>
        </Box>
      )}

      <Divider sx={{ 
        borderColor: alpha(theme.palette.divider, 0.08), 
        mx: 2 
      }} />

      {/* Navigation Menu */}
      <List sx={{ px: 2, py: 2, flex: 1 }}>
        {adminMenuItems.map((item, index) => (
          <SidebarItem
            key={index}
            item={item}
            collapsed={collapsed}
          />
        ))}
      </List>

      {/* Action Buttons */}
      <Box sx={{ p: 2, mt: "auto" }}>
        {!collapsed ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box
              onClick={handleViewPublicSite}
              sx={{
                p: 1.5,
                borderRadius: 2,
                backdropFilter: "blur(10px)",
                background: alpha(theme.palette.background.paper, 0.3),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <Home sx={{ fontSize: 18, color: theme.palette.primary.main }} />
              <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                View Public Site
              </Typography>
            </Box>
            
            <Box
              onClick={handleLogout}
              sx={{
                p: 1.5,
                borderRadius: 2,
                backdropFilter: "blur(10px)",
                background: alpha(theme.palette.error.main, 0.1),
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.2),
                },
              }}
            >
              <Logout sx={{ fontSize: 18, color: theme.palette.error.main }} />
              <Typography variant="body2" sx={{ color: theme.palette.error.main, fontWeight: 500 }}>
                Logout Admin
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Tooltip title="View Public Site" placement="right">
              <IconButton
                onClick={handleViewPublicSite}
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
                <Home sx={{ fontSize: 20, color: theme.palette.primary.main }} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Logout" placement="right">
              <IconButton
                onClick={handleLogout}
                sx={{
                  backdropFilter: "blur(10px)",
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                  width: 40,
                  height: 40,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.error.main, 0.2),
                  },
                }}
              >
                <Logout sx={{ fontSize: 20, color: theme.palette.error.main }} />
              </IconButton>
            </Tooltip>
          </Box>
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
            Admin Panel v1.0
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default AdminSidebar;