import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import {
  LocationOn,
  Schedule,
  ArrowBack,
  Delete,
  CalendarToday,
  PhotoCamera,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { staffAPI, reportAPI } from '../../services/api';
import { format, parseISO } from 'date-fns';

const UpdateProgress = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const locationState = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [task, setTask] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    status: 'in_progress',
    progress: 0,
    description: '',
    completionNotes: '',
  });
  
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  // Dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  useEffect(() => {
    console.log('Component mounted, ID:', id);
    fetchTaskDetails();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching task with ID:', id);
      
      // Check if task data was passed from navigation
      if (locationState.state?.task) {
        console.log('Task data passed from navigation:', locationState.state.task);
        const taskData = locationState.state.task;
        initializeTaskData(taskData);
        return;
      }
      
      // Fetch from report API
      try {
        const response = await reportAPI.getReportById(id);
        console.log('API response:', response.data);
        
        if (response.data) {
          initializeTaskData(response.data);
          console.log('Task loaded from API:', response.data);
        } else {
          throw new Error('Invalid API response');
        }
      } catch (apiError) {
        console.warn('Report API failed:', apiError.message);
        setError('Failed to load task details. Please try again.');
      }
      
    } catch (err) {
      console.error('Error in fetchTaskDetails:', err);
      setError('Failed to load task details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initializeTaskData = (taskData) => {
    const currentProgress = taskData.progress !== undefined 
      ? taskData.progress 
      : calculateProgressFromStatus(taskData.status);
    
    // Ensure location has proper structure
    let location = taskData.location || { address: 'Unknown Location' };
    if (!location.coordinates) {
      location.coordinates = {
        type: 'Point',
        coordinates: [0, 0]
      };
    } else if (location.coordinates && !location.coordinates.coordinates) {
      location.coordinates.coordinates = [0, 0];
    }
    
    const processedTask = {
      ...taskData,
      _id: taskData._id || id,
      title: taskData.title || 'Untitled Task',
      category: taskData.category || taskData.reportCategory || 'General',
      severity: taskData.severity || 'Medium',
      status: taskData.status || 'assigned',
      priority: taskData.priority || 'medium',
      description: taskData.description || 'No description available.',
      location: location,
      estimatedCompletion: taskData.dueDate || taskData.estimatedCompletion || 
                          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: taskData.createdAt || new Date().toISOString(),
      progress: currentProgress,
      images: taskData.images || [],
      beforeImages: taskData.beforeImages || [],
      assignedTo: taskData.assignedTo?._id || user?._id || 'staff-123'
    };
    
    setTask(processedTask);
    
    setFormData({
      status: taskData.status === 'completed' ? 'completed' : 'in_progress',
      progress: currentProgress,
      description: '',
      completionNotes: '',
    });
  };

  const calculateProgressFromStatus = (status) => {
    switch (status) {
      case 'pending': return 0;
      case 'assigned': return 25;
      case 'in_progress': return 50;
      case 'completed': return 100;
      default: return 0;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProgressChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      progress: newValue,
      status: newValue === 100 ? 'completed' : 'in_progress',
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [...uploadedImages, ...files];
    setUploadedImages(newImages);
    
    const newPreviews = [...imagePreviews];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push({ file, preview: e.target.result });
        setImagePreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const prepareTaskDataForUpdate = () => {
    // Prepare task data with required location structure
    const baseData = {
      progress: formData.progress,
      description: formData.description || `Progress updated to ${formData.progress}%`,
      status: formData.progress === 100 ? 'completed' : 'in_progress',
      // Include location data to avoid validation errors
      location: task?.location || {
        address: 'Unknown Location',
        coordinates: {
          type: 'Point',
          coordinates: [0, 0]
        }
      }
    };
    
    // Add completion notes if completing
    if (formData.progress === 100) {
      baseData.completionNotes = formData.completionNotes || '';
      baseData.completedAt = new Date().toISOString();
    }
    
    return baseData;
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      console.log('Submitting progress update:', formData);
      
      // Prepare the data
      const updateData = prepareTaskDataForUpdate();
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('progress', updateData.progress);
      formDataToSend.append('description', updateData.description);
      formDataToSend.append('status', updateData.status);
      formDataToSend.append('location', JSON.stringify(updateData.location));
      
      // Add uploaded images
      uploadedImages.forEach((image) => {
        formDataToSend.append('images', image);
      });
      
      // Use reportAPI.updateProgress
      const response = await reportAPI.updateProgress(id, formDataToSend);
      
      console.log('Progress update successful:', response.data);
      
      setSuccess(true);
      sessionStorage.setItem('refreshTasks', 'true');
      sessionStorage.setItem('lastUpdatedTask', id);
      
      setTimeout(() => {
        navigate('/staff/tasks');
      }, 2000);
      
    } catch (err) {
      console.error('Failed to update progress:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Failed to update progress. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
      setConfirmDialogOpen(false);
    }
  };

  const handleCompleteTask = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      console.log('Completing task:', formData);
      
      // Prepare the data with required location structure
      const completionData = {
        description: formData.description || 'Task completed',
        completionNotes: formData.completionNotes || '',
        // Ensure location is included
        location: task?.location || {
          address: task?.location?.address || 'Unknown Location',
          coordinates: {
            type: 'Point',
            coordinates: [0, 0]
          }
        }
      };
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('description', completionData.description);
      formDataToSend.append('completionNotes', completionData.completionNotes);
      formDataToSend.append('location', JSON.stringify(completionData.location));
      
      // Add uploaded images
      uploadedImages.forEach((image) => {
        formDataToSend.append('images', image);
      });
      
      // Use reportAPI.completeReport with proper parameters
      const response = await reportAPI.completeReport(id, completionData, formDataToSend);
      
      console.log('Task completion successful:', response.data);
      
      setSuccess(true);
      sessionStorage.setItem('refreshTasks', 'true');
      sessionStorage.setItem('refreshAdminReports', 'true');
      sessionStorage.setItem('lastCompletedTask', id);
      
      setTimeout(() => {
        navigate('/staff/tasks');
      }, 2000);
      
    } catch (err) {
      console.error('Failed to complete task:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to complete task. Please try again.';
      setError(errorMessage);
      
      // Special handling for location validation error
      if (errorMessage.includes('location.coordinates.coordinates')) {
        setError(`Location validation error. Please ensure the task has valid location data. Technical: ${errorMessage}`);
      }
    } finally {
      setSubmitting(false);
      setCompleteDialogOpen(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFA726';
      case 'assigned': return '#2196F3';
      case 'in_progress': return '#9C27B0';
      case 'completed': return '#4CAF50';
      case 'resolved': return '#607D8B';
      default: return '#9E9E9E';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const steps = [
    'Update Progress',
    'Add Work Details',
    formData.progress === 100 ? 'Complete Task' : 'Review & Submit',
  ];

  // If still loading, show loading
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography>Loading task details...</Typography>
      </Box>
    );
  }

  // If no task data is available
  if (!task && !loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          No task data available. Redirecting to tasks...
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/staff/tasks')}
        >
          Back to Tasks
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/staff/tasks')}
            sx={{ mb: 2 }}
          >
            Back to Tasks
          </Button>
          
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Update Task Progress
          </Typography>
          
          {task && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {task.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {task.category} • {task.severity}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={task.status.replace('_', ' ')}
                      size="small"
                      sx={{
                        backgroundColor: alpha(getStatusColor(task.status), 0.1),
                        color: getStatusColor(task.status),
                        border: `1px solid ${getStatusColor(task.status)}`,
                      }}
                    />
                    <Chip
                      label={task.priority}
                      size="small"
                      sx={{
                        backgroundColor: alpha(getPriorityColor(task.priority), 0.1),
                        color: getPriorityColor(task.priority),
                        border: `1px solid ${getPriorityColor(task.priority)}`,
                      }}
                    />
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                  {task.description}
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {task.location?.address || 'No address'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {task.estimatedCompletion 
                          ? format(parseISO(task.estimatedCompletion), 'MMM d, yyyy')
                          : 'No deadline'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarToday fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        Current Progress: {task.progress}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhotoCamera fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {(task.images?.length || 0) + (task.beforeImages?.length || 0)} images
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                {/* Current Progress Bar */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Current Progress: {task.progress}%
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ 
                        height: 8, 
                        backgroundColor: '#e0e0e0', 
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}>
                        <Box 
                          sx={{ 
                            height: '100%', 
                            width: `${task.progress}%`,
                            backgroundColor: task.progress === 100 ? '#4CAF50' : 
                                          task.progress >= 70 ? '#FF9800' : '#2196F3',
                            transition: 'width 0.3s ease'
                          }} 
                        />
                      </Box>
                    </Box>
                    <Typography variant="caption" fontWeight="bold">
                      {task.progress}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Success Message */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Task progress updated successfully! Redirecting to tasks...
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stepper */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Step 1: Update Progress */}
            <Step>
              <StepLabel>Update Progress</StepLabel>
              <StepContent>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Current: {task?.progress || 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        New: {formData.progress}%
                      </Typography>
                    </Box>
                    <Slider
                      value={formData.progress}
                      onChange={handleProgressChange}
                      aria-labelledby="progress-slider"
                      valueLabelDisplay="auto"
                      defaultValue={task?.progress || 0}
                      step={5}
                      marks={[
                        { value: 0, label: '0%' },
                        { value: 25, label: '25%' },
                        { value: 50, label: '50%' },
                        { value: 75, label: '75%' },
                        { value: 100, label: '100%' },
                      ]}
                      sx={{
                        color: formData.progress === 100 ? 'success.main' : 
                               formData.progress >= 70 ? 'warning.main' : 'primary.main',
                      }}
                    />
                    {formData.progress === 100 && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Setting progress to 100% will mark the task as completed and send it for admin review.
                      </Alert>
                    )}
                  </Box>

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      label="Status"
                    >
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="completed" disabled={formData.progress < 100}>
                        Completed {formData.progress < 100 && '(Requires 100% progress)'}
                      </MenuItem>
                    </Select>
                  </FormControl>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                    >
                      Next: Add Details
                    </Button>
                  </Box>
                </Box>
              </StepContent>
            </Step>

            {/* Step 2: Add Work Details */}
            <Step>
              <StepLabel>Add Work Details</StepLabel>
              <StepContent>
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    name="description"
                    label="Work Description"
                    placeholder="Describe the work you've completed..."
                    value={formData.description}
                    onChange={handleInputChange}
                    sx={{ mb: 3 }}
                    required
                    helperText="Required field"
                  />

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Upload Work Images (Optional)
                    </Typography>
                    
                    <Box
                      sx={{
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        backgroundColor: 'action.hover',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'action.selected',
                        },
                      }}
                    >
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="upload-images"
                        multiple
                        type="file"
                        onChange={handleImageUpload}
                      />
                      <label htmlFor="upload-images">
                        <Button
                          component="span"
                          variant="outlined"
                          startIcon={<PhotoCamera />}
                        >
                          Select Images
                        </Button>
                      </label>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Click to upload images (Optional)
                      </Typography>
                    </Box>

                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        {imagePreviews.map((preview, index) => (
                          <Grid item xs={6} sm={4} md={3} key={index}>
                            <Card
                              sx={{
                                position: 'relative',
                                borderRadius: 2,
                                overflow: 'hidden',
                              }}
                            >
                              <Box
                                component="img"
                                src={preview.preview}
                                alt={`Preview ${index + 1}`}
                                sx={{
                                  width: '100%',
                                  height: 100,
                                  objectFit: 'cover',
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => removeImage(index)}
                                sx={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                  backgroundColor: 'error.main',
                                  color: 'white',
                                  '&:hover': {
                                    backgroundColor: 'error.dark',
                                  },
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={handleBack}>
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!formData.description.trim()}
                    >
                      {formData.progress === 100 ? 'Next: Complete Task' : 'Next: Review & Submit'}
                    </Button>
                  </Box>
                </Box>
              </StepContent>
            </Step>

            {/* Step 3: Review & Submit or Complete Task */}
            <Step>
              <StepLabel>
                {formData.progress === 100 ? 'Complete Task' : 'Review & Submit'}
              </StepLabel>
              <StepContent>
                <Box sx={{ mt: 2 }}>
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 2 }}>
                      Review Your Update
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Status
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {formData.status.replace('_', ' ')}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Progress Change
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {task?.progress || 0}% → {formData.progress}%
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Description
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {formData.description || 'No description provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Images to Upload
                        </Typography>
                        <Typography variant="body2">
                          {uploadedImages.length} image(s)
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>

                  {formData.progress === 100 && (
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      name="completionNotes"
                      label="Completion Notes (Optional)"
                      placeholder="Add any final notes about the completed work..."
                      value={formData.completionNotes}
                      onChange={handleInputChange}
                      sx={{ mb: 3 }}
                    />
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={handleBack}>
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      color={formData.progress === 100 ? 'success' : 'primary'}
                      onClick={() => {
                        if (formData.progress === 100) {
                          setCompleteDialogOpen(true);
                        } else {
                          setConfirmDialogOpen(true);
                        }
                      }}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                      ) : formData.progress === 100 ? (
                        'Mark as Completed'
                      ) : (
                        'Submit Progress Update'
                      )}
                    </Button>
                  </Box>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </Paper>

        {/* Confirmation Dialog for Progress Update */}
        <Dialog
          open={confirmDialogOpen}
          onClose={() => !submitting && setConfirmDialogOpen(false)}
        >
          <DialogTitle>Confirm Progress Update</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Are you sure you want to update the progress from {task?.progress || 0}% to {formData.progress}%?
            </Typography>
            <Alert severity="info">
              This will update the task progress. The task will remain in "In Progress" status.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setConfirmDialogOpen(false)} 
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Confirm Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirmation Dialog for Task Completion */}
        <Dialog
          open={completeDialogOpen}
          onClose={() => !submitting && setCompleteDialogOpen(false)}
        >
          <DialogTitle>Mark Task as Completed</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Are you sure you want to mark this task as completed?
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                Important: This will send the task to admin for review.
              </Typography>
              <Typography variant="caption">
                Once marked as completed, an admin must review and approve before it's officially closed.
              </Typography>
            </Alert>
            {task && !task.location?.coordinates?.coordinates && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <strong>Warning:</strong> This task is missing location coordinates. The update may fail.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setCompleteDialogOpen(false)} 
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleCompleteTask}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Mark as Completed'}
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default UpdateProgress;