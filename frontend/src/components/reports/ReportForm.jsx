import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  CloudUpload,
  LocationOn,
  Description,
  Category,
  PriorityHigh,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import MapPicker from '../common/MapPicker';
import ImageUploader from '../common/ImageUploader';
import { reportAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const categories = [
  { value: 'pothole', label: 'Pothole Repair', icon: '🕳️' },
  { value: 'drainage', label: 'Drainage Issue', icon: '🌊' },
  { value: 'lighting', label: 'Street Lighting', icon: '💡' },
  { value: 'garbage', label: 'Garbage/Sanitation', icon: '🗑️' },
  { value: 'signboard', label: 'Signboard/Signage', icon: '🪧' },
  { value: 'road_markings', label: 'Road Markings', icon: '🛣️' },
  { value: 'sidewalk', label: 'Sidewalk Damage', icon: '🚶' },
  { value: 'other', label: 'Other Issues', icon: '❓' },
];

const severities = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'high', label: 'High', color: 'error' },
];

const schema = yup.object({
  title: yup.string().required('Title is required').min(5, 'Title must be at least 5 characters'),
  description: yup.string().required('Description is required').min(20, 'Description must be at least 20 characters'),
  category: yup.string().required('Category is required'),
  severity: yup.string().required('Severity is required'),
  location: yup.object({
    address: yup.string().required('Address is required'),
    coordinates: yup.object({
      lat: yup.number().required(),
      lng: yup.number().required(),
    }),
  }),
  images: yup.array().min(1, 'At least one image is required'),
});

const ReportForm = () => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [images, setImages] = useState([]);
  const theme = useTheme();
  const { user } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      severity: 'medium',
      location: {
        address: '',
        coordinates: null,
      },
      images: [],
    },
  });

  const onSubmit = async (data) => {
    if (!user) {
      toast.error('Please login to submit a report');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('severity', data.severity);
      formData.append('location', JSON.stringify(data.location));
      
      images.forEach((image, index) => {
        formData.append('images', image.file);
      });

      await reportAPI.createReport(formData);
      
      toast.success('Report submitted successfully!');
      // Reset form
      setImages([]);
      setLocation(null);
      // Navigate to reports list
      window.location.href = '/reports/my-reports';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
    setValue('location', selectedLocation);
  };

  const handleImageUpload = (uploadedImages) => {
    setImages(uploadedImages);
    setValue('images', uploadedImages.map(img => img.url));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            Report a Road Issue
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Help us make roads safer by reporting issues. Provide as much detail as possible.
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Title */}
              <Grid item xs={12}>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Issue Title"
                      fullWidth
                      error={!!errors.title}
                      helperText={errors.title?.message}
                      placeholder="Brief description of the issue"
                      InputProps={{
                        startAdornment: <Description sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Detailed Description"
                      fullWidth
                      multiline
                      rows={4}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                      placeholder="Describe the issue in detail. Include exact location details, time of observation, and any safety concerns."
                    />
                  )}
                />
              </Grid>

              {/* Category & Severity */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.category}>
                      <InputLabel>Category</InputLabel>
                      <Select
                        {...field}
                        label="Category"
                        startAdornment={<Category sx={{ mr: 1 }} />}
                      >
                        {categories.map((cat) => (
                          <MenuItem key={cat.value} value={cat.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span>{cat.icon}</span>
                              <span>{cat.label}</span>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="severity"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Severity Level</InputLabel>
                      <Select
                        {...field}
                        label="Severity Level"
                        startAdornment={<PriorityHigh sx={{ mr: 1 }} />}
                      >
                        {severities.map((sev) => (
                          <MenuItem key={sev.value} value={sev.value}>
                            <Chip
                              label={sev.label}
                              size="small"
                              color={sev.color}
                              sx={{ mr: 1 }}
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Location */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  <LocationOn sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Location
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={watch('location.address') || ''}
                    onChange={(e) =>
                      setValue('location.address', e.target.value)
                    }
                    error={!!errors.location?.address}
                    helperText={errors.location?.address?.message}
                    placeholder="Enter exact address or click on map"
                  />
                </Box>
                <Box sx={{ height: 300, borderRadius: 2, overflow: 'hidden' }}>
                  <MapPicker
                    onLocationSelect={handleLocationSelect}
                    initialLocation={location}
                  />
                </Box>
                {errors.location?.coordinates && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    Please select a location on the map
                  </Alert>
                )}
              </Grid>

              {/* Image Upload */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  <CloudUpload sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Upload Images
                </Typography>
                <ImageUploader
                  onUpload={handleImageUpload}
                  maxFiles={5}
                  accept="image/*"
                  value={images}
                />
                {errors.images && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {errors.images.message}
                  </Alert>
                )}
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => window.history.back()}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                      minWidth: 120,
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Submit Report'
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReportForm;