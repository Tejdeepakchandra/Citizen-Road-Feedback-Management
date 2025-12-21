import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Slider,
  useTheme,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  Compare,
  Fullscreen,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const BeforeAfterSlider = ({ beforeImage, afterImage, title, description, date }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const containerRef = useRef(null);
  const theme = useTheme();

  const handleSliderChange = (event, newValue) => {
    setSliderPosition(newValue);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={date}
              size="small"
              variant="outlined"
            />
            <IconButton
              size="small"
              onClick={() => setIsComparing(!isComparing)}
              color={isComparing ? 'primary' : 'default'}
            >
              <Compare />
            </IconButton>
            <IconButton size="small" onClick={handleFullscreen}>
              <Fullscreen />
            </IconButton>
          </Box>
        </Box>

        {description && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {description}
          </Typography>
        )}

        <Box
          ref={containerRef}
          sx={{
            position: 'relative',
            width: '100%',
            height: 400,
            overflow: 'hidden',
            borderRadius: 2,
            cursor: 'col-resize',
            backgroundColor: theme.palette.background.default,
          }}
        >
          {/* Before Image */}
          <Box
            component="img"
            src={beforeImage}
            alt="Before"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${zoom})`,
              transformOrigin: 'center',
            }}
          />

          {/* After Image */}
          <Box
            component="img"
            src={afterImage}
            alt="After"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              clipPath: `inset(0 0 0 ${sliderPosition}%)`,
              transform: `scale(${zoom})`,
              transformOrigin: 'center',
            }}
          />

          {/* Slider Handle */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: `${sliderPosition}%`,
              height: '100%',
              width: 4,
              backgroundColor: theme.palette.primary.main,
              transform: 'translateX(-2px)',
              cursor: 'col-resize',
              zIndex: 2,
              '&:hover': {
                width: 6,
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              },
              '&::after': {
                content: '"↔"',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#fff',
                fontWeight: 600,
              },
            }}
          />

          {/* Labels */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 2,
            }}
          >
            <Chip
              label="BEFORE"
              size="small"
              sx={{
                backgroundColor: theme.palette.error.main,
                color: '#fff',
                fontWeight: 600,
              }}
            />
          </Box>
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 2,
            }}
          >
            <Chip
              label="AFTER"
              size="small"
              sx={{
                backgroundColor: theme.palette.success.main,
                color: '#fff',
                fontWeight: 600,
              }}
            />
          </Box>

          {/* Controls */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderRadius: 2,
              p: 1,
              zIndex: 2,
            }}
          >
            <IconButton size="small" onClick={handleZoomOut} sx={{ color: '#fff' }}>
              <ZoomOut />
            </IconButton>
            <Typography variant="caption" sx={{ color: '#fff', minWidth: 40, textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </Typography>
            <IconButton size="small" onClick={handleZoomIn} sx={{ color: '#fff' }}>
              <ZoomIn />
            </IconButton>
          </Box>
        </Box>

        {/* Slider Control */}
        <Box sx={{ mt: 2, px: 2 }}>
          <Slider
            value={sliderPosition}
            onChange={handleSliderChange}
            aria-labelledby="slider-position"
            sx={{
              color: theme.palette.primary.main,
              '& .MuiSlider-thumb': {
                width: 24,
                height: 24,
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Drag to compare
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {sliderPosition.toFixed(0)}% split
            </Typography>
          </Box>
        </Box>

        {/* Comparison Mode Indicator */}
        {isComparing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Comparison Mode:</strong> Drag the slider to compare before and after images side by side.
              </Typography>
            </Alert>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default BeforeAfterSlider;