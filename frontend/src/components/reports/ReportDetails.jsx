import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Button,
  Divider,
  IconButton,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  LocationOn,
  CalendarToday,
  Person,
  Category,
  PriorityHigh,
  Edit,
  Delete,
  Share,
  Download,
  ArrowBack,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import StatusTimeline from './StatusTimeline';
import ImageUploader from '../common/ImageUploader';
import ConfirmationModal from '../common/ConfirmationModal';
import { reportAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const ReportDetails = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    fetchReportDetails();
  }, [id]);

  const fetchReportDetails = async () => {
    try {
      const response = await reportAPI.getReportById(id);
      setReport(response.data);
    } catch (error) {
      toast.error('Failed to load report details');
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await reportAPI.deleteReport(id);
      toast.success('Report deleted successfully');
      navigate('/reports/my-reports');
    } catch (error) {
      toast.error('Failed to delete report');
    } finally {
      setDeleteModalOpen(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await reportAPI.updateStatus(id, newStatus);
      toast.success('Status updated successfully');
      fetchReportDetails();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: theme.palette.warning.main,
      assigned: theme.palette.info.main,
      in_progress: theme.palette.primary.main,
      completed: theme.palette.success.main,
      cancelled: theme.palette.error.main,
    };
    return colors[status] || theme.palette.grey[500];
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: theme.palette.success.main,
      medium: theme.palette.warning.main,
      high: theme.palette.error.main,
    };
    return colors[severity] || theme.palette.grey[500];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!report) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Report not found
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight={700}>
            Report Details
          </Typography>
          <Chip
            label={report.status.toUpperCase()}
            size="small"
            sx={{
              backgroundColor: getStatusColor(report.status) + '20',
              color: getStatusColor(report.status),
              fontWeight: 600,
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Share />}
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Link copied to clipboard');
            }}
          >
            Share
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => toast.success('Export feature coming soon')}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/reports/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<Delete />}
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Details */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                {report.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {report.description}
              </Typography>

              <Divider sx={{ my: 3 }} />

              {/* Quick Stats */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Category sx={{ color: theme.palette.primary.main, mb: 1 }} />
                    <Typography variant="caption" color="text.secondary">Category</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {report.category}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                    <PriorityHigh sx={{ color: getSeverityColor(report.severity), mb: 1 }} />
                    <Typography variant="caption" color="text.secondary">Severity</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {report.severity}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                    <CalendarToday sx={{ color: theme.palette.info.main, mb: 1 }} />
                    <Typography variant="caption" color="text.secondary">Reported On</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Person sx={{ color: theme.palette.secondary.main, mb: 1 }} />
                    <Typography variant="caption" color="text.secondary">Reporter</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {report.user?.name || 'Anonymous'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Location */}
              {report.location && (
                <>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    <LocationOn sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Location
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, mb: 3 }}>
                    <Typography variant="body1" fontWeight={600}>
                      {report.location.address}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Coordinates: {report.location.coordinates?.lat?.toFixed(6)}, {report.location.coordinates?.lng?.toFixed(6)}
                    </Typography>
                  </Box>
                </>
              )}

              {/* Images */}
              {report.images && report.images.length > 0 && (
                <>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Attached Images
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <ImageUploader
                      value={report.images.map(img => ({ url: img, file: null }))}
                      readOnly
                    />
                  </Box>
                </>
              )}

              {/* Staff Assignment */}
              {report.assignedStaff && (
                <>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Assigned Staff
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          bgcolor: theme.palette.primary.main,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 600,
                        }}
                      >
                        {report.assignedStaff.name?.charAt(0)}
                      </Box>
                      <Box>
                        <Typography variant="body1" fontWeight={600}>
                          {report.assignedStaff.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {report.assignedStaff.email}
                        </Typography>
                        <Chip
                          label={report.assignedStaff.specialization || 'General Staff'}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Timeline & Updates */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Status Timeline
              </Typography>
              <StatusTimeline
                status={report.status}
                createdAt={report.createdAt}
                onStatusUpdate={handleStatusUpdate}
              />
            </CardContent>
          </Card>

          {/* Updates & Comments */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Updates & Comments
              </Typography>
              {report.updates && report.updates.length > 0 ? (
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {report.updates.map((update, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        mb: 2,
                        bgcolor: 'background.default',
                        borderRadius: 2,
                        borderLeft: `3px solid ${theme.palette.primary.main}`,
                      }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {update.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {update.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          By {update.by}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(update.timestamp), 'MMM dd, hh:mm a')}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">
                  No updates yet. Check back later for progress reports.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ConfirmationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Report"
        message="Are you sure you want to delete this report? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />
    </motion.div>
  );
};

export default ReportDetails;