import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  Favorite,
  Share,
  Paid,
  CalendarToday,
  LocationOn,
  MoreVert,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const DonationCard = ({ donation }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(donation.likes || 0);
  const theme = useTheme();

  const handleLike = () => {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  const handleShare = () => {
    // Implement share functionality
    console.log('Share donation:', donation);
  };

  const getCauseColor = (cause) => {
    const colors = {
      general: theme.palette.primary.main,
      pothole: theme.palette.warning.main,
      lighting: theme.palette.info.main,
      greenery: theme.palette.success.main,
      safety: theme.palette.error.main,
    };
    return colors[cause] || theme.palette.grey[500];
  };

  const getCauseLabel = (cause) => {
    const labels = {
      general: 'General Fund',
      pothole: 'Pothole Repair',
      lighting: 'Street Lighting',
      greenery: 'Greenery',
      safety: 'Road Safety',
    };
    return labels[cause] || 'General';
  };

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, scale: 0.95 }}
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
            boxShadow: theme.shadows[4],
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          {/* Donor Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: donation.anonymous 
                  ? theme.palette.grey[500] 
                  : (donation.avatarColor || theme.palette.primary.main),
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              {donation.anonymous ? '😊' : (donation.name?.charAt(0) || 'D')}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                {donation.anonymous ? 'Anonymous Supporter' : (donation.name || 'Donor')}
              </Typography>
              {!donation.anonymous && donation.email && (
                <Typography variant="body2" color="text.secondary">
                  {donation.email}
                </Typography>
              )}
            </Box>
            <IconButton size="small">
              <MoreVert />
            </IconButton>
          </Box>

          {/* Donation Amount */}
          <Box
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              backgroundColor: theme.palette.success.main + '10',
              border: `1px solid ${theme.palette.success.main + '30'}`,
              textAlign: 'center',
            }}
          >
            <Paid sx={{ fontSize: 48, color: theme.palette.success.main, mb: 1 }} />
            <Typography variant="h3" fontWeight={800} color={theme.palette.success.main}>
              ₹{donation.amount.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Donated to {getCauseLabel(donation.cause)}
            </Typography>
          </Box>

          {/* Cause & Details */}
          <Box sx={{ mb: 3 }}>
            <Chip
              label={getCauseLabel(donation.cause)}
              size="small"
              sx={{
                backgroundColor: getCauseColor(donation.cause) + '20',
                color: getCauseColor(donation.cause),
                fontWeight: 600,
                mb: 2,
              }}
            />
            
            {donation.message && (
              <Box
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  backgroundColor: theme.palette.background.default,
                  borderLeft: `3px solid ${theme.palette.primary.main}`,
                }}
              >
                <Typography variant="body2" fontStyle="italic" color="text.secondary">
                  "{donation.message}"
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, color: 'text.secondary' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarToday sx={{ fontSize: 16 }} />
                <Typography variant="caption">
                  {format(new Date(donation.date), 'MMM dd, yyyy')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn sx={{ fontSize: 16 }} />
                <Typography variant="caption">
                  {donation.city || 'Multiple Locations'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Stats & Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton size="small" onClick={handleLike} color={liked ? 'error' : 'default'}>
                <Favorite fontSize="small" />
              </IconButton>
              <Typography variant="body2">{likes}</Typography>
              
              <IconButton size="small" onClick={handleShare}>
                <Share fontSize="small" />
              </IconButton>
            </Box>

            <Typography variant="caption" color="text.secondary">
              Transaction ID: {donation.transactionId?.slice(-8)}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DonationCard;