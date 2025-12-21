// src/pages/Admin/ImageApprovals.jsx - CORRECTED VERSION
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
  Tabs,
  Tab,
  Badge,
  Avatar,
  Divider,
  Switch,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Pagination,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  Refresh,
  Star,
  Warning,
  Error as ErrorIcon,
  ThumbUp,
  ThumbDown,
  Download,
  FilterList,
  Search,
  ArrowBack,
  ArrowForward,
  Info,
  Delete,
  PhotoCamera,
  
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';

const ImageApprovals = () => {
  const [loading, setLoading] = useState(true);
  const [pendingImages, setPendingImages] = useState([]);
  const [approvedImages, setApprovedImages] = useState([]);
  const [rejectedImages, setRejectedImages] = useState([]);
  const [allImages, setAllImages] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Form states
  const [approvalForm, setApprovalForm] = useState({
    adminNotes: '',
    featured: false,
  });
  
  const [rejectionForm, setRejectionForm] = useState({
    reason: '',
    adminNotes: '',
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(9);
  
  const theme = useTheme();

  const tabs = [
    { 
      label: 'Pending', 
      value: 'pending', 
      color: 'warning',
      icon: <Warning color="warning" />,
      badge: pendingImages.length 
    },
    { 
      label: 'Approved', 
      value: 'approved', 
      color: 'success',
      icon: <CheckCircle color="success" />,
      badge: approvedImages.length 
    },
    { 
      label: 'Rejected', 
      value: 'rejected', 
      color: 'error',
      icon: <ErrorIcon color="error" />,
      badge: rejectedImages.length 
    },
  ];

  useEffect(() => {
    fetchAllImages();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allImages, searchTerm, categoryFilter, dateFilter, sortBy]);

  const fetchAllImages = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching gallery images for approval...');
      
      // 1. Get all gallery images using the working endpoint from GalleryManagement
      let allImagesData = [];
      
      // Try the approved gallery endpoint first (which works in GalleryManagement)
      try {
        const approvedResponse = await adminAPI.getAllReports({ 
          status: 'completed', 
          hasGalleryImages: true,
          limit: 100 
        });
        
        if (approvedResponse.data?.data) {
          console.log('✅ Got approved reports with images:', approvedResponse.data.data.length);
          
          // Process reports to extract gallery images
          approvedResponse.data.data.forEach(report => {
            if (report.galleryImages && Array.isArray(report.galleryImages)) {
              report.galleryImages.forEach(image => {
                if (image.status === 'approved' || image.inGallery === true) {
                  allImagesData.push({
                    ...image,
                    _id: image._id || `approved-${Date.now()}`,
                    status: 'approved',
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
                    uploadedBy: image.uploadedBy || report.assignedStaff || { name: 'Staff Member' }
                  });
                }
              });
            }
          });
        }
      } catch (approvedError) {
        console.warn('⚠️ Could not fetch approved reports:', approvedError);
      }
      
      // 2. Get pending gallery images using the specific endpoint
      let pendingImagesData = [];
      try {
        const pendingResponse = await adminAPI.getPendingGalleryImages();
        console.log('📝 Pending gallery response:', pendingResponse.data);
        
        if (pendingResponse.data?.data) {
          pendingImagesData = pendingResponse.data.data;
        } else if (Array.isArray(pendingResponse.data)) {
          pendingImagesData = pendingResponse.data;
        }
        
        // Process pending images
        pendingImagesData.forEach(image => {
          allImagesData.push({
            ...image,
            _id: image._id || `pending-${Date.now()}`,
            status: 'pending',
            report: image.report || {
              title: image.title || 'Unknown Report',
              category: image.category || 'uncategorized',
              location: image.location || { address: 'Unknown Location' }
            },
            beforeImage: image.beforeImage || {
              url: image.beforeImageUrl || '',
              caption: image.beforeImageCaption || 'Before image'
            },
            afterImage: image.afterImage || {
              url: image.afterImageUrl || '',
              caption: image.afterImageCaption || 'After image'
            },
            uploadedBy: image.uploadedBy || { name: 'Staff Member' }
          });
        });
      } catch (pendingError) {
        console.error('❌ Error fetching pending images:', pendingError);
        toast.error('Could not load pending images');
      }
      
      // 3. Also try to get reports that might have gallery images but are not in gallery
      try {
        const reportsResponse = await adminAPI.getAllReports({ 
          limit: 50,
          sort: 'newest'
        });
        
        if (reportsResponse.data?.data) {
          reportsResponse.data.data.forEach(report => {
            // Check if report has gallery images with pending status
            if (report.galleryImages && Array.isArray(report.galleryImages)) {
              report.galleryImages.forEach(image => {
                if (image.status === 'pending' && !allImagesData.find(img => img._id === image._id)) {
                  allImagesData.push({
                    ...image,
                    _id: image._id || `report-pending-${Date.now()}`,
                    status: 'pending',
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
                    uploadedBy: image.uploadedBy || report.assignedStaff || { name: 'Staff Member' }
                  });
                }
              });
            }
          });
        }
      } catch (reportsError) {
        console.warn('⚠️ Could not fetch additional reports:', reportsError);
      }
      
      console.log(`📊 Total images loaded: ${allImagesData.length}`);
      
      // Categorize images
      const pending = [];
      const approved = [];
      const rejected = [];
      
      allImagesData.forEach(image => {
        const status = image.status?.toLowerCase() || 'pending';
        
        const processedImage = {
          ...image,
          status: status,
          report: image.report || {
            title: 'Unknown Report',
            category: 'uncategorized',
            location: { address: 'Unknown Location' }
          },
          beforeImage: image.beforeImage || { 
            url: '', 
            caption: 'Before image' 
          },
          afterImage: image.afterImage || { 
            url: '', 
            caption: 'After image' 
          },
          uploadedBy: image.uploadedBy || { name: 'Staff Member' }
        };
        
        switch (status) {
          case 'pending':
            pending.push(processedImage);
            break;
          case 'approved':
            approved.push(processedImage);
            break;
          case 'rejected':
            rejected.push(processedImage);
            break;
          default:
            pending.push(processedImage);
        }
      });
      
      setPendingImages(pending);
      setApprovedImages(approved);
      setRejectedImages(rejected);
      setAllImages(allImagesData);
      
      console.log(`📝 Pending: ${pending.length}, ✅ Approved: ${approved.length}, ❌ Rejected: ${rejected.length}`);
      
      toast.success(`Loaded ${allImagesData.length} images (${pending.length} pending)`);
      
    } catch (error) {
      console.error('❌ Failed to load images:', error);
      
      // Fallback to sample data if API fails
      const sampleData = generateSampleData();
      setPendingImages(sampleData.pending);
      setApprovedImages(sampleData.approved);
      setRejectedImages(sampleData.rejected);
      setAllImages([...sampleData.pending, ...sampleData.approved, ...sampleData.rejected]);
      
      toast.error('Using demo data - check API endpoints');
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = () => {
    const categories = ['Pothole', 'Garbage', 'Street Light', 'Drainage', 'Road Repair'];
    const statuses = ['pending', 'approved', 'rejected'];
    
    const generateImage = (status, index) => ({
      _id: `sample-${status}-${index}`,
      status: status,
      report: {
        title: `${status === 'pending' ? 'New ' : ''}${categories[index % categories.length]} Issue`,
        category: categories[index % categories.length],
        location: {
          address: `${index + 100} Main St, City`
        }
      },
      beforeImage: {
        url: `https://via.placeholder.com/400x300/FF0000/FFFFFF?text=Before+${index}`,
        caption: `Before ${categories[index % categories.length]} repair`
      },
      afterImage: {
        url: `https://via.placeholder.com/400x300/00FF00/FFFFFF?text=After+${index}`,
        caption: `After ${categories[index % categories.length]} repair`
      },
      uploadedBy: {
        name: `Staff ${String.fromCharCode(65 + index)}`,
        avatar: ''
      },
      uploadedAt: new Date(Date.now() - index * 86400000).toISOString(),
      featured: status === 'approved' && index % 3 === 0,
      adminNotes: status !== 'pending' ? `Sample ${status} note` : '',
      ...(status === 'rejected' && { 
        rejectionReason: 'Image quality not sufficient',
        rejectedAt: new Date(Date.now() - index * 43200000).toISOString()
      }),
      ...(status === 'approved' && { 
        approvedAt: new Date(Date.now() - index * 43200000).toISOString(),
        approvedBy: { name: 'Admin User' }
      })
    });

    const pending = Array.from({ length: 8 }, (_, i) => generateImage('pending', i));
    const approved = Array.from({ length: 6 }, (_, i) => generateImage('approved', i));
    const rejected = Array.from({ length: 2 }, (_, i) => generateImage('rejected', i));

    return { pending, approved, rejected };
  };

  const applyFilters = () => {
    let filtered = [...allImages];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(img => 
        img.report?.title?.toLowerCase().includes(term) ||
        img.report?.category?.toLowerCase().includes(term) ||
        img.uploadedBy?.name?.toLowerCase().includes(term) ||
        img.beforeImage?.caption?.toLowerCase().includes(term) ||
        img.afterImage?.caption?.toLowerCase().includes(term)
      );
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(img => img.report?.category === categoryFilter);
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(img => {
        const imgDate = new Date(img.uploadedAt || img.createdAt);
        switch (dateFilter) {
          case 'today':
            return imgDate.toDateString() === now.toDateString();
          case 'week':
            return imgDate >= sevenDaysAgo;
          case 'month':
            return imgDate >= thirtyDaysAgo;
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.uploadedAt || a.createdAt);
      const dateB = new Date(b.uploadedAt || b.createdAt);
      
      switch (sortBy) {
        case 'newest':
          return dateB - dateA;
        case 'oldest':
          return dateA - dateB;
        case 'category':
          return (a.report?.category || '').localeCompare(b.report?.category || '');
        default:
          return dateB - dateA;
      }
    });
    
    // Update categorized lists
    const pending = filtered.filter(img => img.status === 'pending');
    const approved = filtered.filter(img => img.status === 'approved');
    const rejected = filtered.filter(img => img.status === 'rejected');
    
    setPendingImages(pending);
    setApprovedImages(approved);
    setRejectedImages(rejected);
  };

  const handleApprove = async () => {
    if (!selectedImage) {
      toast.error('No image selected');
      return;
    }

    setProcessing(true);
    
    try {
      console.log('🔵 Starting approval process...');
      
      // Check if this is real data or sample data
      const isSampleData = selectedImage._id.includes('sample-');
      
      if (isSampleData) {
        // Demo mode - simulate approval
        setTimeout(() => {
          const updatedImage = {
            ...selectedImage,
            status: 'approved',
            featured: approvalForm.featured,
            adminNotes: approvalForm.adminNotes,
            approvedAt: new Date().toISOString(),
            approvedBy: { name: 'Admin User' }
          };
          
          // Update local state
          setPendingImages(prev => prev.filter(img => img._id !== selectedImage._id));
          setApprovedImages(prev => [updatedImage, ...prev]);
          setAllImages(prev => prev.map(img => 
            img._id === selectedImage._id ? updatedImage : img
          ));
          
          setApprovalDialogOpen(false);
          setProcessing(false);
          toast.success('✅ Image approved successfully (Demo Mode)');
        }, 1000);
        return;
      }
      
      // Real API call - check if we have report ID
      const reportId = selectedImage.report?._id;
      const galleryImageId = selectedImage._id;
      
      if (!reportId) {
        throw new Error('Report ID is required for approval');
      }
      
      console.log('Approving:', { reportId, galleryImageId });
      
      const response = await adminAPI.approveGalleryImage(
        reportId,
        galleryImageId,
        {
          adminNotes: approvalForm.adminNotes,
          featured: approvalForm.featured
        }
      );
      
      if (response.data.success) {
        const updatedImage = {
          ...selectedImage,
          status: 'approved',
          featured: approvalForm.featured,
          adminNotes: approvalForm.adminNotes,
          approvedAt: new Date().toISOString(),
          approvedBy: response.data.data?.approvedBy || { name: 'Admin' }
        };
        
        // Update local state
        setPendingImages(prev => prev.filter(img => img._id !== selectedImage._id));
        setApprovedImages(prev => [updatedImage, ...prev]);
        setAllImages(prev => prev.map(img => 
          img._id === selectedImage._id ? updatedImage : img
        ));
        
        setApprovalDialogOpen(false);
        setProcessing(false);
        toast.success('✅ Image approved successfully!');
      } else {
        throw new Error(response.data.error || 'Approval failed');
      }
      
    } catch (error) {
      console.error('❌ Approval error:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to approve image');
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedImage) {
      toast.error('No image selected');
      return;
    }

    if (!rejectionForm.reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    
    try {
      console.log('🔴 Starting rejection process...');
      
      // Check if this is real data or sample data
      const isSampleData = selectedImage._id.includes('sample-');
      
      if (isSampleData) {
        // Demo mode - simulate rejection
        setTimeout(() => {
          const updatedImage = {
            ...selectedImage,
            status: 'rejected',
            rejectionReason: rejectionForm.reason,
            adminNotes: rejectionForm.adminNotes,
            rejectedAt: new Date().toISOString()
          };
          
          // Update local state
          setPendingImages(prev => prev.filter(img => img._id !== selectedImage._id));
          setRejectedImages(prev => [updatedImage, ...prev]);
          setAllImages(prev => prev.map(img => 
            img._id === selectedImage._id ? updatedImage : img
          ));
          
          setRejectionDialogOpen(false);
          setProcessing(false);
          toast.success('❌ Image rejected (Demo Mode)');
        }, 1000);
        return;
      }
      
      // Real API call
      const reportId = selectedImage.report?._id;
      const galleryImageId = selectedImage._id;
      
      if (!reportId) {
        throw new Error('Report ID is required for rejection');
      }
      
      const response = await adminAPI.rejectGalleryImage(
        reportId,
        galleryImageId,
        {
          reason: rejectionForm.reason,
          adminNotes: rejectionForm.adminNotes
        }
      );
      
      if (response.data.success) {
        const updatedImage = {
          ...selectedImage,
          status: 'rejected',
          rejectionReason: rejectionForm.reason,
          adminNotes: rejectionForm.adminNotes,
          rejectedAt: new Date().toISOString()
        };
        
        // Update local state
        setPendingImages(prev => prev.filter(img => img._id !== selectedImage._id));
        setRejectedImages(prev => [updatedImage, ...prev]);
        setAllImages(prev => prev.map(img => 
          img._id === selectedImage._id ? updatedImage : img
        ));
        
        setRejectionDialogOpen(false);
        setProcessing(false);
        toast.success('❌ Image rejected');
      } else {
        throw new Error(response.data.error || 'Rejection failed');
      }
      
    } catch (error) {
      console.error('❌ Rejection error:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to reject image');
      setProcessing(false);
    }
  };

  const handleOpenApprovalDialog = (image) => {
    setSelectedImage(image);
    setApprovalForm({
      adminNotes: '',
      featured: image.featured || false
    });
    setApprovalDialogOpen(true);
  };

  const handleOpenRejectionDialog = (image) => {
    setSelectedImage(image);
    setRejectionForm({
      reason: '',
      adminNotes: ''
    });
    setRejectionDialogOpen(true);
  };

  const handleOpenDetailDialog = (image) => {
    setSelectedImage(image);
    setDetailDialogOpen(true);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };

  const getCurrentImages = () => {
    switch (tabValue) {
      case 0: return pendingImages;
      case 1: return approvedImages;
      case 2: return rejectedImages;
      default: return [];
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle color="success" />;
      case 'rejected': return <Cancel color="error" />;
      case 'pending': return <Warning color="warning" />;
      default: return <Info />;
    }
  };

  const getImageCount = () => {
    const currentImages = getCurrentImages();
    return currentImages.length;
  };

  // Get unique categories from all images
  const categories = ['all', ...new Set(allImages.map(img => img.report?.category).filter(Boolean))];

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
            Loading gallery images...
          </Typography>
        </Box>
      </Container>
    );
  }

  const currentImages = getCurrentImages();
  const paginatedImages = currentImages.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Container maxWidth="xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Gallery Image Approvals
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Review and approve transformation images for public gallery
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchAllImages}
                disabled={processing}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={() => toast.success('Export feature coming soon!')}
              >
                Export
              </Button>
            </Box>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight={800}>
                    {pendingImages.length}
                  </Typography>
                  <Typography variant="body1">Pending Review</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight={800}>
                    {approvedImages.length}
                  </Typography>
                  <Typography variant="body1">Approved</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight={800}>
                    {rejectedImages.length}
                  </Typography>
                  <Typography variant="body1">Rejected</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight={800}>
                    {approvedImages.filter(img => img.featured).length}
                  </Typography>
                  <Typography variant="body1">Featured</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.filter(cat => cat !== 'all').map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  label="Date Range"
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">Last 7 Days</MenuItem>
                  <MenuItem value="month">Last 30 Days</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                  <MenuItem value="category">Category</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setDateFilter('all');
                  setSortBy('newest');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 4, borderRadius: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                py: 2,
                fontSize: '1rem'
              }
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={tab.value}
                icon={tab.icon}
                iconPosition="start"
                label={
                  <Badge
                    badgeContent={tab.badge}
                    color={tab.color}
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem', height: '20px', minWidth: '20px' } }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {tab.label}
                    </Box>
                  </Badge>
                }
                sx={{
                  color: tabValue === index ? `${tab.color}.main` : 'text.secondary',
                  borderBottom: tabValue === index ? `3px solid` : 'none',
                  borderColor: tabValue === index ? `${tab.color}.main` : 'transparent'
                }}
              />
            ))}
          </Tabs>
        </Paper>

        {/* Images Grid */}
        {getImageCount() === 0 ? (
          <Alert 
            severity={tabValue === 0 ? "info" : tabValue === 1 ? "success" : "error"} 
            sx={{ borderRadius: 2, mb: 4 }}
          >
            <Typography variant="body1">
              {tabValue === 0 ? 'No pending images for approval' : 
               tabValue === 1 ? 'No approved images yet' : 
               'No rejected images yet'}
            </Typography>
            <Typography variant="body2">
              {tabValue === 0 ? 'All transformation images have been reviewed.' :
               tabValue === 1 ? 'Approve some images to see them here.' :
               'No images have been rejected.'}
            </Typography>
          </Alert>
        ) : (
          <>
            <Grid container spacing={3}>
              <AnimatePresence>
                {paginatedImages.map((item) => (
                  <Grid item xs={12} md={6} lg={4} key={item._id}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card sx={{ 
                        borderRadius: 3, 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        border: item.status === 'pending' ? '2px solid' : 'none',
                        borderColor: item.status === 'pending' ? 'warning.main' : 'transparent',
                        '&:hover': {
                          boxShadow: theme.shadows[8],
                          transform: 'translateY(-4px)',
                          transition: 'all 0.3s ease'
                        }
                      }}>
                        {/* Before/After Comparison */}
                        <Box 
                          sx={{ 
                            position: 'relative', 
                            cursor: 'pointer',
                            height: 200,
                            overflow: 'hidden'
                          }} 
                          onClick={() => handleOpenDetailDialog(item)}
                        >
                          <Box sx={{ display: 'flex', height: '100%', position: 'relative' }}>
                            {/* Before Image */}
                            <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                              <img
                                src={item.beforeImage?.url || 'https://via.placeholder.com/400x300?text=Before+Image'}
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
                            
                            {/* After Image */}
                            <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                              <img
                                src={item.afterImage?.url || 'https://via.placeholder.com/400x300?text=After+Image'}
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
                        </Box>

                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ maxWidth: '70%' }}>
                              {item.report?.title || 'Untitled Report'}
                            </Typography>
                            <Chip
                              label={item.status}
                              color={getStatusColor(item.status)}
                              size="small"
                              icon={getStatusIcon(item.status)}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar
                              src={item.uploadedBy?.avatar}
                              sx={{ width: 24, height: 24, mr: 1 }}
                            >
                              {item.uploadedBy?.name?.charAt(0) || 'S'}
                            </Avatar>
                            <Typography variant="caption" color="text.secondary">
                              {item.uploadedBy?.name || 'Staff Member'}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip
                              label={item.report?.category || 'Uncategorized'}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            {item.featured && (
                              <Chip
                                label="Featured"
                                size="small"
                                color="warning"
                                icon={<Star fontSize="small" />}
                              />
                            )}
                          </Box>

                          <Typography variant="caption" color="text.secondary" paragraph>
                            {formatDistanceToNow(new Date(item.uploadedAt || item.createdAt), { addSuffix: true })}
                          </Typography>

                          {item.adminNotes && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontStyle: 'italic' }}>
                              Note: {item.adminNotes}
                            </Typography>
                          )}
                        </CardContent>

                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => handleOpenDetailDialog(item)}
                            sx={{ mr: 'auto' }}
                          >
                            View Details
                          </Button>
                          
                          {item.status === 'pending' && (
                            <>
                              <Tooltip title="Approve">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleOpenApprovalDialog(item)}
                                >
                                  <ThumbUp />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleOpenRejectionDialog(item)}
                                >
                                  <ThumbDown />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </CardActions>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </AnimatePresence>
            </Grid>

            {/* Pagination */}
            {currentImages.length > rowsPerPage && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={Math.ceil(currentImages.length / rowsPerPage)}
                  page={page + 1}
                  onChange={(event, value) => setPage(value - 1)}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}

        {/* Approval Dialog */}
        <Dialog
          open={approvalDialogOpen}
          onClose={() => !processing && setApprovalDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" />
              <Typography variant="h6">Approve Transformation Images</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedImage && (
              <>
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                  <Typography variant="body2">
                    Approving these images will make them visible in the public gallery.
                  </Typography>
                </Alert>

                {/* Image Preview */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Image Comparison
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <Box
                          component="img"
                          src={selectedImage.beforeImage?.url || 'https://via.placeholder.com/400x300?text=Before+Image'}
                          alt="Before"
                          sx={{
                            width: '100%',
                            height: 200,
                            objectFit: 'cover',
                          }}
                        />
                        <CardContent sx={{ p: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            BEFORE: {selectedImage.beforeImage?.caption || 'Original condition'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <Box
                          component="img"
                          src={selectedImage.afterImage?.url || 'https://via.placeholder.com/400x300?text=After+Image'}
                          alt="After"
                          sx={{
                            width: '100%',
                            height: 200,
                            objectFit: 'cover',
                          }}
                        />
                        <CardContent sx={{ p: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            AFTER: {selectedImage.afterImage?.caption || 'Completed work'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>

                {/* Report Info */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Report Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Title:
                      </Typography>
                      <Typography variant="body2">{selectedImage.report?.title}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Category:
                      </Typography>
                      <Typography variant="body2">{selectedImage.report?.category}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Location:
                      </Typography>
                      <Typography variant="body2">{selectedImage.report?.location?.address}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Uploaded By:
                      </Typography>
                      <Typography variant="body2">{selectedImage.uploadedBy?.name}</Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Admin Notes */}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Approval Notes (Optional)"
                  placeholder="Add any notes or feedback for this approval..."
                  value={approvalForm.adminNotes}
                  onChange={(e) => setApprovalForm({ ...approvalForm, adminNotes: e.target.value })}
                  sx={{ mb: 2 }}
                />

                {/* Featured Option */}
                <FormGroup sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={approvalForm.featured}
                        onChange={(e) => setApprovalForm({ ...approvalForm, featured: e.target.checked })}
                        color="warning"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Star sx={{ color: approvalForm.featured ? 'warning.main' : 'inherit' }} />
                        <Typography>Feature this transformation on homepage</Typography>
                      </Box>
                    }
                  />
                  {approvalForm.featured && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                      Featured images appear prominently in the gallery and homepage
                    </Typography>
                  )}
                </FormGroup>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setApprovalDialogOpen(false)} 
              disabled={processing}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <ThumbUp />}
              onClick={handleApprove}
              disabled={processing}
            >
              {processing ? 'Approving...' : 'Approve Images'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog
          open={rejectionDialogOpen}
          onClose={() => !processing && setRejectionDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Cancel color="error" />
              <Typography variant="h6">Reject Transformation Images</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedImage && (
              <>
                <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                  <Typography variant="body2">
                    Rejected images will not appear in the gallery. Staff will be notified.
                  </Typography>
                </Alert>

                {/* Image Preview */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Images to Reject
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <Box
                          component="img"
                          src={selectedImage.beforeImage?.url || 'https://via.placeholder.com/400x300?text=Before+Image'}
                          alt="Before"
                          sx={{
                            width: '100%',
                            height: 150,
                            objectFit: 'cover',
                          }}
                        />
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <Box
                          component="img"
                          src={selectedImage.afterImage?.url || 'https://via.placeholder.com/400x300?text=After+Image'}
                          alt="After"
                          sx={{
                            width: '100%',
                            height: 150,
                            objectFit: 'cover',
                          }}
                        />
                      </Card>
                    </Grid>
                  </Grid>
                </Box>

                {/* Rejection Reason */}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Rejection Reason *"
                  placeholder="Please specify why these images are being rejected..."
                  value={rejectionForm.reason}
                  onChange={(e) => setRejectionForm({ ...rejectionForm, reason: e.target.value })}
                  required
                  sx={{ mb: 2 }}
                  error={!rejectionForm.reason.trim()}
                  helperText={!rejectionForm.reason.trim() ? "Rejection reason is required" : ""}
                />

                {/* Admin Notes */}
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Additional Notes (Optional)"
                  placeholder="Any additional feedback for staff..."
                  value={rejectionForm.adminNotes}
                  onChange={(e) => setRejectionForm({ ...rejectionForm, adminNotes: e.target.value })}
                  sx={{ mb: 2 }}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setRejectionDialogOpen(false)} 
              disabled={processing}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <ThumbDown />}
              onClick={handleReject}
              disabled={processing || !rejectionForm.reason.trim()}
            >
              {processing ? 'Rejecting...' : 'Reject Images'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          {selectedImage && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{selectedImage.report?.title || 'Transformation Details'}</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={selectedImage.status}
                      color={getStatusColor(selectedImage.status)}
                      icon={getStatusIcon(selectedImage.status)}
                    />
                    {selectedImage.featured && (
                      <Chip
                        label="Featured"
                        color="warning"
                        icon={<Star />}
                        size="small"
                      />
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
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        mr: 2
                      }}>
                        BEFORE
                      </Box>
                      Original Condition
                    </Typography>
                    <Box sx={{ mb: 2, border: '2px solid', borderColor: 'error.main', borderRadius: 2, p: 1 }}>
                      <img
                        src={selectedImage.beforeImage?.url || 'https://via.placeholder.com/600x400?text=Before+Image'}
                        alt="Before"
                        style={{
                          width: '100%',
                          maxHeight: 400,
                          objectFit: 'contain',
                          borderRadius: 8
                        }}
                      />
                    </Box>
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Details:</Typography>
                      <Typography variant="body2">
                        <strong>Caption:</strong> {selectedImage.beforeImage?.caption || 'Original image'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Uploaded:</strong> {formatDistanceToNow(new Date(selectedImage.uploadedAt), { addSuffix: true })}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* After Image */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ 
                        bgcolor: 'success.light', 
                        color: 'success.contrastText',
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        mr: 2
                      }}>
                        AFTER
                      </Box>
                      Completed Work
                    </Typography>
                    <Box sx={{ mb: 2, border: '2px solid', borderColor: 'success.main', borderRadius: 2, p: 1 }}>
                      <img
                        src={selectedImage.afterImage?.url || 'https://via.placeholder.com/600x400?text=After+Image'}
                        alt="After"
                        style={{
                          width: '100%',
                          maxHeight: 400,
                          objectFit: 'contain',
                          borderRadius: 8
                        }}
                      />
                    </Box>
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Details:</Typography>
                      <Typography variant="body2">
                        <strong>Caption:</strong> {selectedImage.afterImage?.caption || 'Completed work'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Uploaded By:</strong> {selectedImage.uploadedBy?.name || 'Staff Member'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Date:</strong> {format(new Date(selectedImage.uploadedAt), 'PPP')}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                {/* Report & Approval Information */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>Report Information</Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="body2">
                        <strong>Title:</strong> {selectedImage.report?.title || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Category:</strong> {selectedImage.report?.category || 'Uncategorized'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Location:</strong> {selectedImage.report?.location?.address || 'Not specified'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status:</strong> {selectedImage.report?.status || 'Completed'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>Approval Information</Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="body2">
                        <strong>Current Status:</strong> {selectedImage.status}
                      </Typography>
                      {selectedImage.approvedAt && (
                        <Typography variant="body2">
                          <strong>Approved:</strong> {format(new Date(selectedImage.approvedAt), 'PPP')}
                        </Typography>
                      )}
                      {selectedImage.rejectedAt && (
                        <Typography variant="body2">
                          <strong>Rejected:</strong> {format(new Date(selectedImage.rejectedAt), 'PPP')}
                        </Typography>
                      )}
                      {selectedImage.featured && (
                        <Typography variant="body2">
                          <strong>Featured:</strong> Yes
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Admin Notes / Rejection Reason */}
                  {selectedImage.adminNotes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        {selectedImage.status === 'rejected' ? 'Rejection Details' : 'Admin Notes'}
                      </Typography>
                      <Alert 
                        severity={selectedImage.status === 'rejected' ? 'error' : 'info'} 
                        sx={{ borderRadius: 2 }}
                      >
                        {selectedImage.status === 'rejected' && selectedImage.rejectionReason && (
                          <Typography variant="body2" paragraph>
                            <strong>Reason:</strong> {selectedImage.rejectionReason}
                          </Typography>
                        )}
                        {selectedImage.adminNotes && (
                          <Typography variant="body2">
                            <strong>Notes:</strong> {selectedImage.adminNotes}
                          </Typography>
                        )}
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
                {selectedImage.status === 'pending' && (
                  <>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<ThumbDown />}
                      onClick={() => {
                        setDetailDialogOpen(false);
                        handleOpenRejectionDialog(selectedImage);
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<ThumbUp />}
                      onClick={() => {
                        setDetailDialogOpen(false);
                        handleOpenApprovalDialog(selectedImage);
                      }}
                    >
                      Approve
                    </Button>
                  </>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default ImageApprovals;