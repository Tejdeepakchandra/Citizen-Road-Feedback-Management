import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Menu,
  MenuItem,
  IconButton,
  Alert,
  Modal,
  Fade,
  Rating,
  Grid,
  Tooltip,
  alpha,
  LinearProgress
} from "@mui/material";
import {
  Delete,
  MoreVert,
  Visibility,
  Add,
  Search,
  FilterList,
  RateReview,
  CheckCircle,
  Warning,
  Error,
  ThumbUp,
  ThumbDown,
  Refresh,
} from "@mui/icons-material";

import { toast } from "react-hot-toast";
import { reportAPI } from "../../services/api";
import { feedbackAPI } from "../../services/api";
import StarIcon from "@mui/icons-material/Star";
import { useAuth } from "../../hooks/useAuth";

const MyReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [feedbackPreviewOpen, setFeedbackPreviewOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);
  const [previewFeedback, setPreviewFeedback] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await reportAPI.getMyReports();
      const reportsData = response.data.data || [];
      
      // Log each report to debug
      console.log("MyReports data:", reportsData);
      reportsData.forEach((report, index) => {
        console.log(`Report ${index}: ${report.title}`, {
          status: report.status,
          needsReview: report.needsReview,
          adminApproved: report.adminApproved,
          adminRejected: report.adminRejected,
          assignedTo: report.assignedTo,
          progress: report.progress
        });
      });
      
      setReports(reportsData);

      // Fetch feedback for each completed report
      const feedbackResponses = await Promise.all(
        reportsData.map((r) => feedbackAPI.getFeedbackByReport(r._id))
      );

      const map = {};
      reportsData.forEach((r, idx) => {
        const feedbackList = feedbackResponses[idx]?.data?.data || [];
        map[r._id] = feedbackList.length ? feedbackList[0] : null;
      });

      setFeedbackMap(map);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const openFeedbackPreview = async (report) => {
    setPreviewReport(report);
    const res = await feedbackAPI.getFeedbackByReport(report._id);
    const list = res.data.data || [];
    const myFeedback = list.find(f => f.user?._id === user?._id);
    setPreviewFeedback(myFeedback || null);
    setFeedbackPreviewOpen(true);
  };

  const handleDelete = async (reportId) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        await reportAPI.deleteReport(reportId);
        toast.success("Report deleted successfully");
        fetchReports(); // Refresh list
      } catch (error) {
        console.error("Delete failed:", error);
        toast.error("Failed to delete report");
      }
    }
  };

  const handleMenuOpen = (event, report) => {
    setAnchorEl(event.currentTarget);
    setSelectedReport(report);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReport(null);
  };

  const getStatusColor = (status, needsReview = false, adminApproved = false, adminRejected = false) => {
    // If needs review, show warning color
    if (needsReview === true && status === 'completed') {
      return 'warning';
    }
    
    // If admin rejected and returned for revision
    if (adminRejected === true) {
      return 'error';
    }
    
    // If admin approved, show success
    if (adminApproved === true && status === 'completed') {
      return 'success';
    }
    
    switch (status) {
      case 'pending': return 'warning';
      case 'assigned': return 'info';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status, needsReview = false, adminApproved = false, adminRejected = false) => {
    if (needsReview === true && status === 'completed') {
      return 'In Review';
    }
    if (adminRejected === true && status === 'in_progress') {
      return 'Needs Revision';
    }
    if (adminApproved === true && status === 'completed') {
      return 'Completed';
    }
    
    switch (status) {
      case 'pending': return 'Pending';
      case 'assigned': return 'Assigned';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'rejected': return 'Rejected';
      default: return status?.replace('_', ' ') || 'Unknown';
    }
  };

  const getStatusIcon = (status, needsReview = false, adminApproved = false, adminRejected = false) => {
    if (needsReview === true && status === 'completed') {
      return <Warning sx={{ fontSize: 14 }} />;
    }
    if (adminRejected === true && status === 'in_progress') {
      return <Error sx={{ fontSize: 14 }} />;
    }
    if (adminApproved === true && status === 'completed') {
      return <CheckCircle sx={{ fontSize: 14 }} />;
    }
    
    switch (status) {
      case 'completed': return <CheckCircle sx={{ fontSize: 14 }} />;
      case 'in_progress': return <Refresh sx={{ fontSize: 14 }} />;
      case 'assigned': return <CheckCircle sx={{ fontSize: 14 }} />;
      default: return null;
    }
  };

  const getProgressColor = (progress) => {
    if (progress < 30) return '#F44336';
    if (progress < 70) return '#FF9800';
    return '#4CAF50';
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = (() => {
      if (statusFilter === "all") return true;
      if (statusFilter === "in_review") {
        return report.status === 'completed' && report.needsReview === true;
      }
      if (statusFilter === "completed_approved") {
        return report.status === 'completed' && report.adminApproved === true;
      }
      if (statusFilter === "needs_revision") {
        return report.status === 'in_progress' && report.adminRejected === true;
      }
      return report.status === statusFilter;
    })();
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    inProgress: reports.filter(r => r.status === 'in_progress').length,
    inReview: reports.filter(r => 
      r.status === 'completed' && r.needsReview === true
    ).length,
    completed: reports.filter(r => 
      r.status === 'completed' && r.adminApproved === true
    ).length,
    needsRevision: reports.filter(r => 
      r.status === 'in_progress' && r.adminRejected === true
    ).length,
  };

  const StatCard = ({ label, value, color, icon }) => (
    <Card sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
      border: `1px solid ${alpha(color, 0.3)}`,
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: alpha(color, 0.1), color: color }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const Avatar = ({ children, ...props }) => (
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...props.sx,
      }}
    >
      {children}
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: "bold", mb: 1 }}
          >
            My Reports
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Track the status of all your submitted road issue reports
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate("/reports/new")}
        >
          New Report
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard 
            label="Total" 
            value={stats.total} 
            color="#1976D2" 
            icon={<Visibility />}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard 
            label="Pending" 
            value={stats.pending} 
            color="#FFA726" 
            icon={<Warning />}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard 
            label="In Progress" 
            value={stats.inProgress} 
            color="#9C27B0" 
            icon={<Refresh />}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard 
            label="In Review" 
            value={stats.inReview} 
            color="#FF9800" 
            icon={<Warning />}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard 
            label="Completed" 
            value={stats.completed} 
            color="#4CAF50" 
            icon={<CheckCircle />}
          />
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: <Search sx={{ color: "action.active", mr: 1 }} />,
            }}
          />
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
            InputProps={{
              startAdornment: (
                <FilterList sx={{ color: "action.active", mr: 1 }} />
              ),
            }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="assigned">Assigned</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="in_review">In Review</MenuItem>
            <MenuItem value="needs_revision">Needs Revision</MenuItem>
            <MenuItem value="completed_approved">Completed</MenuItem>
          </TextField>
          <Button
            startIcon={<Refresh />}
            onClick={fetchReports}
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Reports Table */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredReports.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No reports found.{" "}
          {searchQuery || statusFilter !== "all"
            ? "Try changing your filters."
            : "Create your first report!"}
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: "background.default" }}>
              <TableRow>
                <TableCell><strong>Title & Description</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Progress</strong></TableCell>
                <TableCell><strong>Assigned To</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports.map((report) => {
                const statusText = getStatusText(
                  report.status, 
                  report.needsReview, 
                  report.adminApproved, 
                  report.adminRejected
                );
                const statusColor = getStatusColor(
                  report.status, 
                  report.needsReview, 
                  report.adminApproved, 
                  report.adminRejected
                );
                const statusIcon = getStatusIcon(
                  report.status, 
                  report.needsReview, 
                  report.adminApproved, 
                  report.adminRejected
                );
                const progressColor = getProgressColor(report.progress || 0);
                
                return (
                  <TableRow key={report._id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                        {report.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" noWrap sx={{ maxWidth: 300 }}>
                        {report.description?.substring(0, 60)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.category?.replace('_', ' ')}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={statusIcon}
                        label={statusText}
                        color={statusColor}
                        size="small"
                        variant={statusText === 'In Review' || statusText === 'Needs Revision' ? 'filled' : 'outlined'}
                      />
                      {report.adminRejected && report.rejectionReason && (
                        <Tooltip title={`Rejection reason: ${report.rejectionReason}`} arrow>
                          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                            <ThumbDown sx={{ fontSize: 12, mr: 0.5 }} />
                            Needs revision
                          </Typography>
                        </Tooltip>
                      )}
                      {report.adminApproved && report.adminNotes && (
                        <Tooltip title={`Admin notes: ${report.adminNotes}`} arrow>
                          <Typography variant="caption" color="success" sx={{ display: 'block', mt: 0.5 }}>
                            <ThumbUp sx={{ fontSize: 12, mr: 0.5 }} />
                            Approved
                          </Typography>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: '100%' }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={report.progress || 0}
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              backgroundColor: alpha('#e0e0e0', 0.5),
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: progressColor,
                                borderRadius: 3,
                              }
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ minWidth: 30, color: progressColor, fontWeight: 600 }}>
                          {report.progress || 0}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {report.assignedTo ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: alpha('#1976D2', 0.1),
                            color: '#1976D2'
                          }}>
                            {report.assignedTo?.name?.charAt(0) || 'S'}
                          </Avatar>
                          <Typography variant="caption">
                            {report.assignedTo?.name || 'Staff'}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="textSecondary">
                          Not assigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 1,
                        }}
                      >
                        {/* Show Stars if feedback exists */}
                        {report.status === 'completed' && report.adminApproved && feedbackMap[report._id]?.rating && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <StarIcon sx={{ color: "#fbbf24" }} />
                            <Typography variant="body2" fontWeight={600}>
                              {feedbackMap[report._id].rating} / 5
                            </Typography>
                          </Box>
                        )}

                        {/* Feedback Badge - only for approved completed reports */}
                        {report.status === 'completed' && report.adminApproved && feedbackMap[report._id] && (
                          <Chip
                            label="Feedback Given ✔"
                            color="success"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        )}

                        {/* Show Give Feedback only if completed & approved & not given */}
                        {report.status === 'completed' && report.adminApproved && !feedbackMap[report._id] && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => navigate(`/feedback/give/${report._id}`)}
                            sx={{ textTransform: "none" }}
                          >
                            Give Feedback
                          </Button>
                        )}

                        {/* Existing Buttons */}
                        <Box sx={{ display: "flex", gap: 1 }}>
                          {/* ⭐ Feedback Preview Icon - only for approved completed reports */}
                          {report.status === 'completed' && report.adminApproved && (
                            <IconButton
                              size="small"
                              onClick={() => openFeedbackPreview(report)}
                            >
                              <RateReview sx={{ color: "#f59e0b" }} />
                            </IconButton>
                          )}
                          
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/reports/${report._id}`)}
                            startIcon={<Visibility />}
                          >
                            View
                          </Button>

                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, report)}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {/* View Report */}
        <MenuItem
          onClick={() => {
            navigate(`/reports/${selectedReport?._id}`);
            handleMenuClose();
          }}
        >
          <Visibility sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>

        {/* Give Feedback (Only if completed and approved) */}
        {selectedReport?.status === 'completed' && selectedReport?.adminApproved && (
          <MenuItem
            onClick={() => {
              navigate(`/feedback/give/${selectedReport?._id}`);
              handleMenuClose();
            }}
          >
            <RateReview sx={{ mr: 1 }} fontSize="small" />
            Give Feedback
          </MenuItem>
        )}

        {/* Edit Report (Only before assignment) */}
        {selectedReport?.status === 'pending' && (
          <MenuItem
            onClick={() => {
              navigate(`/reports/${selectedReport?._id}/edit`);
              handleMenuClose();
            }}
          >
            <Visibility sx={{ mr: 1 }} fontSize="small" />
            Edit Report
          </MenuItem>
        )}

        {/* Delete Report (Only pending reports) */}
        {selectedReport?.status === 'pending' && (
          <MenuItem
            onClick={() => {
              if (selectedReport) handleDelete(selectedReport._id);
              handleMenuClose();
            }}
            sx={{ color: "error.main" }}
          >
            <Delete sx={{ mr: 1 }} fontSize="small" />
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Feedback Preview Modal */}
      <Modal 
        open={feedbackPreviewOpen}
        onClose={() => setFeedbackPreviewOpen(false)}
      >
        <Fade in={feedbackPreviewOpen}>
          <Box sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: 600,
            bgcolor: "background.paper",
            p: 4,
            borderRadius: 2,
            boxShadow: 24
          }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Feedback Overview
            </Typography>

            {/* Report Summary */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {previewReport?.title}
                  </Typography>
                  <Chip
                    label={getStatusText(
                      previewReport?.status, 
                      previewReport?.needsReview, 
                      previewReport?.adminApproved, 
                      previewReport?.adminRejected
                    )}
                    color={getStatusColor(
                      previewReport?.status, 
                      previewReport?.needsReview, 
                      previewReport?.adminApproved, 
                      previewReport?.adminRejected
                    )}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {previewReport?.description}
                </Typography>
                {previewReport?.assignedTo && (
                  <Typography variant="caption" color="text.secondary">
                    Assigned to: {previewReport.assignedTo.name}
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Feedback Display */}
            <Typography variant="subtitle2" gutterBottom>
              Your Feedback
            </Typography>
            {previewFeedback ? (
              <>
                <Rating value={previewFeedback.rating} readOnly />
                <Typography variant="body2" sx={{ mt: 1, p: 2, bgcolor: alpha('#f5f5f5', 0.5), borderRadius: 1 }}>
                  "{previewFeedback.comment}"
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Submitted on: {new Date(previewFeedback.createdAt).toLocaleDateString()}
                </Typography>
              </>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                No feedback given yet. You can provide feedback once the task is completed and approved.
              </Alert>
            )}

            {/* Buttons */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
              <Button variant="outlined" onClick={() => setFeedbackPreviewOpen(false)}>
                Close
              </Button>

              {previewReport?.status === 'completed' && previewReport?.adminApproved && (
                <Button 
                  variant="contained"
                  onClick={() => {
                    setFeedbackPreviewOpen(false);
                    navigate(`/feedback/give/${previewReport._id}`);
                  }}
                >
                  {previewFeedback ? "Update Feedback" : "Give Feedback"}
                </Button>
              )}
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Container>
  );
};

export default MyReports;