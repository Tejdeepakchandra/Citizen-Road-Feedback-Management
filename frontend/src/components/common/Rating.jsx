// src/components/common/Rating.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import { Star, StarBorder, StarHalf } from '@mui/icons-material';

const Rating = ({ value, precision = 0.5, readOnly = true, size = 'medium' }) => {
  const stars = [];
  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;
  
  for (let i = 1; i <= 5; i++) {
    if (value >= i) {
      stars.push(<Star key={i} sx={{ fontSize: iconSize, color: '#FFD700' }} />);
    } else if (value >= i - 0.5) {
      stars.push(<StarHalf key={i} sx={{ fontSize: iconSize, color: '#FFD700' }} />);
    } else {
      stars.push(<StarBorder key={i} sx={{ fontSize: iconSize, color: '#FFD700' }} />);
    }
  }
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {stars}
      {!readOnly && (
        <Typography variant="caption" sx={{ ml: 1 }}>
          ({value.toFixed(1)})
        </Typography>
      )}
    </Box>
  );
};

export default Rating;