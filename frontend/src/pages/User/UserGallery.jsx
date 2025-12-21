// src/pages/User/UserGallery.jsx
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
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  useTheme,
  Tabs,
  Tab,
  Badge,
  Avatar,
  Divider,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Fab,
  Pagination,
} from '@mui/material';
import {
  Visibility,
  Share,
  Download,
  Refresh,
  Search,
  FilterList,
  Star,
  StarBorder,
  ThumbUp,
  Comment,
  PhotoCamera,
  GridView,
  List,
  Sort,
  Close,
  ArrowBack,
  ArrowForward,
  Info,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { galleryAPI, reportAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const UserGallery = () => {
  const [loading, setLoading] = useState(true);
  const [galleryItems, setGalleryItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(12);
  
  const theme = useTheme();
  const { user } = useAuth(); // Get current user from auth context

  const tabs = [
    { label: 'All Transformations', value: 'all' },
    { label: 'Featured', value: 'featured' },
    { label: 'Most Liked', value: 'liked' },
  ];

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Most Liked', value: 'likes' },
  ];

  useEffect(() => {
    if (user) {
      fetchUserGalleryItems();
    }
  }, [user, page, sortBy]);

  useEffect(() => {
    filterItems();
  }, [galleryItems, searchTerm, selectedCategory, tabValue, sortBy]);

  const fetchUserGalleryItems = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching user gallery items for:', user?.name || user?.email);
      
      // First, get user's reports
      let userReports = [];
      try {
        const reportsResponse = await reportAPI.getMyReports();
        userReports = reportsResponse.data?.data || reportsResponse.data || [];
        console.log('📋 User reports:', userReports.length);
      } catch (reportsError) {
        console.error('❌ Error fetching user reports:', reportsError);
      }
      
      // Get approved gallery items
      let allGalleryItems = [];
      try {
        const params = {
          page,
          limit: itemsPerPage,
          sort: sortBy,
          userId: user?.id || user?._id // Pass user ID to filter
        };
        
        const response = await galleryAPI.getApprovedGallery(params);
        console.log('📊 Gallery API response:', response.data);
        
        if (response.data?.data) {
          allGalleryItems = response.data.data;
          setTotalPages(response.data.pagination?.pages || 1);
        }
      } catch (galleryError) {
        console.error('❌ Error fetching gallery:', galleryError);
        // Fallback: Use reports data to build gallery
        allGalleryItems = buildGalleryFromReports(userReports);
      }
      
      // Filter items to only show those belonging to current user
      const userGalleryItems = filterUserGalleryItems(allGalleryItems, userReports);
      
      setGalleryItems(userGalleryItems);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(
        userGalleryItems.map(item => item.report?.category)
      )].filter(Boolean);
      
      if (uniqueCategories.length > 0) {
        setCategories(uniqueCategories);
      }
      
      console.log(`✅ Loaded ${userGalleryItems.length} gallery items for user`);
      toast.success(`Loaded ${userGalleryItems.length} transformation${userGalleryItems.length === 1 ? '' : 's'}`);
      
    } catch (error) {
      console.error('❌ Failed to load user gallery:', error);
      toast.error('Failed to load your transformations');
      setGalleryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUserGalleryItems = (galleryItems, userReports) => {
    if (!user || !userReports || userReports.length === 0) {
      return [];
    }
    
    // Get user's report IDs
    const userReportIds = userReports.map(report => report._id);
    
    // Filter gallery items that belong to user's reports
    return galleryItems.filter(item => {
      // Check if item belongs to user's report
      const itemReportId = item.report?._id || item.reportId;
      if (userReportIds.includes(itemReportId)) {
        return true;
      }
      
      // Check if uploaded by current user
      if (item.uploadedBy?.id === user.id || item.uploadedBy?._id === user._id) {
        return true;
      }
      
      // Check if created by current user
      if (item.createdBy === user.id || item.userId === user.id) {
        return true;
      }
      
      return false;
    });
  };

  const buildGalleryFromReports = (reports) => {
    const galleryItems = [];
    
    reports.forEach(report => {
      if (report.galleryImages && Array.isArray(report.galleryImages)) {
        report.galleryImages.forEach(image => {
          if (image.status === 'approved' || image.inGallery === true) {
            galleryItems.push({
              ...image,
              _id: image._id || `gallery-${report._id}-${Date.now()}`,
              report: {
                _id: report._id,
                title: report.title,
                category: report.category,
                location: report.location,
                status: report.status
              },
              beforeImage: image.beforeImage || {
                url: image.beforeImageUrl || '',
                caption: image.beforeImageCaption || 'Before image'
              },
              afterImage: image.afterImage || {
                url: image.afterImageUrl || '',
                caption: image.afterImageCaption || 'After image'
              },
              uploadedBy: image.uploadedBy || { name: user?.name || 'You' },
              status: 'approved',
              approvedAt: image.approvedAt || report.completedAt || new Date().toISOString()
            });
          }
        });
      }
    });
    
    return galleryItems;
  };

  const filterItems = () => {
    let filtered = [...galleryItems];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.report?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.report?.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.afterImage?.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.report?.location?.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.report?.category === selectedCategory);
    }

    // Filter by tab
    if (tabValue === 1) { // Featured
      filtered = filtered.filter(item => item.featured);
    } else if (tabValue === 2) { // Most Liked
      filtered = filtered.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.approvedAt || b.uploadedAt || b.createdAt) - 
                               new Date(a.approvedAt || a.uploadedAt || a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.approvedAt || a.uploadedAt || a.createdAt) - 
                               new Date(b.approvedAt || b.uploadedAt || b.createdAt));
        break;
      case 'likes':
        filtered.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
        break;
    }

    setFilteredItems(filtered);
  };

  const handleLikeItem = async (itemId) => {
    try {
      const response = await galleryAPI.likeGalleryImage(itemId);
      toast.success('Liked!');
      
      // Update local state
      setGalleryItems(prev => prev.map(item => 
        item._id === itemId 
          ? { ...item, likeCount: (item.likeCount || 0) + 1, likedByUser: true }
          : item
      ));
    } catch (error) {
      console.error('Error liking item:', error);
      toast.error('Failed to like');
    }
  };

  const handleShareItem = (item) => {
    if (item._id) {
      const shareUrl = `${window.location.origin}/gallery/${item._id}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } else {
      toast.error('Cannot share: Item ID missing');
    }
  };

  const handleDownloadImages = async (item) => {
    try {
      // Create download links for both images
      const downloadImage = async (url, filename) => {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      };

      if (item.beforeImage?.url) {
        await downloadImage(item.beforeImage.url, `before-${item.report?.title || 'transformation'}.jpg`);
      }
      
      if (item.afterImage?.url) {
        await downloadImage(item.afterImage.url, `after-${item.report?.title || 'transformation'}.jpg`);
      }
      
      toast.success('Images downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download images');
    }
  };

  const handleOpenDetailDialog = (item) => {
    console.log('Opening detail dialog for:', item);
    setSelectedItem(item);
    setDetailDialogOpen(true);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStats = () => {
    return {
      total: galleryItems.length,
      featured: galleryItems.filter(item => item.featured).length,
      categories: categories.length,
      totalLikes: galleryItems.reduce((sum, item) => sum + (item.likeCount || 0), 0)
    };
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
            Loading your transformations...
          </Typography>
        </Box>
      </Container>
    );
  }

  const stats = getStats();

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
                My Transformations Gallery
              </Typography>
              <Typography variant="body1" color="text.secondary">
                View all your reported issues that have been transformed
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchUserGalleryItems}
              >
                Refresh
              </Button>
              {galleryItems.length > 0 && (
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={() => {
                    // Export functionality
                    toast.success('Export feature coming soon!');
                  }}
                >
                  Export All
                </Button>
              )}
            </Box>
          </Box>

          {/* Stats */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="h4" fontWeight={700}>
                  {stats.total}
                </Typography>
                <Typography variant="body2">
                  Transformations
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <Typography variant="h4" fontWeight={700}>
                  {stats.featured}
                </Typography>
                <Typography variant="body2">
                  Featured
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
                <Typography variant="h4" fontWeight={700}>
                  {stats.categories}
                </Typography>
                <Typography variant="body2">
                  Categories
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
                <Typography variant="h4" fontWeight={700}>
                  {stats.totalLikes}
                </Typography>
                <Typography variant="body2">
                  Total Likes
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Filters & Controls */}
        {galleryItems.length > 0 && (
          <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search your transformations..."
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
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    label="Category"
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label="Sort By"
                  >
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
              onChange={handleTabChange}
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
        )}

        {/* Gallery Content */}
        {galleryItems.length === 0 ? (
          <Alert 
            severity="info" 
            sx={{ 
              borderRadius: 2,
              '& .MuiAlert-icon': { fontSize: 32 }
            }}
          >
            <Typography variant="h6" gutterBottom>
              No Transformations Yet
            </Typography>
            <Typography variant="body1" paragraph>
              You haven't reported any issues that have been transformed yet.
            </Typography>
            <Typography variant="body2">
              When you report issues and they get completed, the before/after images will appear here.
            </Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 2 }}
              href="/report"
              startIcon={<PhotoCamera />}
            >
              Report an Issue
            </Button>
          </Alert>
        ) : filteredItems.length === 0 ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            <Typography variant="body1">
              No transformations match your filters
            </Typography>
            <Button 
              variant="text" 
              size="small" 
              sx={{ mt: 1 }}
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setTabValue(0);
                setSortBy('newest');
              }}
            >
              Clear all filters
            </Button>
          </Alert>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <Grid container spacing={3}>
                <AnimatePresence>
                  {filteredItems.map((item) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                      <UserGalleryCard 
                        item={item}
                        onView={() => handleOpenDetailDialog(item)}
                        onLike={() => handleLikeItem(item._id)}
                        onShare={() => handleShareItem(item)}
                        onDownload={() => handleDownloadImages(item)}
                      />
                    </Grid>
                  ))}
                </AnimatePresence>
              </Grid>
            ) : (
              <Box>
                {filteredItems.map((item) => (
                  <UserGalleryListItem 
                    key={item._id}
                    item={item}
                    onView={() => handleOpenDetailDialog(item)}
                    onLike={() => handleLikeItem(item._id)}
                    onShare={() => handleShareItem(item)}
                    onDownload={() => handleDownloadImages(item)}
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
        {selectedItem && (
          <UserGalleryDetailDialog
            open={detailDialogOpen}
            onClose={() => setDetailDialogOpen(false)}
            item={selectedItem}
            onLike={() => handleLikeItem(selectedItem._id)}
            onShare={() => handleShareItem(selectedItem)}
            onDownload={() => handleDownloadImages(selectedItem)}
          />
        )}

        {/* Floating Action Button for Mobile */}
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', md: 'none' }
          }}
          onClick={() => {
            const url = `/report`;
            window.location.href = url;
          }}
        >
          <PhotoCamera />
        </Fab>
      </motion.div>
    </Container>
  );
};

// User Gallery Card Component
const UserGalleryCard = ({ item, onView, onLike, onShare, onDownload }) => {
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
                src={item.beforeImage?.url || 'https://via.placeholder.com/400x300/FF0000/FFFFFF?text=Before'}
                alt="Before"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'brightness(0.9)'
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/400x300/FF0000/FFFFFF?text=Before';
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
                src={item.afterImage?.url || 'https://via.placeholder.com/400x300/00FF00/FFFFFF?text=After'}
                alt="After"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'brightness(0.9)'
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/400x300/00FF00/FFFFFF?text=After';
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
            label={item.report?.category || 'Uncategorized'}
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
            {item.report?.title || 'Transformation'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar
              src={item.uploadedBy?.avatar}
              sx={{ width: 24, height: 24, mr: 1 }}
            >
              {item.uploadedBy?.name?.charAt(0) || 'Y'}
            </Avatar>
            <Typography variant="caption">
              {item.uploadedBy?.name || 'Your Report'}
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary" paragraph>
            {item.afterImage?.caption?.substring(0, 60) || 'Transformation completed...'}
            {item.afterImage?.caption?.length > 60 ? '...' : ''}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ThumbUp sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="caption">
                  {item.likeCount || 0}
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
          
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Tooltip title="Like">
              <IconButton size="small" onClick={onLike}>
                <ThumbUp />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share">
              <IconButton size="small" onClick={onShare}>
                <Share />
              </IconButton>
            </Tooltip>
          </Box>
        </CardActions>
      </Card>
    </motion.div>
  );
};

// User Gallery List Item Component
const UserGalleryListItem = ({ item, onView, onLike, onShare, onDownload }) => {
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
                    src={item.beforeImage?.url || 'https://via.placeholder.com/200x150/FF0000/FFFFFF?text=Before'}
                    alt="Before"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/200x150/FF0000/FFFFFF?text=Before';
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
                    src={item.afterImage?.url || 'https://via.placeholder.com/200x150/00FF00/FFFFFF?text=After'}
                    alt="After"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/200x150/00FF00/FFFFFF?text=After';
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
                    {item.report?.title || 'Transformation'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip label={item.report?.category || 'Uncategorized'} size="small" />
                    {item.featured && (
                      <Chip label="Featured" color="warning" size="small" />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {item.afterImage?.caption || 'Transformation completed successfully'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    src={item.uploadedBy?.avatar}
                    sx={{ width: 24, height: 24, mr: 1 }}
                  >
                    {item.uploadedBy?.name?.charAt(0) || 'Y'}
                  </Avatar>
                  <Typography variant="body2">
                    {item.uploadedBy?.name || 'Your Report'}
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
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton size="small" onClick={onLike}>
                  <ThumbUp />
                </IconButton>
                <IconButton size="small" onClick={onShare}>
                  <Share />
                </IconButton>
              </Box>
            </CardActions>
          </Grid>
        </Grid>
      </Card>
    </motion.div>
  );
};

// User Gallery Detail Dialog Component
const UserGalleryDetailDialog = ({ open, onClose, item, onLike, onShare, onDownload }) => {
  if (!item) return null;

  const beforeImage = item.beforeImage || {};
  const afterImage = item.afterImage || {};
  const report = item.report || {};
  const uploadedBy = item.uploadedBy || {};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{report.title || 'Your Transformation'}</Typography>
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
              Issue Reported
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
                    e.target.src = 'https://via.placeholder.com/600x400/FF0000/FFFFFF?text=Before+Image';
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
              <Typography variant="subtitle2" gutterBottom>Reported Issue:</Typography>
              <Typography variant="body2">Caption: {beforeImage.caption || 'Issue as reported'}</Typography>
              <Typography variant="body2">
                Date Reported: {item.uploadedAt ? 
                  format(new Date(item.uploadedAt), 'PPP') : 
                  'Date not available'}
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
              Issue Resolved
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
                    e.target.src = 'https://via.placeholder.com/600x400/00FF00/FFFFFF?text=After+Image';
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
              <Typography variant="subtitle2" gutterBottom>Resolution:</Typography>
              <Typography variant="body2">Caption: {afterImage.caption || 'Issue resolved successfully'}</Typography>
              <Typography variant="body2">
                Completed: {item.approvedAt ? 
                  format(new Date(item.approvedAt), 'PPP') : 
                  'Date not available'}
              </Typography>
              <Typography variant="body2">
                Status: {report.status || 'Completed'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Report Details */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>Report Details</Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2">
                <strong>Location:</strong> {report.location?.address || 'Location not specified'}
              </Typography>
              <Typography variant="body2">
                <strong>Category:</strong> {report.category || 'General'}
              </Typography>
              <Typography variant="body2">
                <strong>Report ID:</strong> {report._id ? report._id.substring(0, 8) + '...' : 'N/A'}
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
                <strong>Added to Gallery:</strong> {item.approvedAt ? 
                  formatDistanceToNow(new Date(item.approvedAt), { addSuffix: true }) : 
                  'Recently'}
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
        <Button
          variant="outlined"
          startIcon={<ThumbUp />}
          onClick={onLike}
        >
          Like ({item.likeCount || 0})
        </Button>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={onDownload}
        >
          Download
        </Button>
        <Button
          variant="contained"
          startIcon={<Share />}
          onClick={onShare}
        >
          Share
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserGallery;