import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import { PlayArrow, Pause, VolumeUp, VolumeOff } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { StatsGrid } from './StatsCounter';

const VideoHero = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef(null);
  const theme = useTheme();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setTimeout(() => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            console.log('Autoplay blocked, waiting for interaction');
            setIsPlaying(false);
          });
        }
      }, 500);
    };

    video.addEventListener('canplay', handleCanPlay);
    setIsLoaded(true);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
          zIndex: 1,
        },
      }}
    >
      {/* Background Video with Glassmorphism Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `linear-gradient(to bottom, 
              ${alpha(theme.palette.background.default, 0.2)} 0%, 
              ${alpha(theme.palette.background.default, 0.4)} 30%,
              ${alpha(theme.palette.background.default, 0.8)} 100%)`,
            backdropFilter: 'blur(2px)',
          },
        }}
      >
        <Box
          component="video"
          ref={videoRef}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            minWidth: '100%',
            minHeight: '100%',
            width: 'auto',
            height: 'auto',
            transform: 'translate(-50%, -50%)',
            objectFit: 'cover',
            opacity: isLoaded ? 0.9 : 0,
            transition: 'opacity 1s ease-in-out',
            filter: 'brightness(0.7) contrast(1.1)',
          }}
        >
          <source src="/videos/Fixing_Bad_Road_Transition_Video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </Box>
      </Box>

      {/* Animated Neon Particles */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        {[...Array(20)].map((_, i) => (
          <Box
            key={i}
            component={motion.div}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.1,
            }}
            sx={{
              position: 'absolute',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: '2px',
              height: '2px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${theme.palette.primary.neon}, transparent)`,
              boxShadow: theme.palette.primary.glow,
            }}
          />
        ))}
      </Box>

      {/* Content */}
      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 2,
          py: { xs: 8, md: 12 },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.75rem', md: '4rem', lg: '5rem' },
              fontWeight: 800,
              mb: 3,
              textAlign: 'center',
              '& span': {
                display: 'block',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #0EA5E9 50%, #10B981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 40px rgba(139, 92, 246, 0.5)',
              },
            }}
          >
            <span>Transforming Roads,</span>
            <span>Connecting Lives</span>
          </Typography>

          <Typography
            variant="h5"
            sx={{
              mb: 5,
              maxWidth: '700px',
              mx: 'auto',
              textAlign: 'center',
              color: 'text.secondary',
              fontWeight: 400,
              lineHeight: 1.6,
              backdropFilter: 'blur(10px)',
              background: theme.palette.background.glass,
              borderRadius: 4,
              p: 3,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            Join thousands of citizens in making our roads safer, cleaner, and
            more efficient. Report issues, track progress, and witness the
            transformation.
          </Typography>

          {/* CTA Buttons with Neon Glow */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 3,
              justifyContent: 'center',
              mb: 8,
            }}
          >
            <Button
              variant="contained"
              size="large"
              href="/reports/new"
              sx={{
                px: 6,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #8B5CF6 0%, #0EA5E9 100%)',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4), 0 0 30px rgba(14, 165, 233, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                  transform: 'rotate(45deg)',
                  transition: 'all 0.6s ease',
                },
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 12px 40px rgba(139, 92, 246, 0.6), 0 0 40px rgba(14, 165, 233, 0.4)',
                  '&::before': {
                    left: '100%',
                  },
                },
              }}
            >
              Report an Issue
            </Button>

            <Button
              variant="outlined"
              size="large"
              href="/gallery"
              sx={{
                px: 6,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 3,
                borderWidth: 2,
                borderColor: 'rgba(139, 92, 246, 0.4)',
                color: 'text.primary',
                backdropFilter: 'blur(10px)',
                background: theme.palette.background.glass,
                '&:hover': {
                  borderColor: '#8B5CF6',
                  background: 'rgba(139, 92, 246, 0.1)',
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
                },
              }}
            >
              View Transformations
            </Button>
          </Box>

          {/* Video Controls */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              mb: 6,
            }}
          >
            <IconButton
              onClick={handlePlayPause}
              sx={{
                backdropFilter: 'blur(10px)',
                background: theme.palette.background.glass,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                width: 56,
                height: 56,
                '&:hover': {
                  background: 'rgba(139, 92, 246, 0.2)',
                  borderColor: theme.palette.primary.main,
                  boxShadow: theme.palette.primary.glow,
                },
              }}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>

            <IconButton
              onClick={handleVolumeToggle}
              sx={{
                backdropFilter: 'blur(10px)',
                background: theme.palette.background.glass,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                width: 56,
                height: 56,
                '&:hover': {
                  background: 'rgba(14, 165, 233, 0.2)',
                  borderColor: theme.palette.secondary.main,
                  boxShadow: theme.palette.secondary.glow,
                },
              }}
            >
              {isMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
          </Box>
        </motion.div>

        {/* Stats Grid */}
        <Box sx={{ mt: 8 }}>
          <StatsGrid />
        </Box>

        {/* Scroll Indicator */}
        <Box
          component={motion.div}
          animate={{
            y: [0, 10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          sx={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2,
            cursor: 'pointer',
          }}
          onClick={() => {
            window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
          }}
        >
          <Box
            sx={{
              width: 30,
              height: 50,
              border: '2px solid rgba(139, 92, 246, 0.4)',
              borderRadius: 15,
              display: 'flex',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              background: theme.palette.background.glass,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 12,
                background: 'linear-gradient(135deg, #8B5CF6 0%, #0EA5E9 100%)',
                borderRadius: 3,
                mt: 1,
              }}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default VideoHero;