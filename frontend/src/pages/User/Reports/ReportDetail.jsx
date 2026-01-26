import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Grid,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ImageList,
  ImageListItem,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  MoreVert,
  Delete,
  Share,
  Edit,
  LocationOn,
  CalendarToday,
  Person,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { reportAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext'; // Add this import

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user info
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    fetchReportDetails();
  }, [id]);

  const fetchReportDetails = async () => {
    try {
      setLoading(true);
      const response = await reportAPI.getReportById(id); // Changed from getReportDetail to getReportById
      
      console.log('API Response:', response); // Debug log
      
      // Handle response structure based on your API
      const reportData = response.data?.data || response.data;
      
      if (reportData) {
        setReport(reportData);
      } else {
        toast.error('Report not found');
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
      toast.error(error.response?.data?.message || 'Failed to load report details');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    try {
      await reportAPI.deleteReport(id);
      toast.success('Report deleted successfully');
      navigate('/reports/my-reports');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete report');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      submitted: 'info',
      under_review: 'info',
      assigned: 'primary',
      in_progress: 'primary',
      completed: 'success',
      resolved: 'success',
      rejected: 'error',
      cancelled: 'error',
      closed: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labelMap = {
      pending: 'Pending',
      submitted: 'Submitted',
      under_review: 'Under Review',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      completed: 'Completed',
      resolved: 'Resolved',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
      closed: 'Closed',
    };
    return labelMap[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Check if current user owns the report
  const isReportOwner = user && report && user._id === report.user?._id;

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!report) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/reports/my-reports')} sx={{ mb: 2 }}>
          Back to Reports
        </Button>
        <Alert severity="error">Report not found or you don't have permission to view it.</Alert>
      </Container>
    );
  }

  // Handle images - check multiple possible formats
  const getImages = () => {
    if (!report) return [];
    
    const images = report.images || report.media || [];
    
    // If it's a string, convert to array
    if (typeof images === 'string') {
      return [{ url: images, alt: 'Report image' }];
    }
    
    // If it's an array, ensure each has proper format
    return images.map((img, idx) => {
      if (typeof img === 'string') {
        return { url: img, alt: `Report image ${idx + 1}` };
      }
      return {
        url: img.url || img.src || img,
        alt: img.alt || img.caption || `Report image ${idx + 1}`
      };
    });
  };

  const images = getImages();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/reports/my-reports')}
        >
          Back to Reports
        </Button>
        
        {/* Only show menu if user owns the report */}
        {isReportOwner && (
          <Box>
            <IconButton onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              {report.status === 'pending' && (
                <MenuItem onClick={() => { navigate(`/reports/${id}/edit`); handleMenuClose(); }}>
                  <Edit sx={{ mr: 1 }} /> Edit
                </MenuItem>
              )}
              <MenuItem onClick={handleShare}>
                <Share sx={{ mr: 1 }} /> Share
              </MenuItem>
              {report.status === 'pending' && (
                <MenuItem onClick={() => { setDeleteDialog(true); handleMenuClose(); }}>
                  <Delete sx={{ mr: 1 }} /> Delete
                </MenuItem>
              )}
            </Menu>
          </Box>
        )}
      </Box>

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Report ID: {id}<br />
          User ID: {user?._id}<br />
          Report Owner ID: {report.user?._id}
        </Alert>
      )}

      {/* Main Content */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {report.title || 'Untitled Report'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip label={report.category || 'Uncategorized'} size="small" variant="outlined" />
                  <Chip
                    label={getStatusLabel(report.status)}
                    size="small"
                    color={getStatusColor(report.status)}
                  />
                  {report.priority && (
                    <Chip label={`Priority: ${report.priority}`} size="small" 
                      color={report.priority === 'high' ? 'error' : 
                             report.priority === 'medium' ? 'warning' : 'success'} />
                  )}
                </Box>
              </Box>
            </Box>
          }
        />

        <Divider />

        <CardContent>
          {/* Report Information Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarToday fontSize="small" color="action" />
                <Typography variant="caption" color="textSecondary">
                  Reported On
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {formatDate(report.createdAt)}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Person fontSize="small" color="action" />
                <Typography variant="caption" color="textSecondary">
                  Reporter
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {report.user?.name || report.createdBy?.name || 'Anonymous'}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="caption" color="textSecondary">
                  Location
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {report.location?.address || report.address || 'No address provided'}
              </Typography>
            </Grid>

            {report.assignedTo && (
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="textSecondary" display="block">
                  Assigned To
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {report.assignedTo.name || report.assignedTo}
                </Typography>
              </Grid>
            )}
          </Grid>

          {/* Description */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Description
            </Typography>
            <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
              <Typography variant="body1">
                {report.description || 'No description provided'}
              </Typography>
            </Paper>
          </Box>

          {/* Images */}
          {images.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                Attached Images ({images.length})
              </Typography>
              <ImageList cols={{ xs: 1, sm: 2, md: 3 }} gap={16}>
                {images.map((image, idx) => (
                  <ImageListItem key={idx}>
                    <img
                      src={image.url}
                      alt={image.alt}
                      loading="lazy"
                      style={{ 
                        borderRadius: 8, 
                        cursor: 'pointer',
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover'
                      }}
                      onClick={() => window.open(image.url, '_blank')}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          )}

          {/* Additional Details */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
              Additional Information
            </Typography>
            <Grid container spacing={2}>
              {report.severity && (
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="caption" color="textSecondary">
                    Severity
                  </Typography>
                  <Typography variant="body2">
                    {report.severity}
                  </Typography>
                </Grid>
              )}
              {report.urgency && (
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="caption" color="textSecondary">
                    Urgency
                  </Typography>
                  <Typography variant="body2">
                    {report.urgency}
                  </Typography>
                </Grid>
              )}
              {report.updatedAt && (
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="caption" color="textSecondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(report.updatedAt)}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Report?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this report? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => { 
              handleDelete(); 
              setDeleteDialog(false); 
            }} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ReportDetail;