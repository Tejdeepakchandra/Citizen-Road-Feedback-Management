import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Alert,
  Grid,
  InputAdornment,
  Chip,
  useTheme,
} from '@mui/material';
import { 
  ArrowBack,
  CloudUpload,
  LocationOn,
  Description,
  Category,
  PriorityHigh,
} from '@mui/icons-material';
import { useAuth } from '../../../context/AuthContext';
import { reportAPI } from '../../../services/api';
import { toast } from 'react-hot-toast';
import MapPicker from '../../../components/common/MapPicker';

const categories = [
  { value: 'pothole', label: 'Pothole', icon: '🕳️' },
  { value: 'drainage', label: 'Drainage Issue', icon: '🌊' },
  { value: 'lighting', label: 'Street Lighting', icon: '💡' },
  { value: 'garbage', label: 'Garbage', icon: '🗑️' },
  { value: 'signage', label: 'Signage', icon: '🪧' },
  { value: 'other', label: 'Other', icon: '❓' },
];

const severities = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'high', label: 'High', color: 'error' },
  { value: 'critical', label: 'Critical', color: 'error' },
];

const NewReport = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'pothole',
    severity: 'medium',
    address: '',
    landmark: '',
    ward: '',
    zone: '',
  });
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLocationChange = (location) => {
    setFormData(prev => ({
      ...prev,
      address: location.address
    }));
    setCoordinates(location.coordinates);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.address.trim()) newErrors.address = 'Location address is required';
    if (!coordinates.lat || !coordinates.lng) newErrors.location = 'Please select a location on the map';
    if (images.length === 0) newErrors.images = 'At least one image is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to submit a report');
      navigate('/login');
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      Object.values(validationErrors).forEach(error => {
        toast.error(error);
      });
      return;
    }

    setLoading(true);
    try {
      // Create FormData
      const formDataObj = new FormData();
      
      // Append text fields
      formDataObj.append('title', formData.title);
      formDataObj.append('description', formData.description);
      formDataObj.append('category', formData.category);
      formDataObj.append('severity', formData.severity);
      formDataObj.append('address', formData.address);
      formDataObj.append('landmark', formData.landmark);
      formDataObj.append('ward', formData.ward);
      formDataObj.append('zone', formData.zone);
      formDataObj.append('location', JSON.stringify({
        coordinates,
        address: formData.address,
        landmark: formData.landmark,
        ward: formData.ward,
        zone: formData.zone
      }));
      
      // Append images
      images.forEach((image, index) => {
        formDataObj.append('images', image);
      });

      const response = await reportAPI.createReport(formDataObj);
      toast.success('Report submitted successfully!');
      navigate('/reports/my-reports');
    } catch (error) {
      console.error('Error creating report:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create report. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mt: 2 }}>
          Please login to submit a report.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button 
        startIcon={<ArrowBack />}
        onClick={() => navigate('/reports/my-reports')}
        sx={{ mb: 3 }}
      >
        Back to Reports
      </Button>

      <Card>
        <CardHeader
          title={
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudUpload /> Submit a Road Issue Report
            </Typography>
          }
          subheader="Help us make roads safer by reporting issues"
        />

        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Title */}
              <Grid item xs={12}>
                <TextField
                  label="Report Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  fullWidth
                  placeholder="e.g., Large pothole on Main Street"
                  error={!!errors.title}
                  helperText={errors.title}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Description />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Describe the issue in detail. Include exact location details, time of observation, and any safety concerns."
                  error={!!errors.description}
                  helperText={errors.description}
                  required
                />
              </Grid>

              {/* Category & Severity */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  select
                  fullWidth
                  error={!!errors.category}
                  helperText={errors.category}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Category />
                      </InputAdornment>
                    ),
                  }}
                >
                  {categories.map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Severity"
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  select
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PriorityHigh />
                      </InputAdornment>
                    ),
                  }}
                >
                  {severities.map(sev => (
                    <MenuItem key={sev.value} value={sev.value}>
                      <Chip
                        label={sev.label}
                        size="small"
                        color={sev.color}
                        sx={{ mr: 1 }}
                      />
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Location */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn /> Location
                </Typography>
                
                {/* Map Picker */}
                <Box sx={{ mb: 2 , height: 300 }}>
                  <MapPicker
                    onLocationSelect={handleLocationChange}
                    initialLocation={{
                      address: formData.address,
                      coordinates
                    }}
                  
                  />
                  {errors.location && (
                    <Typography color="error" variant="caption">
                      {errors.location}
                    </Typography>
                  )}
                </Box>

                {/* Address Details */}
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Full Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      fullWidth
                      placeholder="123 Main Street, City, State"
                      error={!!errors.address}
                      helperText={errors.address || 'Enter the exact address'}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Landmark (Optional)"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleChange}
                      fullWidth
                      placeholder="Near shopping mall, etc."
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Ward (Optional)"
                      name="ward"
                      value={formData.ward}
                      onChange={handleChange}
                      fullWidth
                      placeholder="Ward number"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Zone (Optional)"
                      name="zone"
                      value={formData.zone}
                      onChange={handleChange}
                      fullWidth
                      placeholder="Zone name"
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Image Upload */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudUpload /> Upload Images
                </Typography>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    fullWidth
                  >
                    Select Images (Max 5)
                  </Button>
                </label>
                {images.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Selected {images.length} image(s)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      {images.map((image, index) => (
                        <Chip
                          key={index}
                          label={image.name}
                          size="small"
                          onDelete={() => {
                            const newImages = [...images];
                            newImages.splice(index, 1);
                            setImages(newImages);
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                {errors.images && (
                  <Typography color="error" variant="caption">
                    {errors.images}
                  </Typography>
                )}
              </Grid>

              {/* Submit Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/reports/my-reports')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
                    sx={{
                      background: theme => theme.palette.mode === 'dark' 
                        ? 'linear-gradient(135deg, #818CF8 0%, #38BDF8 100%)'
                        : 'linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%)',
                      minWidth: 150,
                    }}
                  >
                    {loading ? 'Submitting...' : 'Submit Report'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default NewReport;