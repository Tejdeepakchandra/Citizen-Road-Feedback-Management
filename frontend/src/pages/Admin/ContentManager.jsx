import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  Pending,
  Image,
  Article,
  Campaign,
  Refresh,
  MoreVert,
  Upload,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { galleryAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const ContentManager = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [transformations, setTransformations] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    beforeImage: '',
    afterImage: '',
    location: '',
    publish: false,
  });
  const theme = useTheme();

  const tabs = [
    { label: 'Transformations', value: 'transformations', icon: <Image /> },
    { label: 'Announcements', value: 'announcements', icon: <Campaign /> },
    { label: 'Banners', value: 'banners', icon: <Article /> },
  ];

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 0) {
        const response = await galleryAPI.getTransformations();
        setTransformations(response.data.transformations || []);
      } else if (activeTab === 1) {
        // Fetch announcements (mock data for now)
        setAnnouncements([
          {
            id: 1,
            title: 'System Maintenance',
            content: 'The system will be undergoing maintenance on Sunday.',
            publishDate: new Date(),
            status: 'published',
          },
          {
            id: 2,
            title: 'New Features',
            content: 'Check out the new reporting features!',
            publishDate: new Date(Date.now() - 86400000),
            status: 'draft',
          },
        ]);
      }
    } catch (error) {
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenDialog = (content = null) => {
    if (content) {
      setSelectedContent(content);
      setFormData({
        title: content.title,
        description: content.description,
        category: content.category,
        beforeImage: content.beforeImage,
        afterImage: content.afterImage,
        location: content.location,
        publish: content.status === 'published',
      });
    } else {
      setSelectedContent(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        beforeImage: '',
        afterImage: '',
        location: '',
        publish: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedContent(null);
  };

  const handleFormSubmit = async () => {
    try {
      if (selectedContent) {
        // Update existing
        await galleryAPI.updateTransformation(selectedContent._id, formData);
        toast.success('Transformation updated successfully');
      } else {
        // Create new
        await galleryAPI.createTransformation(formData);
        toast.success('Transformation created successfully');
      }
      
      fetchContent();
      handleCloseDialog();
    } catch (error) {
      toast.error('Failed to save transformation');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await galleryAPI.deleteTransformation(id);
        toast.success('Item deleted successfully');
        fetchContent();
      } catch (error) {
        toast.error('Failed to delete item');
      }
    }
  };

  const handleApprove = async (id) => {
    try {
      await galleryAPI.approveTransformation(id);
      toast.success('Transformation approved');
      fetchContent();
    } catch (error) {
      toast.error('Failed to approve transformation');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      pothole: theme.palette.warning.main,
      drainage: theme.palette.primary.main,
      lighting: theme.palette.secondary.main,
      garbage: theme.palette.error.main,
      greenery: theme.palette.success.main,
    };
    return colors[category] || theme.palette.grey[500];
  };

  const categories = [
    { value: 'pothole', label: 'Pothole Repair' },
    { value: 'drainage', label: 'Drainage Solutions' },
    { value: 'lighting', label: 'Lighting Improvements' },
    { value: 'garbage', label: 'Garbage Cleanup' },
    { value: 'greenery', label: 'Greenery & Beautification' },
    { value: 'road_markings', label: 'Road Markings' },
  ];

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <LinearProgress sx={{ width: '100%' }} />
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" fontWeight={800}>
              Content Manager
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Add New
            </Button>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Manage homepage content, transformations, and announcements
          </Typography>
        </Box>

        {/* Tabs */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 0 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  py: 2,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                },
              }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  icon={tab.icon}
                  iconPosition="start"
                  label={tab.label}
                />
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Content Section */}
        {activeTab === 0 && (
          <Box>
            <Grid container spacing={3}>
              {transformations.map((transformation) => (
                <Grid item xs={12} md={6} lg={4} key={transformation._id}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card>
                      <CardContent>
                        {/* Image Preview */}
                        <Box sx={{ position: 'relative', height: 200, mb: 2, borderRadius: 2, overflow: 'hidden' }}>
                          <Box
                            component="img"
                            src={transformation.afterImage}
                            alt="After"
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '50%',
                              height: '100%',
                              overflow: 'hidden',
                              borderRight: `2px solid ${theme.palette.primary.main}`,
                            }}
                          >
                            <Box
                              component="img"
                              src={transformation.beforeImage}
                              alt="Before"
                              sx={{
                                width: '200%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          </Box>
                          
                          {/* Status Badge */}
                          <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                            <Chip
                              label={transformation.status}
                              size="small"
                              color={transformation.status === 'published' ? 'success' : 'warning'}
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                        </Box>

                        {/* Content */}
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          {transformation.title}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {transformation.description.substring(0, 100)}...
                        </Typography>

                        {/* Meta Information */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Chip
                            label={transformation.category}
                            size="small"
                            sx={{
                              backgroundColor: getCategoryColor(transformation.category) + '20',
                              color: getCategoryColor(transformation.category),
                            }}
                          />
                          
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(transformation.createdAt), 'MMM dd, yyyy')}
                          </Typography>
                        </Box>

                        {/* Stats */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Views
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {transformation.views || 0}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Likes
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {transformation.likes || 0}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Improvement
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {transformation.improvementScore || 0}%
                            </Typography>
                          </Box>
                        </Box>

                        {/* Actions */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(transformation)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(transformation._id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                          {transformation.status !== 'published' && (
                            <Button
                              size="small"
                              startIcon={<CheckCircle />}
                              onClick={() => handleApprove(transformation._id)}
                              sx={{ ml: 'auto' }}
                            >
                              Publish
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {transformations.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Image sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No transformations yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add before/after images to showcase completed work
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Card>
            <CardContent>
              <Grid container spacing={3}>
                {announcements.map((announcement) => (
                  <Grid item xs={12} md={6} key={announcement.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" fontWeight={600}>
                            {announcement.title}
                          </Typography>
                          <Chip
                            label={announcement.status}
                            size="small"
                            color={announcement.status === 'published' ? 'success' : 'warning'}
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {announcement.content}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(announcement.publishDate), 'PPpp')}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton size="small">
                              <Edit />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <Delete />
                            </IconButton>
                            <Switch
                              size="small"
                              checked={announcement.status === 'published'}
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            <Typography variant="h6" fontWeight={600}>
              {selectedContent ? 'Edit Transformation' : 'Add New Transformation'}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={3}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.value} value={category.value}>
                        {category.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Before Image URL"
                  value={formData.beforeImage}
                  onChange={(e) => setFormData({ ...formData, beforeImage: e.target.value })}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="After Image URL"
                  value={formData.afterImage}
                  onChange={(e) => setFormData({ ...formData, afterImage: e.target.value })}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.publish}
                      onChange={(e) => setFormData({ ...formData, publish: e.target.checked })}
                    />
                  }
                  label="Publish immediately"
                />
              </Grid>
              
              {formData.beforeImage && formData.afterImage && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Preview:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <Typography variant="caption" color="error" gutterBottom>
                        BEFORE
                      </Typography>
                      <Box
                        component="img"
                        src={formData.beforeImage}
                        alt="Before Preview"
                        sx={{
                          width: '100%',
                          height: 150,
                          objectFit: 'cover',
                          borderRadius: 2,
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <Typography variant="caption" color="success" gutterBottom>
                        AFTER
                      </Typography>
                      <Box
                        component="img"
                        src={formData.afterImage}
                        alt="After Preview"
                        sx={{
                          width: '100%',
                          height: 150,
                          objectFit: 'cover',
                          borderRadius: 2,
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleFormSubmit} variant="contained">
              {selectedContent ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default ContentManager;