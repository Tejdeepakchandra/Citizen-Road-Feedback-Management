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
  Chip,
  Badge,
} from "@mui/material";
import {
  Dashboard,
  Assignment,
  Update,
  PhotoCamera,
  History,
  Task,
  Notifications,
  Settings,
  Construction,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Timeline,
  Work,
  Assessment,
  Home,
  Logout,
} from "@mui/icons-material";
import SidebarItem from "./SidebarItem";
import { useAuth } from "../../../context/AuthContext";
import { useSidebar } from "../../../context/SidebarContext";
import { staffAPI } from "../../../services/api";
import { useNavigate, useLocation } from "react-router-dom";

const StaffSidebar = () => {
  const { collapsed, toggleSidebar } = useSidebar();
  const [stats, setStats] = useState({
    assignedTasks: 0,
    pendingTasks: 0,
    completedToday: 0,
    performanceScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user && isAuthenticated && user.role === "staff") {
      fetchStaffStats();
    } else {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  const fetchStaffStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch staff's assigned reports
      const reportsResponse = await staffAPI.getMyAssignedReports();
      const reports = reportsResponse.data.data || [];
      
      // Calculate stats from reports
      const assignedTasks = reports.length;
      const pendingTasks = reports.filter(report => 
        report.status === 'assigned' || report.status === 'in_progress'
      ).length;
      
      // Count tasks completed today
      const completedToday = reports.filter(report => {
        if (report.status !== 'completed' || !report.actualCompletion) return false;
        const completionDate = new Date(report.actualCompletion);
        return completionDate >= today;
      }).length;

      // Get performance score
      const performanceScore = reports.length > 0 
        ? Math.round((completedToday / reports.length) * 100) 
        : 0;

      setStats({
        assignedTasks,
        pendingTasks,
        completedToday,
        performanceScore,
      });

    } catch (error) {
      console.error("Failed to fetch staff stats:", error);
      setError("Failed to load statistics");
      setStats({
        assignedTasks: 0,
        pendingTasks: 0,
        completedToday: 0,
        performanceScore: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStaffCategory = () => {
    if (!user?.staffCategory) return "General Staff";
    const categories = {
      pothole: "Pothole Repair",
      lighting: "Street Lighting",
      drainage: "Drainage",
      garbage: "Sanitation",
      signboard: "Signage",
    };
    return categories[user.staffCategory] || user.staffCategory || "Staff";
  };

  const getCategoryColor = () => {
    const colors = {
      pothole: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
      lighting: "linear-gradient(135deg, #0EA5E9 0%, #8B5CF6 100%)",
      drainage: "linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)",
      garbage: "linear-gradient(135deg, #EF4444 0%, #F59E0B 100%)",
      signboard: "linear-gradient(135deg, #8B5CF6 0%, #10B981 100%)",
    };
    return colors[user?.staffCategory] || "linear-gradient(135deg, #F59E0B 0%, #8B5CF6 100%)";
  };

  const getCategoryPrimary = () => {
    const colors = {
      pothole: "#F59E0B",
      lighting: "#0EA5E9",
      drainage: "#10B981",
      garbage: "#EF4444",
      signboard: "#8B5CF6",
    };
    return colors[user?.staffCategory] || "#F59E0B";
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleViewPublicSite = () => {
    navigate("/dashboard");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: <Dashboard />,
      path: "/staff/dashboard",
      exact: true,
      gradient: getCategoryColor(),
      onClick: () => handleNavigation("/staff/dashboard"),
    },
    {
      title: "Assigned Tasks",
      icon: <Assignment />,
      path: "/staff/tasks",
      children: [
        {
          title: "All Tasks",
          path: "/staff/tasks",
          icon: <Assignment fontSize="small" />,
          onClick: () => handleNavigation("/staff/tasks"),
        },
        {
          title: "Pending Tasks",
          path: "/staff/tasks/pending",
          icon: <Assignment fontSize="small" />,
          badge: stats.pendingTasks > 0 ? stats.pendingTasks : null,
          onClick: () => handleNavigation("/staff/tasks?status=pending"),
        },
        {
          title: "Completed Tasks",
          path: "/staff/tasks/completed",
          icon: <CheckCircle fontSize="small" />,
          onClick: () => handleNavigation("/staff/tasks?status=completed"),
        },
      ],
      gradient: "linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)",
    },
    {
      title: "Update Progress",
      icon: <Update />,
      path: "/staff/update-progress",
      gradient: "linear-gradient(135deg, #10B981 0%, #F59E0B 100%)",
      onClick: () => handleNavigation("/staff/update-progress"),
    },
    {
      title: "Upload Images",
      icon: <PhotoCamera />,
      path: "/staff/upload-images",
      gradient: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
      onClick: () => handleNavigation("/staff/upload-images"),
    },
    {
      title: "Work History",
      icon: <History />,
      path: "/staff/history",
      children: [
        {
          title: "All History",
          path: "/staff/history",
          icon: <History fontSize="small" />,
          onClick: () => handleNavigation("/staff/history"),
        },
        {
          title: "This Week",
          path: "/staff/history/week",
          icon: <Timeline fontSize="small" />,
          onClick: () => handleNavigation("/staff/history?period=week"),
        },
        {
          title: "This Month",
          path: "/staff/history/month",
          icon: <Assessment fontSize="small" />,
          onClick: () => handleNavigation("/staff/history?period=month"),
        },
      ],
      gradient: "linear-gradient(135deg, #EF4444 0%, #8B5CF6 100%)",
    },
    {
      title: "Performance",
      icon: <Assessment />,
      path: "/staff/performance",
      gradient: "linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)",
      onClick: () => handleNavigation("/staff/performance"),
    },
    {
      title: "Settings",
      icon: <Settings />,
      path: "/staff/settings",
      gradient: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
      onClick: () => handleNavigation("/settings"),
    },
  ];

  if (!user || !isAuthenticated || user.role !== "staff" || isMobile) return null;

  const todaysProgress = Math.min(Math.round((stats.completedToday / 3) * 100), 100);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        backdropFilter: "blur(30px) saturate(200%)",
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        borderRight: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        boxShadow: `inset -2px 0 20px ${alpha(getCategoryPrimary(), 0.05)}`,
        transition: theme.transitions.create(["width", "transform"], {
          easing: theme.transitions.easing.easeInOut,
          duration: theme.transitions.duration.standard,
        }),
        overflowX: "hidden",
        overflowY: "auto",
        "&::-webkit-scrollbar": {
          width: "4px",
        },
        "&::-webkit-scrollbar-thumb": {
          background: getCategoryColor(),
          borderRadius: "4px",
        },
        display: "flex",
        flexDirection: "column",
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
          background: `linear-gradient(90deg, ${alpha(getCategoryPrimary(), 0.1)} 0%, transparent 100%)`,
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
                background: getCategoryColor(),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 16px ${alpha(getCategoryPrimary(), 0.3)}`,
              }}
            >
              <Construction sx={{ color: "#fff", fontSize: 20 }} />
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
                Staff Panel
              </Typography>
              <Chip
                label={getStaffCategory()}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  background: getCategoryColor(),
                  color: "#fff",
                  boxShadow: `0 0 10px ${alpha(getCategoryPrimary(), 0.3)}`,
                  mt: 0.5,
                }}
              />
            </Box>
          </Box>
        )}

        {collapsed && (
          <Tooltip title="Staff Panel" placement="right">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: getCategoryColor(),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 16px ${alpha(getCategoryPrimary(), 0.3)}`,
              }}
            >
              <Construction sx={{ color: "#fff", fontSize: 20 }} />
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
              backgroundColor: alpha(getCategoryPrimary(), 0.1),
              borderColor: getCategoryPrimary(),
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

      {/* Welcome Section */}
      {!collapsed && (
        <Box sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              sx={{
                color: alpha(theme.palette.text.secondary, 0.7),
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                mb: 1,
                display: "block",
              }}
            >
              Welcome back
            </Typography>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              gutterBottom
              sx={{
                background: getCategoryColor(),
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {user?.name || "Staff Member"}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ opacity: 0.7 }}
            >
              {user?.email}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Stats Section */}
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
            Today's Progress
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
            {/* Assigned Tasks Card */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backdropFilter: "blur(10px)",
                background: alpha(getCategoryPrimary(), 0.08),
                border: `1px solid ${alpha(getCategoryPrimary(), 0.1)}`,
                textAlign: "center",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 8px 24px ${alpha(getCategoryPrimary(), 0.1)}`,
                  cursor: "pointer",
                },
              }}
              onClick={() => handleNavigation("/staff/tasks")}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: getCategoryPrimary() }} />
              ) : error ? (
                <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
                  Error
                </Typography>
              ) : (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 0.5 }}>
                    <Assignment sx={{ fontSize: 16, color: getCategoryPrimary() }} />
                    <Typography
                      variant="h5"
                      fontWeight={800}
                      sx={{
                        color: getCategoryPrimary(),
                      }}
                    >
                      {stats.assignedTasks}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.8),
                      fontWeight: 500,
                    }}
                  >
                    Assigned Tasks
                  </Typography>
                </>
              )}
            </Box>

            {/* Completed Today Card */}
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
                  cursor: "pointer",
                },
              }}
              onClick={() => handleNavigation("/staff/tasks?status=completed")}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: theme.palette.success.main }} />
              ) : error ? (
                <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
                  Error
                </Typography>
              ) : (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 0.5 }}>
                    <CheckCircle sx={{ fontSize: 16, color: theme.palette.success.main }} />
                    <Typography
                      variant="h5"
                      fontWeight={800}
                      sx={{
                        color: theme.palette.success.main,
                      }}
                    >
                      {stats.completedToday}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.8),
                      fontWeight: 500,
                    }}
                  >
                    Completed Today
                  </Typography>
                </>
              )}
            </Box>

            {/* Performance Score Card */}
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
                  cursor: "pointer",
                },
              }}
              onClick={() => handleNavigation("/staff/performance")}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: theme.palette.info.main }} />
              ) : error ? (
                <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
                  Error
                </Typography>
              ) : (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 0.5 }}>
                    <Assessment sx={{ fontSize: 16, color: theme.palette.info.main }} />
                    <Typography
                      variant="h5"
                      fontWeight={800}
                      sx={{
                        color: theme.palette.info.main,
                      }}
                    >
                      {stats.performanceScore}%
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.8),
                      fontWeight: 500,
                    }}
                  >
                    Performance
                  </Typography>
                </>
              )}
            </Box>
          </Box>

          {/* Progress Indicator */}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: alpha(theme.palette.text.secondary, 0.7),
                  fontWeight: 500,
                }}
              >
                Daily Goal Progress
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  background: getCategoryColor(),
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {todaysProgress}%
              </Typography>
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
                  width: `${todaysProgress}%`,
                  background: getCategoryColor(),
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
              {stats.completedToday}/3 tasks completed
            </Typography>
          </Box>
        </Box>
      )}

      <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.08), mx: 2 }} />

      {/* Navigation Menu - UPDATED */}
      <List sx={{ px: 2, py: 2, flex: 1 }}>
        {menuItems.map((item, index) => (
          <SidebarItem key={index} item={item} collapsed={collapsed} />
        ))}
      </List>

      {/* Action Buttons */}
      <Box sx={{ p: 2, mt: "auto" }}>
        {!collapsed ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box
              onClick={handleViewPublicSite}
              sx={{
                p: 1.5,
                borderRadius: 2,
                backdropFilter: "blur(10px)",
                background: alpha(theme.palette.background.paper, 0.3),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: alpha(getCategoryPrimary(), 0.1),
                  borderColor: getCategoryPrimary(),
                },
              }}
            >
              <Home sx={{ fontSize: 18, color: getCategoryPrimary() }} />
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
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: alpha(theme.palette.error.main, 0.2),
                },
              }}
            >
              <Logout sx={{ fontSize: 18, color: theme.palette.error.main }} />
              <Typography variant="body2" sx={{ color: theme.palette.error.main, fontWeight: 500 }}>
                Logout Staff
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
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
                    backgroundColor: alpha(getCategoryPrimary(), 0.1),
                    borderColor: getCategoryPrimary(),
                  },
                }}
              >
                <Home sx={{ fontSize: 20, color: getCategoryPrimary() }} />
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
            Staff Panel v1.0 • {getStaffCategory()}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default StaffSidebar;