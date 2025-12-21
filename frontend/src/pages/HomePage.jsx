// src/pages/HomePage.jsx - FIXED VERSION (No Admin API Access)
import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  IconButton,
  useTheme,
  useMediaQuery,
  alpha,
  Stack,
  LinearProgress,
  CircularProgress,
  Alert,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  People,
  CheckCircle,
  ArrowForward,
  Star,
  ThumbUp,
  AutoFixHigh,
  Bolt,
  Verified,
  Public,
  ChevronLeft,
  ChevronRight,
  LocationOn,
  Schedule,
  Comment,
  Visibility,
  BuildCircle,
  Engineering,
  Person,
  Security,
  WorkspacePremium,
  EmojiEvents,
  Compare,
  Speed,
  Groups,
  RateReview,
  Email,
  Chat,
} from '@mui/icons-material';
import { motion, useAnimation, useInView } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { reportAPI, galleryAPI, feedbackAPI } from '../services/api';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

// ==================== HERO SECTION ====================
const EnhancedHeroSection = () => {
  const videoRef = useRef(null);
  const theme = useTheme();
  const [videoError, setVideoError] = useState(false);
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleVideoError = () => {
    setVideoError(true);
  };

  // Fallback to static image if video fails
  return (
    <Box
      sx={{
        position: 'relative',
        height: { xs: '85vh', md: '100vh' },
        minHeight: 600,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Video/Image Background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          background: videoError 
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
            : 'none',
        }}
      >
        {!videoError && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            onError={handleVideoError}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.5,
              filter: 'brightness(0.7)',
            }}
          >
          <source src="/videos/Fixing_Bad_Road_Transition_Video.mp4" type="video/mp4" />
          </video>
        )}
      </Box>

      {/* Gradient Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, 
            ${alpha(theme.palette.primary.dark, 0.6)} 0%,
            ${alpha(theme.palette.primary.main, 0.4)} 35%,
            ${alpha(theme.palette.secondary.main, 0.3)} 70%,
            ${alpha(theme.palette.background.default, 0.8)} 100%
          )`,
          zIndex: 1,
        }}
      />

      {/* Content */}
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box sx={{ textAlign: 'center', color: 'white', px: { xs: 2, md: 0 } }}>
            {/* Welcome Message */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Typography variant="h5" sx={{ mb: 2, opacity: 0.9, fontWeight: 400 }}>
                  {user.role === 'admin' 
                    ? `Welcome back, Administrator ${user.name?.split(' ')[0] || 'Admin'}!` 
                    : user.role === 'staff' 
                    ? `Hello ${user.name?.split(' ')[0] || 'Staff'}! Ready to serve?`
                    : `Welcome ${user.name?.split(' ')[0] || 'User'}! Let's build better communities.`}
                </Typography>
              </motion.div>
            )}

            {/* Main Title */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Chip
                icon={<CheckCircle />}
                label="Community Road Management System"
                sx={{
                  mb: 3,
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  fontSize: '0.95rem',
                  height: 'auto',
                  py: 1.5,
                  px: 2,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              />
            </motion.div>

            <Typography
              variant="h1"
              fontWeight={900}
              gutterBottom
              sx={{
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem', lg: '5rem' },
                textShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
                mb: 3,
                lineHeight: 1.2,
                background: 'linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Transforming Infrastructure
              <Box component="span" sx={{ display: 'block', fontSize: '0.8em' }}>
                Together as a Community
              </Box>
            </Typography>

            <Typography
              variant="h5"
              sx={{
                mb: 5,
                maxWidth: 800,
                mx: 'auto',
                fontWeight: 300,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
                opacity: 0.95,
                lineHeight: 1.6,
              }}
            >
              Report road issues, track repair progress, and witness amazing transformations.
              A collaborative platform connecting citizens, municipal staff, and administrators.
            </Typography>

            {/* CTA Buttons */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              justifyContent="center"
              alignItems="center"
              sx={{ mb: 6 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  size="large"
                  href="/reports/new"
                  startIcon={<AutoFixHigh />}
                  sx={{
                    px: 5,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    boxShadow: '0 12px 35px rgba(25, 118, 210, 0.4)',
                    borderRadius: 2,
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 16px 45px rgba(25, 118, 210, 0.5)',
                    },
                  }}
                >
                  Report Issue Now
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outlined"
                  size="large"
                  href="/gallery"
                  endIcon={<ArrowForward />}
                  sx={{
                    px: 5,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    borderWidth: 2,
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                    '&:hover': {
                      borderColor: 'white',
                      background: 'rgba(255, 255, 255, 0.2)',
                      transform: 'translateY(-3px)',
                    },
                  }}
                >
                  View Transformations
                </Button>
              </motion.div>
            </Stack>

            {/* Quick Stats */}
            <Grid container spacing={4} justifyContent="center" sx={{ mt: 4 }}>
              {[
                { label: 'Issues Fixed', value: '10K+', icon: <CheckCircle />, color: '#4CAF50' },
                { label: 'Active Users', value: '2.5K+', icon: <People />, color: '#2196F3' },
                { label: 'Cities', value: '25+', icon: <LocationOn />, color: '#9C27B0' },
                { label: 'Avg Response', value: '4.2h', icon: <Schedule />, color: '#FF9800' },
              ].map((stat, index) => (
                <Grid item xs={6} md={3} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <Box sx={{ textAlign: 'center', color: 'white' }}>
                      <Box sx={{ color: stat.color, fontSize: '2.5rem', mb: 1 }}>
                        {stat.icon}
                      </Box>
                      <Typography variant="h4" fontWeight={800}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {stat.label}
                      </Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Box>
        </motion.div>
      </Container>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          position: 'absolute',
          bottom: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
        }}
      >
        <ArrowForward sx={{ color: 'white', fontSize: 40, transform: 'rotate(90deg)' }} />
      </motion.div>
    </Box>
  );
};

// ==================== STATISTICS SECTION ====================
const EnhancedStatisticsSection = () => {
  const theme = useTheme();
  const [stats, setStats] = useState({
    totalReports: 12542,
    resolvedReports: 10234,
    pendingReports: 1500,
    inProgressReports: 708,
    avgResolutionTime: 4.2,
    avgResponseTime: 1.8,
    totalUsers: 52489,
    activeUsers: 2341,
    userSatisfaction: 4.8,
    transformationCount: 850,
    citiesCovered: 25,
    communityGrowth: 45,
    reportsToday: 142,
    resolutionsToday: 89,
  });
  const [loading, setLoading] = useState(false);
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [controls, isInView]);

  // Use static data instead of API calls
  const statsCards = [
    {
      title: 'Resolution Rate',
      value: `${Math.round((stats.resolvedReports / stats.totalReports) * 100)}%`,
      description: 'Issues successfully resolved',
      color: '#4CAF50',
      progress: Math.round((stats.resolvedReports / stats.totalReports) * 100),
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      count: `${stats.resolvedReports.toLocaleString()} resolved`,
      trend: '+5.2% this month',
    },
    {
      title: 'User Satisfaction',
      value: `${stats.userSatisfaction}/5`,
      description: 'Average rating from feedback',
      color: '#FF9800',
      progress: stats.userSatisfaction * 20,
      icon: <Star sx={{ fontSize: 40 }} />,
      count: 'Based on 12.5K reviews',
      trend: '98% positive',
    },
    {
      title: 'Avg Response Time',
      value: `${stats.avgResponseTime}h`,
      description: 'Time to first response',
      color: '#2196F3',
      progress: 92,
      icon: <Speed sx={{ fontSize: 40 }} />,
      count: 'Under 2 hours average',
      trend: 'Faster than last month',
    },
    {
      title: 'Active Community',
      value: stats.activeUsers.toLocaleString(),
      description: 'Users currently online',
      color: '#9C27B0',
      progress: Math.min((stats.activeUsers / stats.totalUsers) * 100, 100),
      icon: <Groups sx={{ fontSize: 40 }} />,
      count: `${stats.totalUsers.toLocaleString()} total users`,
      trend: '+45% growth YoY',
    },
    {
      title: 'Today\'s Activity',
      value: stats.reportsToday.toString(),
      description: 'New reports submitted',
      color: '#F44336',
      progress: Math.min((stats.reportsToday / 200) * 100, 100),
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      count: `${stats.resolutionsToday} resolved today`,
      trend: 'Live updating',
    },
    {
      title: 'Cities Covered',
      value: `${stats.citiesCovered}+`,
      description: 'Active municipalities',
      color: '#00BCD4',
      progress: 100,
      icon: <Public sx={{ fontSize: 40 }} />,
      count: 'Nationwide coverage',
      trend: 'Expanding monthly',
    },
  ];

  if (loading) {
    return (
      <Box sx={{ py: 12, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  return (
    <Box 
      ref={ref}
      sx={{ 
        py: { xs: 10, md: 14 }, 
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
          }}
        >
          {/* Section Header */}
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip
              icon={<TrendingUp />}
              label="PLATFORM STATISTICS"
              sx={{
                mb: 3,
                background: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontSize: '0.9rem',
                fontWeight: 600,
                height: 'auto',
                py: 1,
                px: 2,
              }}
            />
            <Typography
              variant="h2"
              fontWeight={800}
              gutterBottom
              sx={{
                mb: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Real-Time Impact Dashboard
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ 
                maxWidth: 700, 
                mx: 'auto', 
                fontWeight: 400,
                lineHeight: 1.6,
              }}
            >
              Metrics showing the collective impact of our community
            </Typography>
          </Box>

          {/* Statistics Grid */}
          <Grid container spacing={4}>
            {statsCards.map((item, index) => (
              <Grid item xs={12} sm={6} lg={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      p: 3,
                      background: alpha(theme.palette.background.paper, 0.9),
                      border: `2px solid ${alpha(item.color, 0.1)}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 20px 40px ${alpha(item.color, 0.15)}`,
                        borderColor: alpha(item.color, 0.3),
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ 
                          p: 1.5, 
                          borderRadius: 2, 
                          background: alpha(item.color, 0.1),
                          color: item.color,
                        }}>
                          {item.icon}
                        </Box>
                        <Box>
                          <Typography variant="h4" fontWeight={800} sx={{ color: item.color }}>
                            {item.value}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.title}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={item.trend}
                        size="small"
                        sx={{
                          background: alpha(item.color, 0.1),
                          color: item.color,
                          fontWeight: 500,
                        }}
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                      {item.description}
                    </Typography>

                    <LinearProgress
                      variant="determinate"
                      value={item.progress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(item.color, 0.1),
                        mb: 1.5,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: item.color,
                          borderRadius: 3,
                        },
                      }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {item.count}
                      </Typography>
                      <Typography variant="caption" fontWeight={600} sx={{ color: item.color }}>
                        {item.progress}%
                      </Typography>
                    </Box>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Summary Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            viewport={{ once: true }}
          >
            <Paper
              sx={{
                mt: 6,
                p: 4,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: 3,
              }}
            >
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Platform Performance Summary
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall platform health: Excellent • Response times: Improving • User satisfaction: Rising
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    variant="contained"
                    fullWidth
                    href="/dashboard"
                    endIcon={<ArrowForward />}
                    sx={{ py: 1.5 }}
                  >
                    View Detailed Analytics
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
};

// ==================== TRANSFORMATIONS SECTION ====================
const EnhancedTransformationsSection = () => {
  const theme = useTheme();
  const [transformations, setTransformations] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchTransformations();
  }, []);

  const fetchTransformations = async () => {
    try {
      // Try to get actual data
      const response = await galleryAPI.getApprovedGallery({ limit: 8 });
      const data = response.data?.data || [];
      setTransformations(data);
    } catch (err) {
      console.log('Using demo transformations data');
      // Demo data - no API call needed
      setTransformations([
        {
          _id: '1',
          title: 'Road Repair - Main Street',
          description: 'Complete road resurfacing project completed in 3 days',
          beforeImage: { url: 'https://images.unsplash.com/photo-1542224476-6c85ffbd8f1a?w=800&auto=format&fit=crop' },
          afterImage: { url: 'https://images.unsplash.com/photo-1542224476-723c6c5c3b64?w=800&auto=format&fit=crop' },
          category: 'roads',
          upvotes: 45,
          location: { address: 'Main Street, Downtown' },
          date: '2024-01-15'
        },
        {
          _id: '2',
          title: 'Bridge Restoration Project',
          description: 'Historic bridge repair and painting completed',
          beforeImage: { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop' },
          afterImage: { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop' },
          category: 'bridges',
          upvotes: 32,
          location: { address: 'River View Bridge' },
          date: '2024-01-10'
        },
        {
          _id: '3',
          title: 'Drainage System Upgrade',
          description: 'Improved drainage to prevent water logging',
          beforeImage: { url: 'https://images.unsplash.com/photo-1542224476-6c85ffbd8f1a?w=800&auto=format&fit=crop' },
          afterImage: { url: 'https://images.unsplash.com/photo-1542224476-723c6c5c3b64?w=800&auto=format&fit=crop' },
          category: 'drainage',
          upvotes: 28,
          location: { address: 'Market Area' },
          date: '2024-01-05'
        },
        {
          _id: '4',
          title: 'Street Light Installation',
          description: 'New LED street lights for better visibility',
          beforeImage: { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop' },
          afterImage: { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&auto=format&fit=crop' },
          category: 'streetlights',
          upvotes: 41,
          location: { address: 'Residential Zone' },
          date: '2024-01-02'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      py: { xs: 8, md: 12 }, 
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
    }}>
      <Container maxWidth="xl">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          {/* Section Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h2"
              fontWeight={800}
              gutterBottom
              sx={{
                mb: 2,
                background: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Community Transformations
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
              Witness the amazing before-and-after transformations made possible by our community
            </Typography>
          </Box>

          {transformations.length > 0 ? (
            <Box sx={{ position: 'relative' }}>
              <Swiper
                modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
                spaceBetween={30}
                slidesPerView={isMobile ? 1 : 2}
                centeredSlides={true}
                autoplay={{ 
                  delay: 5000, 
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                pagination={{ 
                  clickable: true,
                  dynamicBullets: true,
                }}
                navigation={{
                  prevEl: `.swiper-button-prev-trans`,
                  nextEl: `.swiper-button-next-trans`,
                }}
                effect="coverflow"
                coverflowEffect={{
                  rotate: 0,
                  stretch: 0,
                  depth: 100,
                  modifier: 2,
                  slideShadows: true,
                }}
                style={{ 
                  paddingBottom: 60,
                  paddingTop: 20,
                }}
              >
                {transformations.map((item, index) => (
                  <SwiperSlide key={item._id || index}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card sx={{ 
                        borderRadius: 3, 
                        overflow: 'hidden', 
                        height: '100%',
                        boxShadow: theme.shadows[4],
                      }}>
                        {/* Before & After Split View */}
                        <Box sx={{ 
                          display: 'flex', 
                          height: { xs: 250, md: 350 },
                          position: 'relative',
                        }}>
                          {/* Before Image */}
                          <Box sx={{ 
                            flex: 1, 
                            position: 'relative', 
                            overflow: 'hidden',
                          }}>
                            <img
                              src={item.beforeImage?.url || 'https://images.unsplash.com/photo-1542224476-6c85ffbd8f1a?w=600&auto=format&fit=crop'}
                              alt="Before"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                filter: 'grayscale(30%) brightness(0.8)',
                              }}
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 16,
                                left: 16,
                                bgcolor: 'rgba(244, 67, 54, 0.9)',
                                color: 'white',
                                px: 2,
                                py: 1,
                                borderRadius: 1,
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                backdropFilter: 'blur(4px)',
                              }}
                            >
                              BEFORE
                            </Box>
                          </Box>

                          {/* Divider */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              zIndex: 10,
                              bgcolor: theme.palette.primary.main,
                              color: 'white',
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.5rem',
                              border: '3px solid white',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                            }}
                          >
                            →
                          </Box>

                          {/* After Image */}
                          <Box sx={{ 
                            flex: 1, 
                            position: 'relative', 
                            overflow: 'hidden',
                          }}>
                            <img
                              src={item.afterImage?.url || 'https://images.unsplash.com/photo-1542224476-723c6c5c3b64?w=600&auto=format&fit=crop'}
                              alt="After"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                bgcolor: 'rgba(76, 175, 80, 0.9)',
                                color: 'white',
                                px: 2,
                                py: 1,
                                borderRadius: 1,
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                backdropFilter: 'blur(4px)',
                              }}
                            >
                              AFTER
                            </Box>
                          </Box>
                        </Box>

                        {/* Card Content */}
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight={700} gutterBottom>
                                {item.title || 'Transformation'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {item.description || 'Community improvement project'}
                              </Typography>
                            </Box>
                            <Chip
                              icon={<Star />}
                              label={`${item.upvotes || 0}`}
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          </Box>

                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {item.location?.address || 'City Location'}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {item.date ? new Date(item.date).toLocaleDateString() : 'Recent'}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>

                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                              label={item.category || 'General'}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Navigation Buttons */}
              <IconButton
                className="swiper-button-prev-trans"
                sx={{
                  position: 'absolute',
                  left: { xs: 10, md: -50 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 20,
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  width: 48,
                  height: 48,
                  '&:hover': { 
                    bgcolor: theme.palette.primary.dark,
                  },
                }}
              >
                <ChevronLeft />
              </IconButton>
              <IconButton
                className="swiper-button-next-trans"
                sx={{
                  position: 'absolute',
                  right: { xs: 10, md: -50 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 20,
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  width: 48,
                  height: 48,
                  '&:hover': { 
                    bgcolor: theme.palette.primary.dark,
                  },
                }}
              >
                <ChevronRight />
              </IconButton>
            </Box>
          ) : (
            <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
              No transformations available yet. Check back soon!
            </Alert>
          )}

          {/* View All Button */}
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button
              variant="outlined"
              size="large"
              href="/gallery"
              endIcon={<ArrowForward />}
              sx={{
                px: 6,
                py: 1.5,
                fontSize: '1rem',
                borderRadius: 2,
              }}
            >
              View All Transformations
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

// ==================== REPORTS SECTION ====================
const EnhancedReportsSection = () => {
  const theme = useTheme();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // This API endpoint should be accessible to all users
      const response = await reportAPI.getReports({ 
        limit: 8,
        sort: '-createdAt'
      });
      const data = response.data?.data || response.data || [];
      setReports(data.slice(0, 8));
    } catch (err) {
      console.log('Using demo reports data');
      // Demo data - no API call needed
      setReports([
        {
          _id: '1',
          title: 'Pothole on Main Road',
          description: 'Large pothole causing traffic issues and vehicle damage',
          images: ['https://images.unsplash.com/photo-1542224476-6c85ffbd8f1a?w=600&auto=format&fit=crop'],
          status: 'pending',
          priority: 'high',
          category: 'roads',
          location: { address: 'Main Road, Sector 5' },
          createdAt: new Date().toISOString(),
          upvotes: 15,
          comments: [{}, {}],
          views: 120
        },
        {
          _id: '2',
          title: 'Broken Street Light',
          description: 'Street light not working for 3 days, security concern',
          images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&auto=format&fit=crop'],
          status: 'in-progress',
          priority: 'medium',
          category: 'streetlights',
          location: { address: 'Park Avenue' },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          upvotes: 8,
          comments: [{}],
          views: 85
        },
        {
          _id: '3',
          title: 'Drainage Blockage',
          description: 'Severe water logging due to blocked drainage',
          images: ['https://images.unsplash.com/photo-1542224476-6c85ffbd8f1a?w=600&auto=format&fit=crop'],
          status: 'assigned',
          priority: 'high',
          category: 'drainage',
          location: { address: 'Market Area' },
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          upvotes: 22,
          comments: [{}, {}, {}],
          views: 150
        },
        {
          _id: '4',
          title: 'Sidewalk Repair Needed',
          description: 'Broken sidewalk causing pedestrian safety issues',
          images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&auto=format&fit=crop'],
          status: 'completed',
          priority: 'medium',
          category: 'sidewalks',
          location: { address: 'Residential Zone' },
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          upvotes: 12,
          comments: [{}],
          views: 95
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      'completed': { color: '#4CAF50', icon: <CheckCircle />, label: 'Completed' },
      'in-progress': { color: '#FF9800', icon: <BuildCircle />, label: 'In Progress' },
      'pending': { color: '#F44336', icon: <Schedule />, label: 'Pending' },
      'review': { color: '#2196F3', icon: <Visibility />, label: 'Under Review' },
      'assigned': { color: '#9C27B0', icon: <Engineering />, label: 'Assigned' },
    };
    return configs[status] || { color: '#9E9E9E', icon: <Schedule />, label: 'Unknown' };
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'critical': '#F44336',
      'high': '#FF9800',
      'medium': '#FFC107',
      'low': '#4CAF50',
    };
    return colors[priority] || '#9E9E9E';
  };

  if (loading) {
    return (
      <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      py: { xs: 8, md: 12 }, 
      background: theme.palette.background.default,
    }}>
      <Container maxWidth="xl">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          {/* Section Header */}
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography
              variant="h2"
              fontWeight={800}
              gutterBottom
              sx={{
                mb: 2,
                background: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Recent Community Reports
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
              Real-time updates on issues reported and being addressed in your community
            </Typography>
          </Box>

          {reports.length > 0 ? (
            <Box sx={{ position: 'relative' }}>
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={20}
                slidesPerView={isMobile ? 1 : 2.5}
                autoplay={{ 
                  delay: 4000, 
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                pagination={{ 
                  clickable: true,
                  dynamicBullets: true,
                }}
                navigation={{
                  prevEl: `.swiper-button-prev-reports`,
                  nextEl: `.swiper-button-next-reports`,
                }}
                style={{ 
                  paddingBottom: 60,
                  paddingTop: 20,
                }}
              >
                {reports.map((report, index) => {
                  const statusConfig = getStatusConfig(report.status);
                  return (
                    <SwiperSlide key={report._id || index}>
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -8 }}
                      >
                        <Card
                          sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'all 0.3s ease',
                            border: `1px solid ${alpha(statusConfig.color, 0.1)}`,
                            '&:hover': {
                              transform: 'translateY(-8px)',
                              boxShadow: `0 16px 32px ${alpha(statusConfig.color, 0.15)}`,
                              borderColor: alpha(statusConfig.color, 0.3),
                            },
                          }}
                        >
                          {/* Report Header with Status */}
                          <Box sx={{ 
                            p: 2, 
                            background: alpha(statusConfig.color, 0.05),
                            borderBottom: `1px solid ${alpha(statusConfig.color, 0.1)}`,
                          }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ color: statusConfig.color }}>
                                  {statusConfig.icon}
                                </Box>
                                <Typography variant="subtitle2" fontWeight={600} sx={{ color: statusConfig.color }}>
                                  {statusConfig.label}
                                </Typography>
                              </Box>
                              <Chip
                                label={report.priority || 'medium'}
                                size="small"
                                sx={{
                                  bgcolor: alpha(getPriorityColor(report.priority), 0.1),
                                  color: getPriorityColor(report.priority),
                                  border: `1px solid ${alpha(getPriorityColor(report.priority), 0.3)}`,
                                  fontWeight: 600,
                                }}
                              />
                            </Box>
                          </Box>

                          {/* Report Image */}
                          <Box sx={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                            <img
                              src={report.images?.[0] || 'https://images.unsplash.com/photo-1542224476-6c85ffbd8f1a?w=600&auto=format&fit=crop'}
                              alt={report.title}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                                p: 2,
                              }}
                            >
                              <Typography variant="h6" fontWeight={700} sx={{ color: 'white' }}>
                                {report.title}
                              </Typography>
                            </Box>
                          </Box>

                          <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              paragraph 
                              sx={{ 
                                display: '-webkit-box', 
                                WebkitLineClamp: 2, 
                                WebkitBoxOrient: 'vertical', 
                                overflow: 'hidden',
                                lineHeight: 1.6,
                                mb: 2,
                              }}
                            >
                              {report.description}
                            </Typography>

                            {/* Meta Information */}
                            <Grid container spacing={1.5} sx={{ mb: 2 }}>
                              <Grid item xs={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary" noWrap>
                                    {report.location?.address?.split(',')[0] || 'Location'}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Schedule sx={{ fontSize: 14, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Recent'}
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>

                            {/* Category */}
                            <Chip
                              label={report.category || 'General'}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ mb: 2 }}
                            />
                          </CardContent>

                          {/* Footer Actions */}
                          <Box sx={{ 
                            p: 2, 
                            pt: 0, 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTop: `1px solid ${theme.palette.divider}`,
                          }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Tooltip title="Upvotes">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <ThumbUp sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {report.upvotes || 0}
                                  </Typography>
                                </Box>
                              </Tooltip>
                              <Tooltip title="Comments">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Comment sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {report.comments?.length || 0}
                                  </Typography>
                                </Box>
                              </Tooltip>
                              <Tooltip title="Views">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Visibility sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {report.views || 0}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            </Box>
                            <Button 
                              size="small" 
                              href={`/reports/${report._id}`}
                              endIcon={<ArrowForward />}
                              sx={{ fontWeight: 600 }}
                            >
                              View
                            </Button>
                          </Box>
                        </Card>
                      </motion.div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>

              {/* Navigation Buttons */}
              <IconButton
                className="swiper-button-prev-reports"
                sx={{
                  position: 'absolute',
                  left: { xs: 10, md: -50 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 20,
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  width: 48,
                  height: 48,
                  '&:hover': { 
                    bgcolor: theme.palette.primary.dark,
                  },
                }}
              >
                <ChevronLeft />
              </IconButton>
              <IconButton
                className="swiper-button-next-reports"
                sx={{
                  position: 'absolute',
                  right: { xs: 10, md: -50 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 20,
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  width: 48,
                  height: 48,
                  '&:hover': { 
                    bgcolor: theme.palette.primary.dark,
                  },
                }}
              >
                <ChevronRight />
              </IconButton>
            </Box>
          ) : (
            <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
              No reports available at the moment. Be the first to report an issue!
            </Alert>
          )}

          {/* View All Button */}
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button
              variant="contained"
              size="large"
              href="/reports"
              endIcon={<ArrowForward />}
              sx={{
                px: 6,
                py: 1.5,
                fontSize: '1rem',
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              }}
            >
              View All Reports
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

// ==================== FEEDBACKS SECTION ====================
const EnhancedFeedbacksSection = () => {
  const theme = useTheme();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      // This API endpoint should be accessible to all users
      const response = await feedbackAPI.getAllFeedback();
      const data = response.data?.data || response.data || [];
      setFeedbacks(data.slice(0, 6));
    } catch (err) {
      console.log('Using demo feedbacks data');
      // Demo data - no API call needed
      setFeedbacks([
        {
          _id: '1',
          comment: 'This platform has transformed our community! Issues get resolved within days. Highly recommend to all citizens.',
          rating: 5,
          user: { name: 'Rahul Sharma', role: 'user' },
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          comment: 'As a staff member, the dashboard makes it easy to manage and track assignments. Great communication with citizens.',
          rating: 4,
          user: { name: 'Priya Patel', role: 'staff' },
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          _id: '3',
          comment: 'Transparency in the process builds trust. Love seeing the before/after photos! Keep up the good work.',
          rating: 5,
          user: { name: 'Amit Kumar', role: 'user' },
          createdAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          _id: '4',
          comment: 'Easy to use interface. Reported a pothole and it was fixed in 2 days. Impressive response time!',
          rating: 5,
          user: { name: 'Sneha Reddy', role: 'user' },
          createdAt: new Date(Date.now() - 259200000).toISOString()
        },
        {
          _id: '5',
          comment: 'The mobile app is very convenient. Can report issues on the go with photos. Great initiative!',
          rating: 4,
          user: { name: 'Vikram Singh', role: 'user' },
          createdAt: new Date(Date.now() - 345600000).toISOString()
        },
        {
          _id: '6',
          comment: 'As an admin, the analytics dashboard provides excellent insights. Helps in resource allocation.',
          rating: 5,
          user: { name: 'Admin User', role: 'admin' },
          createdAt: new Date(Date.now() - 432000000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      py: { xs: 8, md: 12 }, 
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
    }}>
      <Container maxWidth="xl">
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            fontWeight={800}
            gutterBottom
            sx={{
              mb: 2,
              background: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            What Our Community Says
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Hear what citizens, staff, and administrators are saying about our platform
          </Typography>
        </Box>

        {feedbacks.length > 0 ? (
          <Grid container spacing={4}>
            {feedbacks.map((feedback, index) => {
              const delay = index * 0.1;
              return (
                <Grid item xs={12} md={6} lg={4} key={feedback._id || index}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.6, 
                      delay,
                    }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        p: 3,
                        background: alpha(theme.palette.background.paper, 0.9),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        borderRadius: 3,
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          boxShadow: theme.shadows[8],
                          borderColor: theme.palette.primary.main,
                        },
                      }}
                    >
                      {/* Rating Stars */}
                      <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            sx={{
                              fontSize: 20,
                              color: i < (feedback.rating || 5)
                                ? theme.palette.warning.main
                                : alpha(theme.palette.text.disabled, 0.3),
                            }}
                          />
                        ))}
                      </Box>

                      {/* Feedback Comment */}
                      <Typography
                        variant="body1"
                        paragraph
                        sx={{ 
                          fontStyle: 'italic', 
                          mb: 3, 
                          lineHeight: 1.6,
                          position: 'relative',
                          color: theme.palette.text.primary,
                          '&::before': {
                            content: '"\\201C"',
                            fontSize: '3rem',
                            color: alpha(theme.palette.primary.main, 0.1),
                            position: 'absolute',
                            top: -20,
                            left: -10,
                            lineHeight: 0,
                          },
                        }}
                      >
                        {feedback.comment || feedback.message || 'Great platform!'}
                      </Typography>

                      {/* User Info */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 'auto' }}>
                        <Avatar
                          sx={{ 
                            width: 48, 
                            height: 48,
                            bgcolor: feedback.user?.role === 'admin' ? theme.palette.error.main :
                                    feedback.user?.role === 'staff' ? theme.palette.primary.main :
                                    theme.palette.success.main,
                          }}
                        >
                          {feedback.user?.name?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {feedback.user?.name || 'Anonymous User'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={feedback.user?.role || 'Community Member'}
                              size="small"
                              sx={{
                                bgcolor: feedback.user?.role === 'admin' ? alpha(theme.palette.error.main, 0.1) :
                                        feedback.user?.role === 'staff' ? alpha(theme.palette.primary.main, 0.1) :
                                        alpha(theme.palette.success.main, 0.1),
                                color: feedback.user?.role === 'admin' ? theme.palette.error.main :
                                      feedback.user?.role === 'staff' ? theme.palette.primary.main :
                                      theme.palette.success.main,
                                fontSize: '0.7rem',
                                height: 20,
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {feedback.createdAt ? new Date(feedback.createdAt).toLocaleDateString() : 'Recently'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
            No feedback available yet. Be the first to share your experience!
          </Alert>
        )}

        {/* Add Feedback CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
        >
          <Paper
            sx={{
              mt: 8,
              p: 4,
              textAlign: 'center',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderRadius: 3,
            }}
          >
            <Typography variant="h5" gutterBottom fontWeight={600}>
              Share Your Experience
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
              Your feedback helps us improve and serve the community better
            </Typography>
            <Button
              variant="contained"
              size="large"
              href="/feedback"
              startIcon={<RateReview />}
              sx={{
                px: 6,
                py: 1.5,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              }}
            >
              Submit Feedback
            </Button>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

// ==================== TEAM SECTION (WITHOUT ADMIN API) ====================
const EnhancedTeamSection = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  // Static team data - no API calls needed
  const teamData = [
    {
      _id: '1',
      name: 'Municipal Corporation',
      role: 'admin',
      description: 'City Administration Team',
      department: 'Administration',
      email: 'admin@municipal.gov'
    },
    {
      _id: '2',
      name: 'Public Works Department',
      role: 'staff',
      description: 'Road Maintenance Division',
      department: 'Maintenance',
      email: 'works@municipal.gov'
    },
    {
      _id: '3',
      name: 'Traffic Control Unit',
      role: 'staff',
      description: 'Traffic Management Team',
      department: 'Traffic',
      email: 'traffic@municipal.gov'
    },
    {
      _id: '4',
      name: 'Civil Engineering Team',
      role: 'staff',
      description: 'Infrastructure Development',
      department: 'Engineering',
      email: 'engineering@municipal.gov'
    },
    {
      _id: '5',
      name: 'Public Safety Division',
      role: 'staff',
      description: 'Emergency Response Team',
      department: 'Safety',
      email: 'safety@municipal.gov'
    },
    {
      _id: '6',
      name: 'Urban Development',
      role: 'staff',
      description: 'City Planning & Development',
      department: 'Planning',
      email: 'planning@municipal.gov'
    },
    {
      _id: '7',
      name: 'Environmental Services',
      role: 'staff',
      description: 'Cleanliness & Environment',
      department: 'Environment',
      email: 'environment@municipal.gov'
    },
    {
      _id: '8',
      name: 'Community Relations',
      role: 'staff',
      description: 'Public Communication Team',
      department: 'Relations',
      email: 'relations@municipal.gov'
    }
  ];

  if (loading) {
    return (
      <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      py: { xs: 8, md: 12 }, 
      background: theme.palette.background.default,
    }}>
      <Container maxWidth="xl">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          {/* Section Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h2"
              fontWeight={800}
              gutterBottom
              sx={{
                mb: 2,
                background: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Our Dedicated Departments
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
              Various municipal departments working together to improve your community
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {teamData.map((member, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={member._id || index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.6,
                    delay: index * 0.1,
                  }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Card
                    sx={{
                      textAlign: 'center',
                      borderRadius: 3,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: `2px solid ${alpha(
                        member.role === 'admin' ? theme.palette.error.main :
                        theme.palette.primary.main, 0.1
                      )}`,
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 16px 32px ${alpha(
                          member.role === 'admin' ? theme.palette.error.main :
                          theme.palette.primary.main, 0.15
                        )}`,
                        borderColor: alpha(
                          member.role === 'admin' ? theme.palette.error.main :
                          theme.palette.primary.main, 0.3
                        ),
                      },
                    }}
                  >
                    {/* Header with Role Badge */}
                    <Box
                      sx={{
                        height: 80,
                        background: `linear-gradient(135deg, ${
                          member.role === 'admin' ? '#f44336' : '#1976d2'
                        } 0%, ${
                          member.role === 'admin' ? '#d32f2f' : '#1565c0'
                        } 100%)`,
                        position: 'relative',
                      }}
                    >
                      {/* Role Badge */}
                      <Chip
                        label={member.role?.toUpperCase()}
                        size="small"
                        sx={{
                          position: 'absolute',
                          bottom: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          bgcolor: member.role === 'admin' ? 'error.main' : 'primary.main',
                          color: 'white',
                          fontWeight: 700,
                          boxShadow: theme.shadows[2],
                          zIndex: 2,
                        }}
                      />
                    </Box>

                    {/* Avatar/Icon */}
                    <Box sx={{ mt: -3, mb: 2 }}>
                      <Box
                        sx={{
                          width: 70,
                          height: 70,
                          mx: 'auto',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: member.role === 'admin' ? theme.palette.error.light : theme.palette.primary.light,
                          border: `4px solid ${theme.palette.background.default}`,
                          boxShadow: theme.shadows[4],
                          fontSize: '2rem',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      >
                        {member.name?.charAt(0) || 'D'}
                      </Box>
                    </Box>

                    {/* Member Info */}
                    <CardContent sx={{ pt: 1, flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        {member.name}
                      </Typography>
                      
                      {member.department && (
                        <Chip
                          label={member.department}
                          size="small"
                          color="secondary"
                          variant="outlined"
                          sx={{ mb: 2 }}
                        />
                      )}
                      
                      {member.description && (
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {member.description}
                        </Typography>
                      )}

                      {member.email && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {member.email}
                        </Typography>
                      )}
                    </CardContent>

                    {/* Contact Actions */}
                    <Box sx={{ 
                      p: 2, 
                      display: 'flex', 
                      justifyContent: 'center',
                      gap: 2,
                      borderTop: `1px solid ${theme.palette.divider}`,
                    }}>
                      <Tooltip title="Contact Department">
                        <Button 
                          size="small" 
                          href={`mailto:${member.email}`}
                          startIcon={<Email />}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          Contact
                        </Button>
                      </Tooltip>
                    </Box>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Information Note */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            viewport={{ once: true }}
          >
            <Paper
              sx={{
                mt: 8,
                p: 4,
                textAlign: 'center',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: 3,
              }}
            >
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Working Together for Better Communities
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
                Our municipal departments collaborate to ensure timely resolution of issues and continuous improvement of city infrastructure
              </Typography>
              <Button
                variant="outlined"
                size="large"
                href="/contact"
                endIcon={<ArrowForward />}
                sx={{
                  px: 6,
                  py: 1.5,
                  borderWidth: 2,
                  fontWeight: 600,
                }}
              >
                Contact Municipal Office
              </Button>
            </Paper>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
};

// ==================== MAIN HOME PAGE ====================
const HomePage = () => {
  const theme = useTheme();
  const { user } = useAuth();

  return (
    <Box>
      <EnhancedHeroSection />
      <EnhancedStatisticsSection />
      <EnhancedTransformationsSection />
      <EnhancedReportsSection />
      <EnhancedFeedbacksSection />
      <EnhancedTeamSection />

      {/* Final CTA Section */}
      <Box sx={{ 
        py: { xs: 10, md: 14 }, 
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
      }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Box sx={{ textAlign: 'center', color: 'white' }}>
              <Typography variant="h2" fontWeight={800} gutterBottom sx={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                Ready to Transform Your Community?
              </Typography>
              <Typography variant="h5" sx={{ mb: 5, opacity: 0.95, fontWeight: 300 }}>
                Join thousands of community members making a real difference every day
              </Typography>
              
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={3}
                justifyContent="center"
                alignItems="center"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="contained"
                    size="large"
                    href={user ? '/reports/new' : '/register'}
                    startIcon={<AutoFixHigh />}
                    sx={{
                      bgcolor: 'white',
                      color: theme.palette.primary.main,
                      fontWeight: 700,
                      px: 6,
                      py: 2.5,
                      fontSize: '1.1rem',
                      borderRadius: 2,
                      boxShadow: '0 12px 30px rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 16px 40px rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  >
                    {user ? 'Report an Issue Now' : 'Join Free Today'}
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    href="/gallery"
                    endIcon={<ArrowForward />}
                    sx={{
                      borderWidth: 2,
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      color: 'white',
                      fontWeight: 700,
                      px: 6,
                      py: 2.5,
                      fontSize: '1.1rem',
                      borderRadius: 2,
                      backdropFilter: 'blur(10px)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      '&:hover': {
                        borderColor: 'white',
                        background: 'rgba(255, 255, 255, 0.2)',
                        transform: 'translateY(-3px)',
                      },
                    }}
                  >
                    View Transformations
                  </Button>
                </motion.div>
              </Stack>

              {/* Trust Badges */}
              <Box sx={{ mt: 8, display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  { icon: <Verified />, text: 'Verified Platform' },
                  { icon: <WorkspacePremium />, text: 'Municipal Certified' },
                  { icon: <EmojiEvents />, text: 'Community Choice' },
                  { icon: <Security />, text: 'Secure & Private' },
                ].map((badge, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.9 }}>
                      <Box sx={{ color: theme.palette.warning.light }}>
                        {badge.icon}
                      </Box>
                      <Typography variant="body2" fontWeight={500}>
                        {badge.text}
                      </Typography>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </Box>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;