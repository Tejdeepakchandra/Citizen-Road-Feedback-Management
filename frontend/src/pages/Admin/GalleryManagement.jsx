// src/pages/Admin/GalleryManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
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
  Tabs,
  Tab,
  Badge,
  Avatar,
  Divider,
  Switch,
  FormControlLabel,
  Menu,
  MenuItem,
  Tooltip,
  Fab,
  Pagination,
} from '@mui/material';
import {
  Visibility,
  Star,
  StarBorder,
  Delete,
  FilterList,
  Refresh,
  Search,
  Download,
  Category,
  ThumbUp,
  Share,
  MoreVert,
  TrendingUp,
  GridView,
  List,
  Sort,
  Close,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI, galleryAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const GalleryManagement = () => {
  const [loading, setLoading] = useState(true);
  const [galleryItems, setGalleryItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(12);
  const theme = useTheme();

  const tabs = [
    { label: 'All', value: 'all' },
    { label: 'Featured', value: 'featured' },
    { label: 'Popular', value: 'popular' },
  ];

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Most Liked', value: 'likes' },
    { label: 'Most Viewed', value: 'views' },
  ];

  useEffect(() => {
    fetchGalleryItems();
    fetchCategories();
  }, [page, sortBy]);

  useEffect(() => {
    filterItems();
  }, [galleryItems, searchTerm, selectedCategory, tabValue, sortBy]);

  const fetchGalleryItems = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: itemsPerPage,
        sort: sortBy,
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(tabValue === 1 && { featured: true }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await galleryAPI.getApprovedGallery(params);
      console.log('Gallery items response:', response.data);
      
      setGalleryItems(response.data.data || []);
      setTotalPages(response.data.pagination?.pages || 1);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(
        (response.data.data || []).map(item => item.report?.category)
      )].filter(Boolean);
      
      if (uniqueCategories.length > 0) {
        setCategories(uniqueCategories);
      }
      
    } catch (error) {
      toast.error('Failed to load gallery items');
      console.error('Fetch gallery error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // You might want to create a separate endpoint for categories
      const response = await galleryAPI.getGalleryByCategory('pothole');
      // Extract categories from response if needed
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filterItems = () => {
    let filtered = [...galleryItems];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.report?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.report?.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.afterImage?.caption?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.report?.category === selectedCategory);
    }

    // Filter by tab
    if (tabValue === 1) { // Featured
      filtered = filtered.filter(item => item.featured);
    } else if (tabValue === 2) { // Popular
      filtered = filtered.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.approvedAt || b.uploadedAt) - new Date(a.approvedAt || a.uploadedAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.approvedAt || a.uploadedAt) - new Date(b.approvedAt || b.uploadedAt));
        break;
      case 'likes':
        filtered.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
        break;
      case 'views':
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
    }

    setFilteredItems(filtered);
  };

  const handleFeatureToggle = async (itemId, currentlyFeatured) => {
    try {
      const response = await adminAPI.featureImage(itemId, !currentlyFeatured);
      toast.success(currentlyFeatured ? 'Removed from featured' : 'Added to featured');
      fetchGalleryItems(); // Refresh list
      setFeatureDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update feature status');
      console.error(error);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    try {
      const response = await adminAPI.deleteGalleryItem(selectedItem._id);
      toast.success('Gallery item deleted successfully');
      setGalleryItems(prev => prev.filter(item => item._id !== selectedItem._id));
      setDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchGalleryItems(); // Refresh
    } catch (error) {
      toast.error('Failed to delete gallery item');
      console.error(error);
    }
  };

  const handleMenuOpen = (event, itemId) => {
    setMenuAnchor(event.currentTarget);
    setSelectedMenuId(itemId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedMenuId(null);
  };
  const handleViewClick = (item) => {
  console.log('Viewing item:', item);
  console.log('Before image:', item.beforeImage);
  console.log('After image:', item.afterImage);
  setSelectedItem(item);
  setDetailDialogOpen(true);
};

  const exportGallery = async () => {
    try {
      const response = await adminAPI.exportReports({ type: 'gallery' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gallery-data-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Gallery data exported successfully');
    } catch (error) {
      toast.error('Failed to export gallery data');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Gallery Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage all approved transformation images in the public gallery
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchGalleryItems}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={exportGallery}
              >
                Export
              </Button>
            </Box>
          </Box>

          {/* Stats */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
                <Typography variant="h4" fontWeight={700} color="primary">
                  {galleryItems.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Items
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {galleryItems.filter(item => item.featured).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Featured
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
                <Typography variant="h4" fontWeight={700} color="warning.main">
                  {categories.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Categories
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
                <Typography variant="h4" fontWeight={700} color="info.main">
                  {galleryItems.reduce((sum, item) => sum + (item.likeCount || 0), 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Likes
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Filters & Controls */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search gallery..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: searchTerm && (
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <Close />
                    </IconButton>
                  )
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                size="small"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                size="small"
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Grid View">
                  <IconButton 
                    onClick={() => setViewMode('grid')}
                    color={viewMode === 'grid' ? 'primary' : 'default'}
                  >
                    <GridView />
                  </IconButton>
                </Tooltip>
                <Tooltip title="List View">
                  <IconButton 
                    onClick={() => setViewMode('list')}
                    color={viewMode === 'list' ? 'primary' : 'default'}
                  >
                    <List />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>

          {/* Tabs */}
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mt: 2 }}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.value}
                label={tab.label}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Paper>

        {/* Gallery Grid/List */}
        {filteredItems.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body1">
              No gallery items found
            </Typography>
            <Typography variant="body2">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search filters' 
                : 'No transformation images have been approved yet'}
            </Typography>
          </Alert>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <Grid container spacing={3}>
                <AnimatePresence>
                  {filteredItems.map((item) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                      <GalleryCard 
                        item={item} 
                        onView={() => handleViewClick(item)}
                        onFeatureToggle={(featured) => handleFeatureToggle(item._id, featured)}
                        onMenuOpen={handleMenuOpen}
                        selectedMenuId={selectedMenuId}
                        menuAnchor={menuAnchor}
                        onMenuClose={handleMenuClose}
                        onDelete={() => {
                          setSelectedItem(item);
                          setDeleteDialogOpen(true);
                        }}
                      />
                    </Grid>
                  ))}
                </AnimatePresence>
              </Grid>
            ) : (
              <Box>
                {filteredItems.map((item) => (
                  <GalleryListItem 
                    key={item._id}
                    item={item}
                    onView={() => {
                      setSelectedItem(item);
                      setDetailDialogOpen(true);
                    }}
                    onFeatureToggle={(featured) => handleFeatureToggle(item._id, featured)}
                    onMenuOpen={handleMenuOpen}
                    selectedMenuId={selectedMenuId}
                    menuAnchor={menuAnchor}
                    onMenuClose={handleMenuClose}
                    onDelete={() => {
                      setSelectedItem(item);
                      setDeleteDialogOpen(true);
                    }}
                  />
                ))}
              </Box>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(event, value) => setPage(value)}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}

        {/* Detail Dialog */}
       {selectedItem && detailDialogOpen && (
  <GalleryDetailDialog
    open={detailDialogOpen}
    onClose={() => setDetailDialogOpen(false)}
    item={selectedItem}
    onFeatureToggle={(featured) => handleFeatureToggle(selectedItem._id, featured)}
    onDelete={() => {
      setDetailDialogOpen(false);
      setDeleteDialogOpen(true);
    }}
  />
)}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Gallery Item</DialogTitle>
          <DialogContent>
            <Typography variant="body1" paragraph>
              Are you sure you want to delete this gallery item?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This action cannot be undone. The transformation images will be permanently removed from the gallery.
            </Typography>
            {selectedItem && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Deleting: <strong>{selectedItem.report?.title}</strong>
                </Typography>
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteItem}
            >
              Delete Permanently
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

// Gallery Card Component
const GalleryCard = ({ item, onView, onFeatureToggle, onMenuOpen, onMenuClose, onDelete }) => {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ borderRadius: 3, height: '100%', position: 'relative' }}>
        {/* Image Preview */}
        <Box 
          sx={{ 
            position: 'relative', 
            cursor: 'pointer',
            height: 200,
            overflow: 'hidden'
          }} 
          onClick={onView}
        >
          {/* Before/After Comparison */}
          <Box sx={{ display: 'flex', height: '100%', position: 'relative' }}>
            {/* Before (50%) */}
            <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <img
                src={item.beforeImage?.url}
                alt="Before"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'brightness(0.9)'
                }}
              />
              <Box sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                bgcolor: 'rgba(255,0,0,0.8)',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}>
                BEFORE
              </Box>
            </Box>
            
            {/* Divider Arrow */}
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: theme.palette.primary.main,
              color: 'white',
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              border: '3px solid white',
              boxShadow: 2
            }}>
              →
            </Box>
            
            {/* After (50%) */}
            <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <img
                src={item.afterImage?.url}
                alt="After"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'brightness(0.9)'
                }}
              />
              <Box sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0,128,0,0.8)',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}>
                AFTER
              </Box>
            </Box>
          </Box>

          {/* Featured Badge */}
          {item.featured && (
            <Box sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: theme.palette.warning.main,
              color: 'white',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2
            }}>
              <Star />
            </Box>
          )}

          {/* Category Badge */}
          <Chip
            label={item.report?.category}
            size="small"
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
            }}
          />
        </Box>

        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} noWrap gutterBottom>
            {item.report?.title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar
              src={item.uploadedBy?.avatar}
              sx={{ width: 24, height: 24, mr: 1 }}
            >
              {item.uploadedBy?.name?.charAt(0)}
            </Avatar>
            <Typography variant="caption">
              {item.uploadedBy?.name}
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary" paragraph>
            {item.afterImage?.caption?.substring(0, 60)}...
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ThumbUp sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="caption">
                  {item.likeCount || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Visibility sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="caption">
                  {item.views || 0}
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(new Date(item.approvedAt || item.uploadedAt), { addSuffix: true })}
            </Typography>
          </Box>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button
            size="small"
            startIcon={<Visibility />}
            onClick={onView}
          >
            View
          </Button>
          
          <IconButton
            size="small"
            onClick={(e) => onMenuOpen(e, item._id)}
            sx={{ ml: 'auto' }}
          >
            <MoreVert />
          </IconButton>

          <Menu
            anchorEl={onMenuOpen.anchorEl}
            open={Boolean(onMenuOpen.anchorEl) && onMenuOpen.selectedMenuId === item._id}
            onClose={onMenuClose}
          >
            <MenuItem onClick={() => {
              onFeatureToggle(item.featured);
              onMenuClose();
            }}>
              {item.featured ? <StarBorder sx={{ mr: 1 }} /> : <Star sx={{ mr: 1 }} />}
              {item.featured ? 'Unfeature' : 'Feature'}
            </MenuItem>
            <MenuItem onClick={() => {
              onDelete();
              onMenuClose();
            }}>
              <Delete sx={{ mr: 1, color: 'error.main' }} />
              <Typography color="error">Delete</Typography>
            </MenuItem>
          </Menu>
        </CardActions>
      </Card>
    </motion.div>
  );
};

// Gallery List Item Component
const GalleryListItem = ({ item, onView, onFeatureToggle, onMenuOpen, onMenuClose, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ mb: 2, borderRadius: 2 }}>
        <Grid container>
          <Grid item xs={12} md={3}>
            <Box 
              sx={{ 
                position: 'relative', 
                height: 150,
                cursor: 'pointer'
              }}
              onClick={onView}
            >
              <Box sx={{ display: 'flex', height: '100%' }}>
                <Box sx={{ flex: 1, position: 'relative' }}>
                  <img
                    src={item.beforeImage?.url}
                    alt="Before"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <Box sx={{
                    position: 'absolute',
                    top: 4,
                    left: 4,
                    bgcolor: 'rgba(255,0,0,0.8)',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.7rem'
                  }}>
                    BEFORE
                  </Box>
                </Box>
                <Box sx={{ flex: 1, position: 'relative' }}>
                  <img
                    src={item.afterImage?.url}
                    alt="After"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <Box sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    bgcolor: 'rgba(0,128,0,0.8)',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.7rem'
                  }}>
                    AFTER
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={7}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {item.report?.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip label={item.report?.category} size="small" />
                    {item.featured && (
                      <Chip label="Featured" color="warning" size="small" />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {item.afterImage?.caption}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    src={item.uploadedBy?.avatar}
                    sx={{ width: 24, height: 24, mr: 1 }}
                  >
                    {item.uploadedBy?.name?.charAt(0)}
                  </Avatar>
                  <Typography variant="body2">
                    {item.uploadedBy?.name}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(item.approvedAt || item.uploadedAt), { addSuffix: true })}
                </Typography>
              </Box>
            </CardContent>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <CardActions sx={{ height: '100%', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={onView}
                fullWidth
                sx={{ mb: 1 }}
              >
                View
              </Button>
              <FormControlLabel
                control={
                  <Switch
                    checked={item.featured}
                    onChange={(e) => onFeatureToggle(item.featured)}
                    size="small"
                  />
                }
                label="Featured"
                labelPlacement="start"
              />
            </CardActions>
          </Grid>
        </Grid>
      </Card>
    </motion.div>
  );
};

// Gallery Detail Dialog Component
// Gallery Detail Dialog Component
const GalleryDetailDialog = ({ open, onClose, item, onFeatureToggle, onDelete }) => {
  // Add null checks for item and its properties
  if (!item) return null;

  const beforeImage = item.beforeImage || {};
  const afterImage = item.afterImage || {};
  const report = item.report || {};
  const uploadedBy = item.uploadedBy || {};
  
  // Safe date formatting
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Calculate file size safely
  const getFileSize = (size) => {
    if (!size) return 'N/A';
    return `${(size / 1024).toFixed(1)} KB`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{report.title || 'Untitled Transformation'}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label={report.category || 'Uncategorized'} color="primary" size="small" />
            {item.featured && (
              <Chip label="Featured" color="warning" size="small" icon={<Star />} />
            )}
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={4}>
          {/* Before Image */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                bgcolor: 'error.light', 
                color: 'error.contrastText',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                mr: 1
              }}>
                BEFORE
              </Box>
              Transformation
            </Typography>
            <Box sx={{ mb: 2 }}>
              {beforeImage.url ? (
                <img
                  src={beforeImage.url}
                  alt="Before"
                  style={{
                    width: '100%',
                    maxHeight: 400,
                    objectFit: 'contain',
                    borderRadius: 8
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/400x300?text=Before+Image+Not+Available';
                  }}
                />
              ) : (
                <Box sx={{
                  width: '100%',
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  borderRadius: 8
                }}>
                  <Typography color="text.secondary">Before image not available</Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Before Details:</Typography>
              <Typography variant="body2">Caption: {beforeImage.caption || 'No caption'}</Typography>
              <Typography variant="body2">
                Uploaded: {formatDate(beforeImage.uploadedAt || item.uploadedAt)}
              </Typography>
            </Box>
          </Grid>

          {/* After Image */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                bgcolor: 'success.light', 
                color: 'success.contrastText',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                mr: 1
              }}>
                AFTER
              </Box>
              Completion
            </Typography>
            <Box sx={{ mb: 2 }}>
              {afterImage.url ? (
                <img
                  src={afterImage.url}
                  alt="After"
                  style={{
                    width: '100%',
                    maxHeight: 400,
                    objectFit: 'contain',
                    borderRadius: 8
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/400x300?text=After+Image+Not+Available';
                  }}
                />
              ) : (
                <Box sx={{
                  width: '100%',
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  borderRadius: 8
                }}>
                  <Typography color="text.secondary">After image not available</Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom>After Details:</Typography>
              <Typography variant="body2">Caption: {afterImage.caption || 'No caption'}</Typography>
              <Typography variant="body2">
                Uploaded: {formatDate(afterImage.uploadedAt || item.uploadedAt)}
              </Typography>
              <Typography variant="body2">
                By: {uploadedBy.name || 'Staff Member'}
              </Typography>
              <Typography variant="body2">
                File Size: {getFileSize(afterImage.size)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Report Info */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>Report Information</Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2">
                <strong>Category:</strong> {report.category || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Location:</strong> {report.location?.address || 'Not specified'}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {report.status || 'Unknown'}
              </Typography>
              <Typography variant="body2">
                <strong>Completed:</strong> {formatDate(report.completedAt)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>Gallery Stats</Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2">
                <strong>Likes:</strong> {item.likeCount || 0}
              </Typography>
              <Typography variant="body2">
                <strong>Views:</strong> {item.views || 0}
              </Typography>
              <Typography variant="body2">
                <strong>Approved:</strong> {formatDate(item.approvedAt)}
              </Typography>
              <Typography variant="body2">
                <strong>Featured:</strong> {item.featured ? 'Yes' : 'No'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <FormControlLabel
          control={
            <Switch
              checked={item.featured || false}
              onChange={(e) => onFeatureToggle(item.featured)}
            />
          }
          label="Featured"
        />
        <Button
          variant="contained"
          color="error"
          startIcon={<Delete />}
          onClick={onDelete}
        >
          Delete
        </Button>
        <Button
          variant="contained"
          startIcon={<Share />}
          onClick={() => {
            if (item._id) {
              navigator.clipboard.writeText(`${window.location.origin}/gallery/${item._id}`);
              toast.success('Link copied to clipboard!');
            } else {
              toast.error('Cannot share: Item ID missing');
            }
          }}
        >
          Share
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GalleryManagement;