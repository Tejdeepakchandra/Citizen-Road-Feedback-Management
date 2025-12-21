// src/pages/Staff/UploadImages.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  useTheme,
  alpha,
  Stepper,
  Step,
  StepLabel,
  ImageList,
  ImageListItem,
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  ArrowBack,
  ArrowForward,
  Delete,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { staffAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const UploadImages = () => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedBeforeImage, setSelectedBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [afterImagePreview, setAfterImagePreview] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [caption, setCaption] = useState('');
  const theme = useTheme();

  const steps = ['Select Report', 'Choose Before Image', 'Upload After Image', 'Confirm'];

  useEffect(() => {
    fetchAssignedReports();
  }, []);

  const fetchAssignedReports = async () => {
    setLoading(true);
    try {
      // Use the correct API endpoint for gallery-eligible reports
      const response = await staffAPI.getAssignedReportsForGallery();
      // The response structure might be different - adjust based on your actual API response
      const filteredReports = response.data.data || response.data || [];
      setReports(filteredReports);
    } catch (error) {
      toast.error('Failed to load assigned reports');
      console.error('Fetch reports error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportSelect = (report) => {
    setSelectedReport(report);
    setActiveStep(1);
  };

  const handleBeforeImageSelect = (image) => {
    setSelectedBeforeImage(image);
    setActiveStep(2);
  };

  const handleAfterImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setAfterImage(file);
      setAfterImagePreview(URL.createObjectURL(file));
      setActiveStep(3);
    }
  };

 const handleSubmit = async () => {
  if (!selectedReport || !selectedBeforeImage || !afterImage) {
    toast.error('Please complete all steps');
    return;
  }

  setUploading(true);
  try {
    const formData = new FormData();
    formData.append('beforeImageId', selectedBeforeImage._id || selectedBeforeImage.id);
    formData.append('afterCaption', caption || 'After completion');
    formData.append('afterImage', afterImage);

    // Use the correct API endpoint for uploading gallery images
    const response = await staffAPI.uploadGalleryImages(selectedReport._id, formData);
    
    if (response.data.success) {
      toast.success('Gallery images uploaded successfully! Awaiting admin approval.');
      resetForm();
      setUploadDialogOpen(false);
      fetchAssignedReports(); // Refresh the list
    } else {
      toast.error(response.data.error || 'Failed to upload images');
    }
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        'Failed to upload images';
    toast.error(errorMessage);
  } finally {
    setUploading(false);
  }
};

  const resetForm = () => {
    setSelectedReport(null);
    setSelectedBeforeImage(null);
    setAfterImage(null);
    setAfterImagePreview(null);
    setCaption('');
    setActiveStep(0);
  };

  const handleRemoveAfterImage = () => {
    setAfterImage(null);
    setAfterImagePreview(null);
    setActiveStep(2);
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Upload Gallery Images
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Upload before/after image pairs for completed tasks
          </Typography>
        </Box>

        {reports.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body1">
              No completed reports available for gallery upload
            </Typography>
            <Typography variant="body2">
              Complete your assigned tasks first, then upload before/after images here.
            </Typography>
          </Alert>
        ) : (
          <>
            {/* Stepper */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>

            {/* Step 1: Select Report */}
            {activeStep === 0 && (
              <Grid container spacing={3}>
                {reports.map((report) => (
                  <Grid item xs={12} md={6} lg={4} key={report._id}>
                    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3 }}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          height: '100%',
                          borderRadius: 3,
                          '&:hover': {
                            boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.2)}`,
                          }
                        }}
                        onClick={() => handleReportSelect(report)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                              {report.title}
                            </Typography>
                            <Chip
                              label={report.category}
                              color="primary"
                              size="small"
                            />
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {report.description?.substring(0, 100)}...
                          </Typography>
                          
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Location
                            </Typography>
                            <Typography variant="body2">
                              {report.location?.address || 'Location not specified'}
                            </Typography>
                          </Box>

                          {/* User Images Preview */}
                          {report.images && report.images.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                User Images ({report.images.length})
                              </Typography>
                              <ImageList cols={3} gap={4} sx={{ m: 0 }}>
                                {report.images.slice(0, 3).map((image, index) => (
                                  <ImageListItem key={index}>
                                    <img
                                      src={image.url || image}
                                      alt={`User image ${index + 1}`}
                                      loading="lazy"
                                      style={{ height: 60, objectFit: 'cover', borderRadius: 4 }}
                                    />
                                  </ImageListItem>
                                ))}
                              </ImageList>
                            </Box>
                          )}

                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<ArrowForward />}
                            sx={{ mt: 2 }}
                            onClick={() => handleReportSelect(report)}
                          >
                            Select This Report
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Step 2: Choose Before Image */}
            {activeStep === 1 && selectedReport && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <IconButton onClick={() => setActiveStep(0)} sx={{ mr: 2 }}>
                    <ArrowBack />
                  </IconButton>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedReport.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Select a "Before" image from user's uploaded images
                    </Typography>
                  </Box>
                </Box>

                {selectedReport.images && selectedReport.images.length > 0 ? (
                  <Grid container spacing={2}>
                    {selectedReport.images.map((image, index) => (
                      <Grid item xs={12} sm={6} md={4} key={image._id || index}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer',
                            border: selectedBeforeImage?._id === image._id 
                              ? `2px solid ${theme.palette.primary.main}` 
                              : '2px solid transparent',
                            transition: 'border-color 0.3s',
                            '&:hover': {
                              borderColor: alpha(theme.palette.primary.main, 0.5),
                            }
                          }}
                          onClick={() => handleBeforeImageSelect(image)}
                        >
                          <Box sx={{ position: 'relative' }}>
                            <img
                              src={image.url || image}
                              alt={`Before image ${index + 1}`}
                              style={{
                                width: '100%',
                                height: 200,
                                objectFit: 'cover',
                                display: 'block'
                              }}
                            />
                            {selectedBeforeImage?._id === image._id && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  bgcolor: theme.palette.primary.main,
                                  borderRadius: '50%',
                                  width: 32,
                                  height: 32,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <CheckCircle sx={{ color: 'white', fontSize: 20 }} />
                              </Box>
                            )}
                          </Box>
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="body2" noWrap>
                              {image.caption || `Image ${index + 1}`}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Alert severity="warning">
                    No user images found for this report
                  </Alert>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  <Button
                    startIcon={<ArrowBack />}
                    onClick={() => setActiveStep(0)}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    disabled={!selectedBeforeImage}
                    onClick={() => setActiveStep(2)}
                  >
                    Next: Upload After Image
                  </Button>
                </Box>
              </Box>
            )}

            {/* Step 3: Upload After Image */}
            {activeStep === 2 && selectedReport && selectedBeforeImage && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <IconButton onClick={() => setActiveStep(1)} sx={{ mr: 2 }}>
                    <ArrowBack />
                  </IconButton>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      Upload "After" Image
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upload a photo showing the completed work
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={4}>
                  {/* Before Image */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Before Image
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <img
                          src={selectedBeforeImage.url || selectedBeforeImage}
                          alt="Selected before"
                          style={{
                            width: '100%',
                            height: 300,
                            objectFit: 'cover',
                            borderRadius: 8
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {selectedBeforeImage.caption || 'User uploaded image'}
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* After Image Upload */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        After Image
                      </Typography>
                      
                      {afterImagePreview ? (
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ position: 'relative' }}>
                            <img
                              src={afterImagePreview}
                              alt="After preview"
                              style={{
                                width: '100%',
                                height: 300,
                                objectFit: 'cover',
                                borderRadius: 8
                              }}
                            />
                            <IconButton
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                              }}
                              onClick={handleRemoveAfterImage}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            {afterImage.name}
                          </Typography>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            border: '2px dashed',
                            borderColor: 'divider',
                            borderRadius: 3,
                            p: 4,
                            textAlign: 'center',
                            mb: 3,
                            cursor: 'pointer',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: alpha(theme.palette.primary.main, 0.05)
                            }
                          }}
                          onClick={() => document.getElementById('after-image-upload').click()}
                        >
                          <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="body1" gutterBottom>
                            Click to upload after image
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Supports JPG, PNG (Max 5MB)
                          </Typography>
                        </Box>
                      )}

                      <TextField
                        fullWidth
                        label="Caption for After Image"
                        placeholder="Describe the completed work..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        multiline
                        rows={2}
                        sx={{ mb: 3 }}
                      />

                      <input
                        type="file"
                        id="after-image-upload"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleAfterImageUpload}
                      />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                          startIcon={<ArrowBack />}
                          onClick={() => setActiveStep(1)}
                        >
                          Back
                        </Button>
                        <Button
                          variant="contained"
                          disabled={!afterImage}
                          onClick={() => setActiveStep(3)}
                        >
                          Next: Review & Submit
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Step 4: Confirm & Submit */}
            {activeStep === 3 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <IconButton onClick={() => setActiveStep(2)} sx={{ mr: 2 }}>
                    <ArrowBack />
                  </IconButton>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      Review & Submit
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Review your before/after pair before submission
                    </Typography>
                  </Box>
                </Box>

                <Paper sx={{ p: 4, borderRadius: 3, mb: 4 }}>
                  <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Before
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <img
                          src={selectedBeforeImage.url || selectedBeforeImage}
                          alt="Before"
                          style={{
                            width: '100%',
                            height: 300,
                            objectFit: 'cover',
                            borderRadius: 8
                          }}
                        />
                      </Box>
                      <Typography variant="body2">
                        {selectedBeforeImage.caption || 'User uploaded image'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        After
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <img
                          src={afterImagePreview}
                          alt="After"
                          style={{
                            width: '100%',
                            height: 300,
                            objectFit: 'cover',
                            borderRadius: 8
                          }}
                        />
                      </Box>
                      <Typography variant="body2">
                        {caption || 'After completion'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    startIcon={<ArrowBack />}
                    onClick={() => setActiveStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CloudUpload />}
                    onClick={() => setUploadDialogOpen(true)}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Submit for Approval'}
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={uploadDialogOpen} onClose={() => !uploading && setUploadDialogOpen(false)}>
          <DialogTitle>Confirm Upload</DialogTitle>
          <DialogContent>
            <Typography variant="body1" paragraph>
              Are you sure you want to submit these images for admin approval?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Once submitted, the images will be reviewed by an admin before appearing in the public gallery.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmit}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Confirm Upload'}
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default UploadImages;