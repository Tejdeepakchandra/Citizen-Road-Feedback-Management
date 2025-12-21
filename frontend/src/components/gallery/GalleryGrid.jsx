import React, { useState } from 'react';
import {
  Grid,
  Box,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Pagination,
  useTheme,
} from '@mui/material';
import {
  Search,
  FilterList,
  Sort,
  GridView,
  ViewList,
} from '@mui/icons-material';
import TransformationCard from './TransformationCard';

const GalleryGrid = ({ transformations = [] }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const theme = useTheme();

  const itemsPerPage = viewMode === 'grid' ? 9 : 6;

  const categories = [
    { value: 'all', label: 'All Categories', count: transformations.length },
    { value: 'pothole', label: 'Pothole Repairs', count: transformations.filter(t => t.category === 'pothole').length },
    { value: 'lighting', label: 'Lighting Improvements', count: transformations.filter(t => t.category === 'lighting').length },
    { value: 'drainage', label: 'Drainage Solutions', count: transformations.filter(t => t.category === 'drainage').length },
    { value: 'road_markings', label: 'Road Markings', count: transformations.filter(t => t.category === 'road_markings').length },
    { value: 'greenery', label: 'Greenery & Beautification', count: transformations.filter(t => t.category === 'greenery').length },
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'most_liked', label: 'Most Liked' },
    { value: 'most_viewed', label: 'Most Viewed' },
    { value: 'highest_improvement', label: 'Highest Improvement' },
  ];

  const filteredTransformations = transformations.filter(transformation => {
    // Search filter
    const matchesSearch = 
      transformation.title.toLowerCase().includes(search.toLowerCase()) ||
      transformation.description.toLowerCase().includes(search.toLowerCase()) ||
      transformation.location.toLowerCase().includes(search.toLowerCase());
    
    // Category filter
    const matchesCategory = filter === 'all' || transformation.category === filter;
    
    return matchesSearch && matchesCategory;
  });

  const sortedTransformations = [...filteredTransformations].sort((a, b) => {
    switch (sort) {
      case 'newest':
        return new Date(b.date) - new Date(a.date);
      case 'oldest':
        return new Date(a.date) - new Date(b.date);
      case 'most_liked':
        return (b.likes || 0) - (a.likes || 0);
      case 'most_viewed':
        return (b.views || 0) - (a.views || 0);
      case 'highest_improvement':
        return (b.improvementScore || 0) - (a.improvementScore || 0);
      default:
        return 0;
    }
  });

  const paginatedTransformations = sortedTransformations.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDetails = (transformation) => {
    // Navigate to transformation details page
    console.log('View transformation:', transformation);
  };

  const handleLike = (id, liked) => {
    // Handle like action
    console.log(`${liked ? 'Liked' : 'Unliked'} transformation:`, id);
  };

  const handleShare = (transformation) => {
    // Handle share action
    console.log('Share transformation:', transformation);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Transformation Gallery
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Witness the incredible transformations of roads and infrastructure in our city.
          See before and after comparisons of completed projects.
        </Typography>
      </Box>

      {/* Controls */}
      <Box sx={{ mb: 4, p: 3, backgroundColor: theme.palette.background.paper, borderRadius: 3, boxShadow: theme.shadows[1] }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search transformations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={filter}
                label="Category"
                onChange={(e) => setFilter(e.target.value)}
                startAdornment={<FilterList sx={{ mr: 1 }} />}
              >
                {categories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span>{category.label}</span>
                      <Chip label={category.count} size="small" />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sort}
                label="Sort By"
                onChange={(e) => setSort(e.target.value)}
                startAdornment={<Sort sx={{ mr: 1 }} />}
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
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <IconButton
                size="small"
                onClick={() => setViewMode('grid')}
                color={viewMode === 'grid' ? 'primary' : 'default'}
                title="Grid View"
              >
                <GridView />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setViewMode('list')}
                color={viewMode === 'list' ? 'primary' : 'default'}
                title="List View"
              >
                <ViewList />
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        {/* Active Filters */}
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {filter !== 'all' && (
            <Chip
              label={`Category: ${categories.find(c => c.value === filter)?.label}`}
              size="small"
              onDelete={() => setFilter('all')}
            />
          )}
          {search && (
            <Chip
              label={`Search: "${search}"`}
              size="small"
              onDelete={() => setSearch('')}
            />
          )}
          <Chip
            label={`Sort: ${sortOptions.find(s => s.value === sort)?.label}`}
            size="small"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Results Count */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Showing {paginatedTransformations.length} of {filteredTransformations.length} transformations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Page {page} of {Math.ceil(filteredTransformations.length / itemsPerPage)}
        </Typography>
      </Box>

      {/* Transformations Grid/List */}
      {paginatedTransformations.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {paginatedTransformations.map((transformation) => (
              <Grid 
                item 
                key={transformation._id} 
                xs={12} 
                sm={viewMode === 'grid' ? 6 : 12}
                md={viewMode === 'grid' ? 4 : 12}
                lg={viewMode === 'grid' ? 4 : 12}
              >
                <TransformationCard
                  transformation={transformation}
                  onView={handleViewDetails}
                  onLike={handleLike}
                  onShare={handleShare}
                />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {filteredTransformations.length > itemsPerPage && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={Math.ceil(filteredTransformations.length / itemsPerPage)}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No transformations found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filter criteria
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default GalleryGrid;