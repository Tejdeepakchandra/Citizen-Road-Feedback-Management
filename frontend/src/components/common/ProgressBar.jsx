import React from 'react';
import { Box, LinearProgress, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

const ProgressBar = ({
  value,
  max = 100,
  label,
  showValue = true,
  color = 'primary',
  size = 'medium',
  variant = 'determinate',
  animate = true,
}) => {
  const theme = useTheme();
  const percentage = (value / max) * 100;

  const getColor = () => {
    if (typeof color === 'string') {
      return theme.palette[color]?.main || color;
    }
    return color;
  };

  const getSizeProps = () => {
    switch (size) {
      case 'small':
        return { height: 4, borderRadius: 2 };
      case 'large':
        return { height: 12, borderRadius: 6 };
      default:
        return { height: 8, borderRadius: 4 };
    }
  };

  const getStatusColor = (val) => {
    if (val >= 80) return theme.palette.success.main;
    if (val >= 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const barColor = color === 'auto' ? getStatusColor(percentage) : getColor();

  return (
    <Box sx={{ width: '100%' }}>
      {(label || showValue) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          {label && (
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          )}
          {showValue && (
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {value} / {max} ({Math.round(percentage)}%)
            </Typography>
          )}
        </Box>
      )}
      
      <Box sx={{ position: 'relative' }}>
        {variant === 'buffer' && (
          <LinearProgress
            variant="buffer"
            value={percentage}
            valueBuffer={percentage + 10}
            sx={{
              ...getSizeProps(),
              backgroundColor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar1': {
                backgroundColor: barColor,
                borderRadius: getSizeProps().borderRadius,
              },
              '& .MuiLinearProgress-bar2': {
                backgroundColor: barColor + '40',
                borderRadius: getSizeProps().borderRadius,
              },
            }}
          />
        )}
        
        {variant === 'determinate' && (
          <Box sx={{ position: 'relative', ...getSizeProps(), backgroundColor: theme.palette.grey[200] }}>
            {animate ? (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{
                  height: '100%',
                  backgroundColor: barColor,
                  borderRadius: getSizeProps().borderRadius,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: `${percentage}%`,
                  height: '100%',
                  backgroundColor: barColor,
                  borderRadius: getSizeProps().borderRadius,
                  transition: 'width 0.3s ease',
                }}
              />
            )}
          </Box>
        )}
        
        {variant === 'indeterminate' && (
          <LinearProgress
            variant="indeterminate"
            sx={{
              ...getSizeProps(),
              backgroundColor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                backgroundColor: barColor,
                borderRadius: getSizeProps().borderRadius,
              },
            }}
          />
        )}
      </Box>
      
      {/* Steps Indicator (Optional) */}
      {max <= 10 && variant === 'determinate' && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          {Array.from({ length: max + 1 }).map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 2,
                height: 6,
                backgroundColor: index <= value ? barColor : theme.palette.grey[300],
                borderRadius: 1,
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ProgressBar;