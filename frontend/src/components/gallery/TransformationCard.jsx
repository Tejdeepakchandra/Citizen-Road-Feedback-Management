import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  Button,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  Favorite,
  Share,
  MoreVert,
  Visibility,
  ThumbUp,
  Comment,
  CalendarToday,
  LocationOn,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const TransformationCard = ({ transformation, onView, onLike, onShare }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(transformation.likes || 0);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();

  const handleLike = () => {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
    if (onLike) onLike(transformation._id, !liked);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleShare = () => {
    handleMenuClose();
    if (onShare) onShare(transformation);
  };

  const handleView = () => {
    if (onView) onView(transformation);
  };

  const getImprovementScore = () => {
    const score = transformation.improvementScore || 0;
    if (score >= 90) return { label: 'Excellent', color: 'success' };
    if (score >= 70) return { label: 'Good', color: 'primary' };
    if (score >= 50) return { label: 'Average', color: 'warning' };
    return { label: 'Poor', color: 'error' };
  };

  const improvement = getImprovementScore();

  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme.shadows[8],
          },
        }}
      >
        {/* Image Comparison Preview */}
        <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
          <CardMedia
            component="img"
            height="200"
            image={transformation.afterImage}
            alt="After transformation"
            sx={{ objectFit: 'cover' }}
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
            <CardMedia
              component="img"
              height="200"
              image={transformation.beforeImage}
              alt="Before transformation"
              sx={{ objectFit: 'cover', width: '200%', height: '100%' }}
            />
          </Box>
          
          {/* Improvement Badge */}
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 2,
            }}
          >
            <Chip
              label={`${improvement.label} (${transformation.improvementScore || 0}%)`}
              size="small"
              color={improvement.color}
              sx={{ fontWeight: 600 }}
            />
          </Box>

          {/* Labels */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              zIndex: 2,
              display: 'flex',
              gap: 1,
            }}
          >
            <Chip
              label="BEFORE"
              size="small"
              sx={{
                backgroundColor: 'rgba(239, 68, 68, 0.9)',
                color: '#fff',
                fontWeight: 600,
              }}
            />
            <Chip
              label="AFTER"
              size="small"
              sx={{
                backgroundColor: 'rgba(16, 185, 129, 0.9)',
                color: '#fff',
                fontWeight: 600,
              }}
            />
          </Box>
        </Box>

        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          {/* Title and Menu */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="h6" fontWeight={600} noWrap sx={{ maxWidth: '80%' }}>
              {transformation.title}
            </Typography>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>

          {/* Description */}
          <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2 }}>
            {transformation.description?.length > 100
              ? `${transformation.description.substring(0, 100)}...`
              : transformation.description}
          </Typography>

          {/* Location and Date */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {transformation.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {transformation.location}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {format(new Date(transformation.date), 'MMM dd, yyyy')}
              </Typography>
            </Box>
          </Box>

          {/* Stats */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton size="small" onClick={handleLike} color={liked ? 'error' : 'default'}>
                <Favorite fontSize="small" />
              </IconButton>
              <Typography variant="body2">{likes}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Comment fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2">{transformation.comments || 0}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Visibility fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2">{transformation.views || 0}</Typography>
            </Box>
          </Box>

          {/* Action Button */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleView}
            sx={{
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: theme.shadows[4],
              },
              transition: 'all 0.2s ease',
            }}
          >
            View Transformation
          </Button>
        </CardContent>

        {/* Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleView}>
            <Visibility sx={{ mr: 1 }} fontSize="small" />
            View Details
          </MenuItem>
          <MenuItem onClick={handleShare}>
            <Share sx={{ mr: 1 }} fontSize="small" />
            Share
          </MenuItem>
          <MenuItem onClick={handleLike}>
            <Favorite sx={{ mr: 1 }} fontSize="small" color={liked ? 'error' : 'inherit'} />
            {liked ? 'Unlike' : 'Like'}
          </MenuItem>
        </Menu>
      </Card>
    </motion.div>
  );
};

export default TransformationCard;