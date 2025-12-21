// src/pages/Gallery/PublicGallery.jsx
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
  alpha,
  Tabs,
  Tab,
  Avatar,
  Divider,
  Fab,
  Pagination,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  Visibility,
  Share,
  ThumbUp,
  Download,
  Compare,
  PhotoLibrary,
  ArrowBack,
  ArrowForward,
  Favorite,
  FavoriteBorder,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { galleryAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const PublicGallery = () => {
  const [loading, setLoading] = useState(true);
  const [galleryItems, setGalleryItems] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [likedItems, setLikedItems] = useState(new Set());
  const theme = useTheme();

  useEffect(() => {
    fetchGalleryItems();
    fetchFeaturedItems();
    fetchCategories();
  }, [page, category, sortBy, searchTerm]);

  const fetchGalleryItems = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        category: category === 'all' ? undefined : category,
        sort: sortBy,
        search: searchTerm || undefined,
        limit: 12
      };

      const response = await galleryAPI.getApprovedGallery(params);
      console.log('Gallery items:', response.data);
      
      setGalleryItems(response.data.data || []);
      setTotalPages(response.data.pagination?.pages || 1);
      
    } catch (error) {
      toast.error('Failed to load gallery');
      console.error('Fetch gallery error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedItems = async () => {
    try {
      const response = await galleryAPI.getFeaturedGallery();
      setFeaturedItems(response.data.data || []);
    } catch (error) {
      console.error('Fetch featured error:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      // You might want to create a separate endpoint for categories
      const response = await galleryAPI.getGalleryByCategory('pothole');
      // Extract categories from response or create a separate endpoint
      const allCategories = ['pothole', 'drainage', 'lighting', 'garbage', 'signage', 'other'];
      setCategories(allCategories);
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  const handleLike = async (itemId) => {
    try {
      const response = await galleryAPI.likeGalleryImage(itemId);
      
      if (response.data.success) {
        const newLikedItems = new Set(likedItems);
        if (response.data.liked) {
          newLikedItems.add(itemId);
          toast.success('Liked!');
        } else {
          newLikedItems.delete(itemId);
          toast.success('Unliked');
        }
        setLikedItems(newLikedItems);
        
        // Update like count in local state
        setGalleryItems(prev => prev.map(item => 
          item._id === itemId 
            ? { ...item, likeCount: response.data.likeCount, liked: response.data.liked }
            : item
        ));
      }
    } catch (error) {
      console.error('Like error:', error);
      toast.error('Failed to like image');
    }
  };

  const downloadImage = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Image downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  const getTransformationsCount = () => {
    return galleryItems.length;
  };

  if (loading && page === 1) {
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PhotoLibrary sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Transformation Gallery
              </Typography>
              <Typography variant="body1" color="text.secondary">
                See the amazing work done by our maintenance teams
              </Typography>
            </Box>
          </Box>

          {/* Stats */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
                <Typography variant="h5" fontWeight={700} color="primary">
                  {getTransformationsCount()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Transformations
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
                <Typography variant="h5" fontWeight={700} color="success.main">
                  {featuredItems.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Featured
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
                <Typography variant="h5" fontWeight={700} color="warning.main">
                  {categories.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Categories
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
                <Typography variant="h5" fontWeight={700} color="info.main">
                  {galleryItems.reduce((sum, item) => sum + (item.likeCount || 0), 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Likes
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Featured Section */}
        {featuredItems.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              🔥 Featured Transformations
            </Typography>
            <Grid container spacing={3}>
              {featuredItems.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item._id}>
                  <FeaturedCard 
                    item={item}
                    onView={() => {
                      setSelectedItem(item);
                      setDetailDialogOpen(true);
                    }}
                    onLike={() => handleLike(item._id)}
                    isLiked={likedItems.has(item._id)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search transformations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                size="small"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
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
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="featured">Featured</MenuItem>
                <MenuItem value="popular">Most Popular</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                fullWidth
                onClick={fetchGalleryItems}
              >
                Apply
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Gallery Grid */}
        {galleryItems.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body1">
              No transformation images found
            </Typography>
            <Typography variant="body2">
              Try adjusting your search filters or check back later for new transformations.
            </Typography>
          </Alert>
        ) : (
          <>
            <Grid container spacing={3}>
              <AnimatePresence>
                {galleryItems.map((item) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                    <GalleryCard 
                      item={item}
                      onView={() => {
                        setSelectedItem(item);
                        setDetailDialogOpen(true);
                      }}
                      onLike={() => handleLike(item._id)}
                      isLiked={likedItems.has(item._id)}
                      onCompare={() => {
                        setSelectedItem(item);
                        setCompareDialogOpen(true);
                      }}
                    />
                  </Grid>
                ))}
              </AnimatePresence>
            </Grid>

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
          <GalleryDetailDialog
            open={detailDialogOpen}
            onClose={() => setDetailDialogOpen(false)}
            item={selectedItem}
            onLike={() => handleLike(selectedItem._id)}
            isLiked={likedItems.has(selectedItem._id)}
            onCompare={() => {
              setDetailDialogOpen(false);
              setCompareDialogOpen(true);
            }}
            onDownload={() => downloadImage(selectedItem.afterImage?.url, `transformation-${selectedItem.report?.title}.jpg`)}
          />
        )}

        {/* Compare View Dialog */}
        {selectedItem && (
          <Dialog
            open={compareDialogOpen}
            onClose={() => setCompareDialogOpen(false)}
            maxWidth="xl"
            fullWidth
          >
            <DialogTitle>
              <Typography variant="h6">Compare Transformation</Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" align="center" gutterBottom color="error">
                    BEFORE
                  </Typography>
                  <Box sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                    <img
                      src={selectedItem.beforeImage?.url}
                      alt="Before"
                      style={{ width: '100%', height: 'auto' }}
                    />
                  </Box>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="subtitle2">Original Issue</Typography>
                    <Typography variant="body2">{selectedItem.beforeImage?.caption}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" align="center" gutterBottom color="success">
                    AFTER
                  </Typography>
                  <Box sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                    <img
                      src={selectedItem.afterImage?.url}
                      alt="After"
                      style={{ width: '100%', height: 'auto' }}
                    />
                  </Box>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="subtitle2">Completed Work</Typography>
                    <Typography variant="body2">{selectedItem.afterImage?.caption}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCompareDialogOpen(false)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={() => downloadImage(selectedItem.afterImage?.url, `after-${selectedItem.report?.title}.jpg`)}
              >
                Download After
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Floating Action Button for Compare View */}
        {selectedItem && (
          <Fab
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
            }}
            onClick={() => setCompareDialogOpen(true)}
          >
            <Compare />
          </Fab>
        )}
      </motion.div>
    </Container>
  );
};

// Gallery Card Component
const GalleryCard = ({ item, onView, onLike, isLiked, onCompare }) => {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -8 }}
    >
      <Card sx={{ 
        borderRadius: 3, 
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.2)}`,
        }
      }}>
        {/* Image Preview */}
        <Box onClick={onView}>
          <Box sx={{ position: 'relative', height: 200 }}>
            <Box sx={{ 
              display: 'flex', 
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '12px 12px 0 0'
            }}>
              {/* Before (50%) */}
              <Box sx={{ 
                flex: 1,
                position: 'relative',
                overflow: 'hidden'
              }}>
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
              
              {/* After (50%) */}
              <Box sx={{ 
                flex: 1,
                position: 'relative',
                overflow: 'hidden'
              }}>
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

            {/* Transformation Arrow */}
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

            {/* Featured Badge */}
            {item.featured && (
              <Box sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: theme.palette.warning.main,
                color: 'white',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2
              }}>
                <PhotoLibrary sx={{ fontSize: 18 }} />
              </Box>
            )}
          </Box>
        </Box>

        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} noWrap gutterBottom>
            {item.report?.title}
          </Typography>
          
          <Chip
            label={item.report?.category}
            size="small"
            sx={{ mb: 1 }}
          />

          <Typography variant="caption" color="text.secondary" paragraph>
            {item.afterImage?.caption?.substring(0, 60)}...
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onLike();
                }}
                color={isLiked ? 'primary' : 'default'}
              >
                {isLiked ? <Favorite /> : <FavoriteBorder />}
              </IconButton>
              <Typography variant="caption" sx={{ ml: 0.5 }}>
                {item.likeCount || 0}
              </Typography>
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
            View Details
          </Button>
          <Button
            size="small"
            startIcon={<Compare />}
            onClick={(e) => {
              e.stopPropagation();
              onCompare();
            }}
          >
            Compare
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  );
};

// Featured Card Component
const FeaturedCard = ({ item, onView, onLike, isLiked }) => {
  return (
    <Card sx={{ 
      borderRadius: 3, 
      height: '100%',
      position: 'relative',
      border: '2px solid',
      borderColor: 'warning.main'
    }}>
      <Box sx={{ position: 'relative', height: 200 }} onClick={onView}>
        <img
          src={item.afterImage?.url}
          alt="After"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '8px 8px 0 0'
          }}
        />
        <Box sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          bgcolor: 'warning.main',
          color: 'white',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          fontSize: '0.8rem',
          fontWeight: 'bold'
        }}>
          FEATURED
        </Box>
      </Box>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {item.report?.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {item.afterImage?.caption?.substring(0, 80)}...
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip label={item.report?.category} size="small" />
          <IconButton
            size="small"
            onClick={onLike}
            color={isLiked ? 'primary' : 'default'}
          >
            {isLiked ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

// Gallery Detail Dialog Component
const GalleryDetailDialog = ({ open, onClose, item, onLike, isLiked, onCompare, onDownload }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{item.report?.title}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label={item.report?.category} color="primary" size="small" />
            {item.featured && (
              <Chip label="Featured" color="warning" size="small" />
            )}
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {/* Image Comparison */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ position: 'relative' }}>
                <img
                  src={item.beforeImage?.url}
                  alt="Before"
                  style={{
                    width: '100%',
                    maxHeight: 300,
                    objectFit: 'cover',
                    borderRadius: 8
                  }}
                />
                <Box sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  bgcolor: 'rgba(255,0,0,0.9)',
                  color: 'white',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  fontWeight: 'bold'
                }}>
                  BEFORE
                </Box>
              </Box>
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                {item.beforeImage?.caption}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ position: 'relative' }}>
                <img
                  src={item.afterImage?.url}
                  alt="After"
                  style={{
                    width: '100%',
                    maxHeight: 300,
                    objectFit: 'cover',
                    borderRadius: 8
                  }}
                />
                <Box sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  bgcolor: 'rgba(0,128,0,0.9)',
                  color: 'white',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  fontWeight: 'bold'
                }}>
                  AFTER
                </Box>
              </Box>
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                {item.afterImage?.caption}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Report Details */}
        <Typography variant="subtitle1" gutterBottom>Report Details</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2">
              <strong>Location:</strong> {item.report?.location?.address || 'Not specified'}
            </Typography>
            <Typography variant="body2">
              <strong>Completed:</strong> {formatDistanceToNow(new Date(item.report?.completedAt), { addSuffix: true })}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2">
              <strong>Gallery Status:</strong> Approved
            </Typography>
            <Typography variant="body2">
              <strong>Approved:</strong> {formatDistanceToNow(new Date(item.approvedAt), { addSuffix: true })}
            </Typography>
          </Grid>
        </Grid>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size="small"
              onClick={onLike}
              color={isLiked ? 'primary' : 'default'}
            >
              {isLiked ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
            <Typography variant="body2">{item.likeCount || 0} likes</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Visibility sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">{item.views || 0} views</Typography>
          </Box>
        </Box>

        {/* Description */}
        {item.report?.description && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>Original Issue</Typography>
            <Typography variant="body2">
              {item.report?.description}
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="outlined"
          startIcon={<Compare />}
          onClick={onCompare}
        >
          Compare View
        </Button>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={onDownload}
        >
          Download
        </Button>
        <Button
          variant="contained"
          startIcon={<Share />}
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/gallery/${item._id}`);
            toast.success('Link copied to clipboard!');
            onClose();
          }}
        >
          Share
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PublicGallery;