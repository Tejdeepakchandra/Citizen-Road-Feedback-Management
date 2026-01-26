// src/pages/Admin/IssueManagement.jsx - Complete fixed version
import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import {
  FilterList,
  Search,
  Assignment,
  LocationOn,
  Person,
  Schedule,
  PriorityHigh,
  CheckCircle,
  Build,
  Lightbulb,
  Water,
  Delete,
  EditRoad,
  Visibility,
  Edit,
  Refresh,
  Map,
  ThumbUp,
  ThumbDown,
  Timeline,
  Download,
  Print,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import axios from "axios";

// API Configuration
const API_BASE_URL = "https://citizen-road-backend.onrender.com/api";

// API Service functions
const api = {
  // Fetch all reports from backend
  async getAllReports(params = {}) {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await axios.get(`${API_BASE_URL}/reports`, {
        params: {
          limit: 100,
          page: 1,
          ...params,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  // Fetch all staff members
  async getAllStaff() {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await axios.get(`${API_BASE_URL}/staff`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response;
    } catch (error) {
      console.error("Staff API Error:", error);
      throw error;
    }
  },

  // Assign report to staff
  async assignReport(reportId, staffId, assignmentData) {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await axios.put(
        `${API_BASE_URL}/reports/${reportId}/assign`,
        {
          staffId: staffId,
          ...assignmentData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response;
    } catch (error) {
      console.error("Assign API Error:", error);
      throw error;
    }
  },

  // Update report status
  async updateStatus(reportId, status, notes) {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await axios.put(
        `${API_BASE_URL}/reports/${reportId}/status`,
        {
          status: status,
          notes: notes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response;
    } catch (error) {
      console.error("Status API Error:", error);
      throw error;
    }
  },

  // Approve staff completion - UPDATED TO MATCH YOUR BACKEND
  async approveCompletion(reportId, adminNotes = "") {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await axios.put(
        `${API_BASE_URL}/reports/${reportId}/approve`,
        {
          adminNotes: adminNotes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response;
    } catch (error) {
      console.error("Approve API Error:", error);
      throw error;
    }
  },

  // Reject staff completion - UPDATED TO MATCH YOUR BACKEND
  async rejectCompletion(reportId, rejectionReason = "") {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await axios.put(
        `${API_BASE_URL}/reports/${reportId}/reject`,
        {
          rejectionReason: rejectionReason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response;
    } catch (error) {
      console.error("Reject API Error:", error);
      throw error;
    }
  },

  // Complete for review (for staff)
  async completeForReview(reportId, completionNotes = "", images = []) {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("completionNotes", completionNotes);

      // Add images if any
      images.forEach((image, index) => {
        formData.append("images", image);
      });

      const response = await axios.put(
        `${API_BASE_URL}/reports/${reportId}/complete-for-review`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response;
    } catch (error) {
      console.error("Complete for Review API Error:", error);
      throw error;
    }
  },
};

const IssueManagement = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffMembers, setStaffMembers] = useState([]);
  const [apiMode, setApiMode] = useState("checking"); // 'checking', 'live', 'demo'

  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Assignment form
  const [assignmentForm, setAssignmentForm] = useState({
    staffId: "",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    notes: "",
  });

  // Review form
  const [reviewForm, setReviewForm] = useState({
    adminNotes: "",
  });

  // Status change form
  const [statusChangeForm, setStatusChangeForm] = useState({
    newStatus: "",
    notes: "",
  });

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Table pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Calculate stats
  const reportStats = useMemo(() => {
    const total = reports.length;
    const needsReview = reports.filter((r) => r.needsReview).length;
    const inProgress = reports.filter(
      (r) => r.status === "in_progress" || r.status === "assigned"
    ).length;
    const completed = reports.filter(
      (r) => r.status === "completed" && !r.needsReview
    ).length;

    return { total, needsReview, inProgress, completed };
  }, [reports]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    reports,
    statusFilter,
    categoryFilter,
    priorityFilter,
    searchTerm,
    activeTab,
  ]);

 const fetchData = async () => {
  setApiMode("checking");
  setLoading(true);

  try {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await api.getAllReports({ simple: true });

    if (response.status >= 200 && response.status < 300) {
      setApiMode("live");

      let reportsData = [];
      if (response.data && response.data.data) {
        reportsData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        reportsData = response.data;
      } else if (response.data && response.data.reports) {
        reportsData = response.data.reports;
      } else if (response.data && response.data.success) {
        reportsData = response.data.data || [];
      } else {
        reportsData = response.data ? [response.data] : [];
      }

      // Process reports with CORRECT needsReview logic
      const processedReports = reportsData.map((report) => {
        console.log(`Processing report ${report._id}:`, {
          status: report.status,
          needsReview: report.needsReview,
          adminApproved: report.adminApproved,
          adminRejected: report.adminRejected
        });
        
        // CORRECT LOGIC:
        // 1. If needsReview is explicitly true, it needs review
        // 2. If status is 'completed' but not approved or rejected, it needs review
        let needsReview = false;
        
        if (report.needsReview === true) {
          needsReview = true;
        } else if (report.status === 'completed') {
          // If completed but not approved or rejected, it needs review
          if (!report.adminApproved && !report.adminRejected) {
            needsReview = true;
          }
        }
        
        // Ensure we don't mark as needsReview if it's already approved
        if (report.adminApproved === true) {
          needsReview = false;
        }
        
        // Ensure we don't mark as needsReview if it's already rejected
        if (report.adminRejected === true) {
          needsReview = false;
        }

        let userData = report.user;
        if (report.user && typeof report.user === "string") {
          userData = { _id: report.user, name: "Unknown User" };
        } else if (!report.user) {
          userData = report.reportedBy || { name: "Unknown User", email: "N/A" };
        }

        let assignedData = report.assignedTo;
        if (report.assignedTo && typeof report.assignedTo === "string") {
          assignedData = { _id: report.assignedTo, name: "Unknown Staff" };
        } else if (!report.assignedTo && report.assignedStaff) {
          assignedData = report.assignedStaff;
        }

        return {
          ...report,
          progress: getCurrentProgress(report),
          needsReview: needsReview,
          assignedTo: assignedData,
          user: userData,
        };
      });

      console.log('Reports needing review:', processedReports.filter(r => r.needsReview).length);
      
      setReports(processedReports);
      setFilteredReports(processedReports);

      // Fetch staff
      try {
        const staffResponse = await api.getAllStaff();
        const staffData = staffResponse.data?.data || staffResponse.data || [];
        setStaffMembers(staffData);
      } catch (staffError) {
        setStaffMembers(getMockStaff());
      }

      setSnackbar({
        open: true,
        message: `Loaded ${processedReports.length} reports (${processedReports.filter(r => r.needsReview).length} need review)`,
        severity: "success",
      });
    } else {
      throw new Error(`Server returned status: ${response.status}`);
    }
  } catch (error) {
    console.error("API fetch failed, using demo data:", error);
    setApiMode("demo");

    // Use demo data with proper needsReview state
    const mockReports = getMockReportsWithProgress();
    const mockStaff = getMockStaff();

    setReports(mockReports);
    setFilteredReports(mockReports);
    setStaffMembers(mockStaff);

    setSnackbar({
      open: true,
      message: `Using demo data. ${error.message || "Backend API is unavailable."}`,
      severity: "warning",
    });
  } finally {
    setLoading(false);
  }
};

  const fetchReports = async () => {
    setLoading(true);

    try {
      if (apiMode === "demo") {
        // Refresh demo data
        const mockReports = getMockReportsWithProgress();
        setReports(mockReports);
        setFilteredReports(mockReports);
        setSnackbar({
          open: true,
          message: "Refreshed demo data",
          severity: "info",
        });
      } else {
        // Try to fetch from API again
        const response = await api.getAllReports();

        let reportsData = [];
        if (response.data && response.data.data) {
          reportsData = response.data.data;
        } else if (response.data && Array.isArray(response.data)) {
          reportsData = response.data;
        } else if (response.data && response.data.reports) {
          reportsData = response.data.reports;
        }

        // Process reports with better needsReview logic
        const processedReports = reportsData.map((report) => {
          // Determine if report needs review
          const needsReview =
            report.needsReview === true ||
            (report.status === "completed" &&
              (report.adminApproved === false || !report.adminApproved) &&
              report.needsReview !== false);

          return {
            ...report,
            progress: getCurrentProgress(report),
            needsReview: needsReview,
            assignedTo: report.assignedTo || report.assignedStaff || null,
            user: report.user ||
              report.reportedBy || { name: "Unknown User", email: "N/A" },
          };
        });

        setReports(processedReports);
        setFilteredReports(processedReports);

        setSnackbar({
          open: true,
          message: `Refreshed ${processedReports.length} reports`,
          severity: "success",
        });
      }
    } catch (error) {
      console.error("Refresh failed:", error);
      setApiMode("demo");
      setSnackbar({
        open: true,
        message: "Using demo data. Backend API is unavailable.",
        severity: "warning",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
  let tabFiltered = [...reports];

  // Add debug logging
  console.log('=== DEBUG: applyFilters ===');
  console.log('Total reports:', reports.length);
  console.log('Active tab:', activeTab);
  
  // Show all reports with their needsReview status
  reports.forEach((report, index) => {
    console.log(`${index + 1}. ${report.title}`);
    console.log(`   Status: ${report.status}, needsReview: ${report.needsReview}`);
    console.log(`   adminApproved: ${report.adminApproved}, adminRejected: ${report.adminRejected}`);
  });

  // Apply tab filtering
  switch (activeTab) {
    case 1: // Pending Assignment
      tabFiltered = tabFiltered.filter(
        (report) => report.status === "pending"
      );
      console.log('Pending Assignment count:', tabFiltered.length);
      break;
      
    case 2: // In Progress
      tabFiltered = tabFiltered.filter(
        (report) =>
          (report.status === "in_progress" || report.status === "assigned") &&
          report.needsReview !== true // Don't include reports that need review
      );
      console.log('In Progress count:', tabFiltered.length);
      break;
      
    case 3: // Needs Review - FIXED LOGIC
      tabFiltered = tabFiltered.filter(
        (report) => 
          report.status === "completed" && 
          report.needsReview === true && // Explicitly check for true
          report.adminApproved !== true && // Not already approved
          report.adminRejected !== true // Not already rejected
      );
      console.log('Needs Review count:', tabFiltered.length);
      console.log('Needs Review reports:', tabFiltered.map(r => r.title));
      break;
      
    case 4: // Completed (admin approved)
      tabFiltered = tabFiltered.filter(
        (report) => 
          report.status === "completed" && 
          !report.needsReview && // Doesn't need review
          report.adminApproved === true // Is approved
      );
      console.log('Completed count:', tabFiltered.length);
      break;
      
    default:
      console.log('All Reports count:', tabFiltered.length);
      break;
  }

  console.log('After tab filtering:', tabFiltered.length);
  console.log('=== END DEBUG ===');

  // Apply other filters
  let filtered = tabFiltered;

  if (statusFilter !== "all") {
    filtered = filtered.filter((report) => report.status === statusFilter);
  }

  if (categoryFilter !== "all") {
    filtered = filtered.filter(
      (report) => report.category === categoryFilter
    );
  }

  if (priorityFilter !== "all") {
    filtered = filtered.filter(
      (report) => report.priority === priorityFilter
    );
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (report) =>
        report.title?.toLowerCase().includes(term) ||
        report.description?.toLowerCase().includes(term) ||
        (report.location?.address &&
          report.location.address.toLowerCase().includes(term)) ||
        (report.user?.name && report.user.name.toLowerCase().includes(term))
    );
  }

  // Sort by date (newest first)
  const sorted = [...filtered].sort(
    (a, b) =>
      new Date(b.createdAt || b.date || b.createdDate) -
      new Date(a.createdAt || a.date || a.createdDate)
  );

  setFilteredReports(sorted);
  setPage(0);
};

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setViewDialogOpen(true);
  };

  const handleAssignClick = (report) => {
    setSelectedReport(report);
    setAssignmentForm({
      staffId: "",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      notes: "",
    });
    setAssignDialogOpen(true);
  };

  const handleAssignSubmit = async () => {
    try {
      if (!assignmentForm.staffId) {
        setSnackbar({
          open: true,
          message: "Please select a staff member",
          severity: "error",
        });
        return;
      }

      const selectedStaff = staffMembers.find(
        (staff) => staff._id === assignmentForm.staffId
      );

      if (!selectedStaff) {
        setSnackbar({
          open: true,
          message: "Selected staff not found",
          severity: "error",
        });
        return;
      }

      const assignmentData = {
        staffId: assignmentForm.staffId,
        staffName: selectedStaff.name,
        dueDate: assignmentForm.dueDate,
        notes: assignmentForm.notes,
        assignedBy: "Admin",
        assignedAt: new Date().toISOString(),
      };

      if (apiMode === "demo") {
        // Demo mode - update locally
        const updatedReport = {
          ...selectedReport,
          assignedTo: selectedStaff,
          assignedBy: "Admin",
          assignedAt: new Date().toISOString(),
          status: "assigned",
          progress: 25,
          dueDate: assignmentForm.dueDate || null,
          assignmentNotes: assignmentForm.notes || null,
          updatedAt: new Date().toISOString(),
        };

        const updatedReports = reports.map((report) =>
          report._id === selectedReport._id ? updatedReport : report
        );

        setReports(updatedReports);
        setAssignDialogOpen(false);

        setSnackbar({
          open: true,
          message: `Demo: Report assigned to ${selectedStaff.name}`,
          severity: "success",
        });
      } else {
        // Live mode - call API
        await api.assignReport(
          selectedReport._id,
          assignmentForm.staffId,
          assignmentData
        );

        // Update local state
        const updatedReport = {
          ...selectedReport,
          assignedTo: selectedStaff,
          assignedBy: "Admin",
          assignedAt: new Date().toISOString(),
          status: "assigned",
          progress: 25,
          dueDate: assignmentForm.dueDate || null,
          assignmentNotes: assignmentForm.notes || null,
          updatedAt: new Date().toISOString(),
        };

        const updatedReports = reports.map((report) =>
          report._id === selectedReport._id ? updatedReport : report
        );

        setReports(updatedReports);
        setAssignDialogOpen(false);

        setSnackbar({
          open: true,
          message: `Report assigned to ${selectedStaff.name}`,
          severity: "success",
        });
      }
    } catch (error) {
      console.error("Assignment error:", error);

      let errorMessage = "Failed to assign report";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message.includes("Network Error")) {
        errorMessage = "Network error. Please check your connection.";
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
  };

 const handleApproveCompletion = async () => {
  try {
    if (!selectedReport) return;

    console.log('Approving report:', selectedReport._id);
    console.log('Current state:', {
      needsReview: selectedReport.needsReview,
      adminApproved: selectedReport.adminApproved,
      adminRejected: selectedReport.adminRejected
    });

    if (apiMode === 'demo') {
      // Demo mode
      const updatedReports = reports.map(report =>
        report._id === selectedReport._id
          ? {
              ...report,
              status: 'completed',
              progress: 100,
              needsReview: false,
              adminApproved: true,
              adminRejected: false,
              adminNotes: reviewForm.adminNotes,
              approvedAt: new Date().toISOString(),
              approvedBy: 'demo-admin',
              actualCompletion: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : report
      );

      setReports(updatedReports);
      setReviewDialogOpen(false);
      
      setSnackbar({
        open: true,
        message: 'Demo: Completion approved successfully',
        severity: 'success',
      });
    } else {
      // Live mode
      await api.approveCompletion(selectedReport._id, reviewForm.adminNotes);
      
      // Update local state
      const updatedReports = reports.map(report =>
        report._id === selectedReport._id
          ? {
              ...report,
              status: 'completed',
              progress: 100,
              needsReview: false,
              adminApproved: true,
              adminRejected: false,
              adminNotes: reviewForm.adminNotes,
              approvedAt: new Date().toISOString(),
              actualCompletion: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : report
      );

      setReports(updatedReports);
      setReviewDialogOpen(false);
      
      setSnackbar({
        open: true,
        message: 'Staff completion approved successfully',
        severity: 'success',
      });
      
      // Refresh reports
      setTimeout(() => {
        fetchReports();
      }, 1000);
    }
    
  } catch (error) {
    console.error('Approve completion error:', error);
    
    let errorMessage = 'Failed to approve completion';
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }
    
    setSnackbar({
      open: true,
      message: errorMessage,
      severity: 'error',
    });
  }
};

const handleRejectCompletion = async () => {
  try {
    if (!selectedReport) return;

    console.log('Rejecting report:', selectedReport._id);

    if (apiMode === 'demo') {
      // Demo mode
      const updatedReports = reports.map(report =>
        report._id === selectedReport._id
          ? {
              ...report,
              status: 'in_progress',
              progress: 75,
              needsReview: false,
              adminApproved: false,
              adminRejected: true,
              rejectionReason: reviewForm.adminNotes,
              rejectedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : report
      );

      setReports(updatedReports);
      setReviewDialogOpen(false);
      
      setSnackbar({
        open: true,
        message: 'Demo: Completion rejected. Returned to in progress.',
        severity: 'info',
      });
    } else {
      // Live mode
      await api.rejectCompletion(selectedReport._id, reviewForm.adminNotes);
      
      // Update local state
      const updatedReports = reports.map(report =>
        report._id === selectedReport._id
          ? {
              ...report,
              status: 'in_progress',
              progress: 75,
              needsReview: false,
              adminApproved: false,
              adminRejected: true,
              rejectionReason: reviewForm.adminNotes,
              rejectedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : report
      );

      setReports(updatedReports);
      setReviewDialogOpen(false);
      
      setSnackbar({
        open: true,
        message: 'Staff completion rejected. Report returned to in progress.',
        severity: 'info',
      });
      
      setTimeout(() => {
        fetchReports();
      }, 1000);
    }
    
  } catch (error) {
    console.error('Reject completion error:', error);
    
    let errorMessage = 'Failed to reject completion';
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }
    
    setSnackbar({
      open: true,
      message: errorMessage,
      severity: 'error',
    });
  }
};

  const handleStatusChange = async (reportId, newStatus, notes = "") => {
    try {
      if (apiMode === "demo") {
        // Demo mode
        const updatedReports = reports.map((report) =>
          report._id === reportId
            ? {
                ...report,
                status: newStatus,
                progress: calculateProgressFromStatus(newStatus),
                updatedAt: new Date().toISOString(),
              }
            : report
        );

        setReports(updatedReports);
        setStatusDialogOpen(false);

        setSnackbar({
          open: true,
          message: `Demo: Status changed to ${newStatus}`,
          severity: "success",
        });
      } else {
        // Live mode
        await api.updateStatus(
          reportId,
          newStatus,
          notes || `Admin changed status to ${newStatus}`
        );

        const updatedReports = reports.map((report) =>
          report._id === reportId
            ? {
                ...report,
                status: newStatus,
                progress: calculateProgressFromStatus(newStatus),
                updatedAt: new Date().toISOString(),
              }
            : report
        );

        setReports(updatedReports);
        setStatusDialogOpen(false);

        setSnackbar({
          open: true,
          message: `Status changed to ${newStatus}`,
          severity: "success",
        });
      }
    } catch (error) {
      console.error("Status change error:", error);
      console.error("Error details:", error.response?.data);

      let errorMessage = "Failed to update status";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
  };

  const handleStatusChangeClick = (report) => {
    setSelectedReport(report);
    setStatusChangeForm({
      newStatus: report.status,
      notes: "",
    });
    setStatusDialogOpen(true);
  };

  const handleViewProgressHistory = (report) => {
    setSelectedReport(report);
    setHistoryDialogOpen(true);
  };

  // Helper function to get current progress from report
  const getCurrentProgress = (report) => {
    if (report.progress !== undefined && report.progress !== null) {
      return report.progress;
    }

    if (report.progressUpdates && report.progressUpdates.length > 0) {
      const sortedUpdates = [...report.progressUpdates].sort(
        (a, b) =>
          new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)
      );
      return sortedUpdates[0]?.percentage || 0;
    }

    return calculateProgressFromStatus(report.status);
  };

  const calculateProgressFromStatus = (status) => {
    switch (status) {
      case "pending":
        return 0;
      case "assigned":
        return 25;
      case "in_progress":
        return 50;
      case "completed":
        return 100;
      default:
        return 0;
    }
  };

  const getStatusColor = (status, needsReview = false) => {
    if (needsReview) return "warning";

    switch (status) {
      case "pending":
        return "warning";
      case "assigned":
        return "info";
      case "in_progress":
        return "primary";
      case "completed":
        return "success";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusText = (status, needsReview = false) => {
    if (needsReview) return "Needs Review";

    return status?.replace("_", " ") || "Unknown";
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "pothole":
        return <EditRoad />;
      case "street_light":
        return <Lightbulb />;
      case "drainage":
        return <Water />;
      case "garbage":
        return <Delete />;
      case "road_sign":
        return <Assignment />;
      default:
        return <Build />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / (3600000 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Progress display helper
  const renderProgressBar = (progress, status, needsReview) => {
    let color = "primary";
    let label = `${progress}%`;

    if (needsReview) {
      color = "warning";
      label = "Awaiting Review";
    } else if (status === "completed") {
      color = "success";
      label = "Completed";
    }

    return (
      <Box sx={{ width: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography variant="caption">Progress</Typography>
          <Typography variant="caption" fontWeight="bold">
            {label}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          color={color}
          sx={{ height: 8, borderRadius: 1 }}
        />
      </Box>
    );
  };

  // Mock data (only used if API fails)
  const getMockReportsWithProgress = () => [
    {
      _id: "mock-1",
      title: "Large pothole on Main Road",
      description: "Deep pothole causing traffic issues near the market area",
      category: "pothole",
      status: "in_progress",
      priority: "high",
      progress: 65,
      progressUpdates: [
        {
          percentage: 30,
          description: "Started work",
          timestamp: "2024-01-20T10:30:00Z",
        },
        {
          percentage: 65,
          description: "65% completed",
          timestamp: "2024-01-21T14:20:00Z",
        },
      ],
      location: { address: "Main Road, Sector 15, Noida" },
      user: { _id: "u1", name: "John Doe", email: "john@example.com" },
      assignedTo: { _id: "s1", name: "Rajesh Kumar" },
      createdAt: "2024-01-20T10:30:00Z",
    },
  ];

  const getMockStaff = () => [
    {
      _id: "s1",
      name: "Rajesh Kumar",
      staffCategory: "pothole",
      category: "pothole",
      phone: "9876543211",
      email: "rajesh@example.com",
      isActive: true,
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Issue Management
                {apiMode === "demo" && (
                  <Chip
                    label="Demo Mode"
                    color="warning"
                    size="small"
                    sx={{ ml: 2 }}
                  />
                )}
                {apiMode === "live" && (
                  <Chip
                    label="Live Mode"
                    color="success"
                    size="small"
                    sx={{ ml: 2 }}
                  />
                )}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage reports and review staff completion
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchReports}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<Assignment />}
                onClick={() => {
                  if (apiMode === "demo") {
                    setSnackbar({
                      open: true,
                      message:
                        "In demo mode. In live mode, this would open a report creation form.",
                      severity: "info",
                    });
                  } else {
                    window.location.href = "/admin/reports/new";
                  }
                }}
              >
                Create Report
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Total Reports
                </Typography>
                <Typography variant="h4">{reportStats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Needs Review
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {reportStats.needsReview}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  In Progress
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {reportStats.inProgress}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h4" color="success.main">
                  {reportStats.completed}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="assigned">Assigned</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="pothole">Pothole</MenuItem>
                  <MenuItem value="street_light">Street Light</MenuItem>
                  <MenuItem value="drainage">Drainage</MenuItem>
                  <MenuItem value="garbage">Garbage</MenuItem>
                  <MenuItem value="road_sign">Road Sign</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setStatusFilter("all");
                  setCategoryFilter("all");
                  setPriorityFilter("all");
                  setSearchTerm("");
                }}
                sx={{ height: "56px" }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="All Reports" />
            <Tab label="Pending Assignment" />
            <Tab label="In Progress" />
            <Tab label="Needs Review" />
            <Tab label="Completed" />
          </Tabs>
        </Paper>

        {/* Reports Table */}
        <Paper>
          {loading && apiMode === "checking" ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 8,
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Connecting to server...
              </Typography>
            </Box>
          ) : filteredReports.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No reports found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your filters or refresh to fetch data
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Issue Details</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReports
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((report) => (
                      <TableRow key={report._id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {report.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                              sx={{ maxWidth: 300 }}
                            >
                              {report.description}
                            </Typography>
                            {report.location?.address && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mt: 0.5,
                                }}
                              >
                                <LocationOn sx={{ fontSize: 14, mr: 0.5 }} />
                                {report.location.address}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell width={150}>
                          {renderProgressBar(
                            report.progress || 0,
                            report.status,
                            report.needsReview
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getCategoryIcon(report.category)}
                            label={report.category?.replace("_", " ")}
                            size="small"
                            sx={{ textTransform: "capitalize" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusText(
                              report.status,
                              report.needsReview
                            )}
                            color={getStatusColor(
                              report.status,
                              report.needsReview
                            )}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={report.priority}
                            color={getPriorityColor(report.priority)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {report.assignedTo ? (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {report.assignedTo?.name?.charAt(0)}
                              </Avatar>
                              <Typography variant="body2">
                                {report.assignedTo?.name}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Not assigned
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatRelativeTime(report.createdAt)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            by {report.user?.name || "Unknown"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              justifyContent: "flex-end",
                            }}
                          >
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewReport(report)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="View Progress History">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleViewProgressHistory(report)
                                }
                              >
                                <Timeline />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Change Status">
                              <IconButton
                                size="small"
                                onClick={() => handleStatusChangeClick(report)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>

                            {report.status === "pending" && (
                              <Tooltip title="Assign to Staff">
                                <IconButton
                                  size="small"
                                  onClick={() => handleAssignClick(report)}
                                >
                                  <Assignment />
                                </IconButton>
                              </Tooltip>
                            )}

                            {report.needsReview &&
                              report.status === "completed" && (
                                <Tooltip title="Review Completion">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedReport(report);
                                      setReviewDialogOpen(true);
                                      setReviewForm({
                                        adminNotes: "",
                                      });
                                    }}
                                    color="warning"
                                  >
                                    <CheckCircle />
                                  </IconButton>
                                </Tooltip>
                              )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredReports.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableContainer>
          )}
        </Paper>

        {/* View Report Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedReport && (
            <>
              <DialogTitle>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="h5">{selectedReport.title}</Typography>
                  <Chip
                    label={getStatusText(
                      selectedReport.status,
                      selectedReport.needsReview
                    )}
                    color={getStatusColor(
                      selectedReport.status,
                      selectedReport.needsReview
                    )}
                  />
                </Box>
              </DialogTitle>
              <DialogContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Current Progress
                      </Typography>
                      {renderProgressBar(
                        selectedReport.progress || 0,
                        selectedReport.status,
                        selectedReport.needsReview
                      )}
                    </Box>

                    <Typography
                      variant="subtitle1"
                      color="text.secondary"
                      gutterBottom
                    >
                      Description
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {selectedReport.description}
                    </Typography>

                    {selectedReport.progressUpdates &&
                      selectedReport.progressUpdates.length > 0 && (
                        <>
                          <Typography
                            variant="subtitle1"
                            color="text.secondary"
                            gutterBottom
                          >
                            Recent Updates
                          </Typography>
                          <List dense>
                            {selectedReport.progressUpdates
                              .sort(
                                (a, b) =>
                                  new Date(b.timestamp || b.date) -
                                  new Date(a.timestamp || a.date)
                              )
                              .slice(0, 3)
                              .map((update, index) => (
                                <ListItem key={index}>
                                  <ListItemText
                                    primary={`${update.percentage}% - ${update.description}`}
                                    secondary={formatRelativeTime(
                                      update.timestamp || update.date
                                    )}
                                  />
                                </ListItem>
                              ))}
                          </List>
                        </>
                      )}
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography
                          variant="subtitle1"
                          color="text.secondary"
                          gutterBottom
                        >
                          Report Information
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemText primary="Category" />
                            <Chip
                              icon={getCategoryIcon(selectedReport.category)}
                              label={selectedReport.category?.replace("_", " ")}
                              size="small"
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="Priority" />
                            <Chip
                              label={selectedReport.priority}
                              color={getPriorityColor(selectedReport.priority)}
                              size="small"
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText primary="Created" />
                            <Typography variant="body2">
                              {formatDate(selectedReport.createdAt)}
                            </Typography>
                          </ListItem>
                          {selectedReport.actualCompletion && (
                            <ListItem>
                              <ListItemText primary="Completed" />
                              <Typography variant="body2">
                                {formatDate(selectedReport.actualCompletion)}
                              </Typography>
                            </ListItem>
                          )}
                        </List>

                        {selectedReport.assignedTo && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Typography
                              variant="subtitle1"
                              color="text.secondary"
                              gutterBottom
                            >
                              Assigned Staff
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                mb: 2,
                              }}
                            >
                              <Avatar>
                                {selectedReport.assignedTo?.name?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">
                                  {selectedReport.assignedTo?.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {selectedReport.assignedTo?.staffCategory ||
                                    selectedReport.assignedTo?.category}
                                </Typography>
                              </Box>
                            </Box>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography
                      variant="subtitle1"
                      color="text.secondary"
                      gutterBottom
                    >
                      Images
                    </Typography>
                    {selectedReport.images &&
                    selectedReport.images.length > 0 ? (
                      <Grid container spacing={2}>
                        {selectedReport.images.map((image, index) => (
                          <Grid item xs={6} sm={4} md={3} key={index}>
                            <Card>
                              <Box
                                component="img"
                                src={image.url || image}
                                alt={`Report image ${index + 1}`}
                                sx={{
                                  width: "100%",
                                  height: 120,
                                  objectFit: "cover",
                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  window.open(image.url || image, "_blank")
                                }
                              />
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    ) : selectedReport.beforeImages &&
                      selectedReport.beforeImages.length > 0 ? (
                      <Grid container spacing={2}>
                        {selectedReport.beforeImages.map((image, index) => (
                          <Grid item xs={6} sm={4} md={3} key={index}>
                            <Card>
                              <Box
                                component="img"
                                src={image.url || image}
                                alt={`Before image ${index + 1}`}
                                sx={{
                                  width: "100%",
                                  height: 120,
                                  objectFit: "cover",
                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  window.open(image.url || image, "_blank")
                                }
                              />
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No images available for this report
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                {selectedReport.needsReview &&
                  selectedReport.status === "completed" && (
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<CheckCircle />}
                      onClick={() => {
                        setViewDialogOpen(false);
                        setReviewDialogOpen(true);
                      }}
                    >
                      Review Completion
                    </Button>
                  )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Progress History Dialog */}
        <Dialog
          open={historyDialogOpen}
          onClose={() => setHistoryDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          {selectedReport && (
            <>
              <DialogTitle>
                <Typography variant="h6">Progress History</Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {selectedReport.title}
                </Typography>
              </DialogTitle>
              <DialogContent>
                <List>
                  {selectedReport.progressUpdates &&
                    selectedReport.progressUpdates.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Staff's Completion Notes
                        </Typography>
                        <Card variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="body2" paragraph>
                            {selectedReport.completionNotes ||
                              selectedReport.progressUpdates.sort(
                                (a, b) =>
                                  new Date(b.timestamp || b.date) -
                                  new Date(a.timestamp || a.date)
                              )[0]?.description ||
                              "No completion notes provided"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Completed by:{" "}
                            {selectedReport.staffCompletedBy?.name ||
                              selectedReport.assignedTo?.name ||
                              "Staff"}
                            {selectedReport.staffCompletedAt &&
                              ` on ${formatDate(
                                selectedReport.staffCompletedAt
                              )}`}
                          </Typography>
                        </Card>
                      </Box>
                    )}
                </List>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setHistoryDialogOpen(false)}>
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Review Completion Dialog */}
        <Dialog
          open={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          {selectedReport && (
            <>
              <DialogTitle>
                <Typography variant="h6">Review Completion</Typography>
              </DialogTitle>
              <DialogContent>
                <Box sx={{ pt: 2 }}>
                  <Typography variant="body1" paragraph>
                    Review completion of <strong>{selectedReport.title}</strong>
                  </Typography>

                  {selectedReport.progressUpdates &&
                    selectedReport.progressUpdates.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Staff's Final Update
                        </Typography>
                        <Card variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="body2">
                            {
                              selectedReport.progressUpdates.sort(
                                (a, b) =>
                                  new Date(b.timestamp || b.date) -
                                  new Date(a.timestamp || a.date)
                              )[0]?.description
                            }
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(
                              selectedReport.progressUpdates.sort(
                                (a, b) =>
                                  new Date(b.timestamp || b.date) -
                                  new Date(a.timestamp || a.date)
                              )[0]?.timestamp
                            )}
                          </Typography>
                        </Card>
                      </Box>
                    )}

                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Admin Notes"
                    placeholder="Add your review notes or feedback..."
                    value={reviewForm.adminNotes}
                    onChange={(e) =>
                      setReviewForm({ adminNotes: e.target.value })
                    }
                    sx={{ mb: 2 }}
                  />

                  <Alert severity="info" sx={{ mb: 2 }}>
                    Staff has marked this report as completed. Please review and
                    approve or reject.
                  </Alert>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setReviewDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  color="error"
                  startIcon={<ThumbDown />}
                  onClick={handleRejectCompletion}
                >
                  Reject
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<ThumbUp />}
                  onClick={handleApproveCompletion}
                >
                  Approve
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Change Status Dialog */}
        <Dialog
          open={statusDialogOpen}
          onClose={() => setStatusDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          {selectedReport && (
            <>
              <DialogTitle>
                <Typography variant="h6">Change Report Status</Typography>
              </DialogTitle>
              <DialogContent>
                <Box sx={{ pt: 2 }}>
                  <Typography variant="body1" paragraph>
                    Change status for <strong>{selectedReport.title}</strong>
                  </Typography>

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>New Status</InputLabel>
                    <Select
                      value={statusChangeForm.newStatus}
                      onChange={(e) =>
                        setStatusChangeForm({
                          ...statusChangeForm,
                          newStatus: e.target.value,
                        })
                      }
                      label="New Status"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="assigned">Assigned</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Status Change Notes (Optional)"
                    placeholder="Add notes about why you're changing the status..."
                    value={statusChangeForm.notes}
                    onChange={(e) =>
                      setStatusChangeForm({
                        ...statusChangeForm,
                        notes: e.target.value,
                      })
                    }
                  />
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setStatusDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={() =>
                    handleStatusChange(
                      selectedReport._id,
                      statusChangeForm.newStatus,
                      statusChangeForm.notes
                    )
                  }
                >
                  Update Status
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Assign Report Dialog */}
        {/* Assign Report Dialog */}
<Dialog
  open={assignDialogOpen}
  onClose={() => setAssignDialogOpen(false)}
  maxWidth="sm"
  fullWidth
>
  {selectedReport && (
    <>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getCategoryIcon(selectedReport.category)}
          <Typography variant="h6">Assign Report</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {/* Report Details */}
          <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
            <Typography variant="subtitle1" gutterBottom color="text.secondary">
              Report Details
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Typography variant="body1" fontWeight={600}>
                  {selectedReport.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedReport.description?.substring(0, 100)}...
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Category:
                </Typography>
                <Chip
                  label={selectedReport.category?.replace('_', ' ')}
                  size="small"
                  sx={{ ml: 1, textTransform: 'capitalize' }}
                  icon={getCategoryIcon(selectedReport.category)}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Priority:
                </Typography>
                <Chip
                  label={selectedReport.priority}
                  color={getPriorityColor(selectedReport.priority)}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Location:
                </Typography>
                <Typography variant="caption" sx={{ ml: 1 }}>
                  {selectedReport.location?.address || 'Not specified'}
                </Typography>
              </Grid>
            </Grid>
          </Card>

          {/* Staff Selection */}
          <Typography variant="subtitle1" gutterBottom>
            Select Staff Member
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              (Filtered for {selectedReport.category?.replace('_', ' ')} category)
            </Typography>
          </Typography>
          
          {(() => {
            // First, let's debug what categories we have
            console.log('Report category:', selectedReport.category);
            console.log('All staff:', staffMembers);
            
            // Normalize category names for comparison
            const normalizeCategory = (category) => {
              if (!category) return '';
              return category.toLowerCase().replace(/\s+/g, '_').trim();
            };
            
            const reportCategory = normalizeCategory(selectedReport.category);
            
            // Filter staff by category with multiple matching strategies
            const filteredStaff = staffMembers.filter(staff => {
              if (!staff.isActive) return false;
              
              // Get staff category from various possible field names
              const staffMainCategory = staff.staffCategory || staff.category;
              const staffCategories = staff.categories || [];
              
              // Normalize staff categories
              const normalizedStaffCategory = normalizeCategory(staffMainCategory);
              const normalizedStaffCategories = staffCategories.map(normalizeCategory);
              
              // Check multiple matching strategies
              const exactMatch = normalizedStaffCategory === reportCategory;
              const inCategories = normalizedStaffCategories.includes(reportCategory);
              const partialMatch = reportCategory && normalizedStaffCategory.includes(reportCategory);
              
              // Special handling for common category variations
              const categoryVariations = {
                'pothole': ['road_repair', 'road_maintenance'],
                'street_light': ['lighting', 'electricity'],
                'drainage': ['sewer', 'water_drainage'],
                'garbage': ['waste', 'trash', 'cleanliness'],
                'road_sign': ['traffic_sign', 'signage']
              };
              
              // Check if report category has variations that match staff category
              let variationMatch = false;
              if (categoryVariations[reportCategory]) {
                variationMatch = categoryVariations[reportCategory].some(variation => 
                  normalizedStaffCategory.includes(variation) ||
                  normalizedStaffCategories.includes(variation)
                );
              }
              
              return exactMatch || inCategories || partialMatch || variationMatch;
            });
            
            console.log('Filtered staff:', filteredStaff);
            
            const otherStaff = staffMembers.filter(staff => 
              staff.isActive && !filteredStaff.includes(staff)
            );

            return (
              <>
                {filteredStaff.length > 0 ? (
                  <>
                    <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                      🎯 Matching Staff ({filteredStaff.length} found)
                    </Typography>
                    <RadioGroup
                      value={assignmentForm.staffId}
                      onChange={(e) => setAssignmentForm({
                        ...assignmentForm,
                        staffId: e.target.value
                      })}
                    >
                      {filteredStaff.map((staff) => (
                        <FormControlLabel
                          key={staff._id}
                          value={staff._id}
                          control={<Radio />}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                {staff.name?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {staff.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  📱 {staff.phone || 'No phone'} • 
                                  🏷️ {staff.staffCategory || staff.category || 'General'}
                                  {staff.expertise && ` • 🛠️ ${staff.expertise}`}
                                </Typography>
                                {staff.assignedCount > 0 && (
                                  <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
                                    📋 {staff.assignedCount} active tasks
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          }
                          sx={{
                            mb: 1,
                            p: 1,
                            borderRadius: 1,
                            border: '2px solid',
                            borderColor: 'primary.light',
                            backgroundColor: 'primary.50',
                            '&.Mui-checked': {
                              borderColor: 'primary.main',
                              backgroundColor: 'primary.100'
                            }
                          }}
                        />
                      ))}
                    </RadioGroup>
                  </>
                ) : (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      No specialized staff found for "<strong>{selectedReport.category?.replace('_', ' ')}</strong>" category.
                    </Typography>
                    <Typography variant="caption">
                      Showing all available staff members instead.
                    </Typography>
                  </Alert>
                )}

                {(filteredStaff.length === 0 || otherStaff.length > 0) && (
                  <>
                    {filteredStaff.length === 0 && otherStaff.length > 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                        👥 Available Staff ({otherStaff.length} total)
                      </Typography>
                    )}
                    
                    {otherStaff.length > 0 && (
                      <RadioGroup
                        value={assignmentForm.staffId}
                        onChange={(e) => setAssignmentForm({
                          ...assignmentForm,
                          staffId: e.target.value
                        })}
                      >
                        {otherStaff.map((staff) => (
                          <FormControlLabel
                            key={staff._id}
                            value={staff._id}
                            control={<Radio />}
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.400' }}>
                                  {staff.name?.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2">{staff.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    📱 {staff.phone || 'No phone'} • 
                                    🏷️ {staff.staffCategory || staff.category || 'General'}
                                    {staff.categories?.length > 0 && 
                                      ` • 📋 Categories: ${staff.categories.join(', ')}`}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                            sx={{
                              mb: 1,
                              p: 1,
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              backgroundColor: 'grey.50',
                              '&.Mui-checked': {
                                borderColor: 'primary.main',
                                backgroundColor: 'action.selected'
                              }
                            }}
                          />
                        ))}
                      </RadioGroup>
                    )}
                  </>
                )}
                
                {filteredStaff.length === 0 && otherStaff.length === 0 && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    No active staff members available for assignment.
                  </Alert>
                )}
              </>
            );
          })()}

          {/* Due Date */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              📅 Due Date
            </Typography>
            <TextField
              fullWidth
              type="date"
              value={assignmentForm.dueDate}
              onChange={(e) => setAssignmentForm({
                ...assignmentForm,
                dueDate: e.target.value
              })}
              InputLabelProps={{ shrink: true }}
              helperText="Set a deadline for task completion"
            />
          </Box>

          {/* Assignment Notes */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              📝 Assignment Notes (Optional)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Add specific instructions, safety notes, or special requirements for the staff member..."
              value={assignmentForm.notes}
              onChange={(e) => setAssignmentForm({
                ...assignmentForm,
                notes: e.target.value
              })}
              helperText="These notes will be visible to the assigned staff member"
            />
          </Box>

          {/* Stats for selected staff */}
          {assignmentForm.staffId && (() => {
            const selectedStaff = staffMembers.find(s => s._id === assignmentForm.staffId);
            if (!selectedStaff) return null;
            
            const assignedReports = reports.filter(r => 
              r.assignedTo?._id === assignmentForm.staffId && 
              r.status !== 'completed'
            );
            
            const completedReports = reports.filter(r => 
              r.assignedTo?._id === assignmentForm.staffId && 
              r.status === 'completed'
            );
            
            return (
              <Alert 
                severity={assignedReports.length > 3 ? "warning" : "info"} 
                sx={{ mt: 3 }}
              >
                <Typography variant="body2">
                  <strong>{selectedStaff.name}</strong>
                </Typography>
                <Typography variant="caption" component="div">
                  • Currently has <strong>{assignedReports.length}</strong> active reports
                  <br />
                  • Has completed <strong>{completedReports.length}</strong> reports
                  <br />
                  • Specialization: <strong>{selectedStaff.staffCategory || selectedStaff.category || 'General'}</strong>
                  {selectedStaff.categories?.length > 0 && (
                    <>
                      <br />
                      • Can handle: <strong>{selectedStaff.categories.join(', ')}</strong>
                    </>
                  )}
                </Typography>
              </Alert>
            );
          })()}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleAssignSubmit}
          disabled={!assignmentForm.staffId}
          startIcon={<Assignment />}
        >
          Assign Report
        </Button>
      </DialogActions>
    </>
  )}
</Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </motion.div>
    </Container>
  );
};

export default IssueManagement;
