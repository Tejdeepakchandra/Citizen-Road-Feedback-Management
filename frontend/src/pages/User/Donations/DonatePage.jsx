import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  LinearProgress,
  useTheme,
  Button,
  Alert,
} from '@mui/material';
import {
  Favorite,
  People,
  TrendingUp,
  AccountBalance,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import DonationForm from '../../../components/donations/DonationForm';
import DonorWall from '../../../components/donations/DonorWall';
import { donationAPI } from '../../../services/api';
import { useSocket } from '../../../hooks/useSocket';

const DonatePage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalRaised: 0,
    totalDonors: 0,
    monthlyGoal: 100000,
    currentMonthly: 0,
    topDonation: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const { socket, isConnected } = useSocket();

  // Fetch donation stats from backend
  useEffect(() => {
    fetchDonationStats();
  }, []);

  // Listen for real-time donation updates via Socket.IO
  useEffect(() => {
    if (!socket || !isConnected) {
      console.warn('⚠️ DonatePage: Socket not connected yet');
      return;
    }

    console.log('🔌 DonatePage: Setting up socket listeners...');

    // Define handler functions with comprehensive logging
    const handleDonationCompleted = (donationData) => {
      console.log('🎯 DonatePage: donation_completed event received:', donationData);
      setTimeout(() => {
        console.log('🔄 DonatePage: Fetching updated stats...');
        fetchDonationStats();
        toast.success('New donation received! Funds updated.');
      }, 300);
    };

    const handleDonationReceived = (data) => {
      console.log('🎯 DonatePage: donation_received event received:', data);
      setTimeout(() => {
        fetchDonationStats();
        toast.success(`New donation of ₹${data.amount}!`);
      }, 300);
    };

    const handleDonationNotification = (data) => {
      console.log('🎯 DonatePage: donation_notification event received:', data);
      setTimeout(() => {
        fetchDonationStats();
        toast.success(data.message || 'Your donation was successful!');
      }, 300);
    };

    const handleDonationUpdate = (data) => {
      console.log('🎯 DonatePage: donation_update broadcast received:', data);
      setTimeout(() => {
        fetchDonationStats();
      }, 300);
    };

    // Attach listeners
    socket.on('donation_completed', handleDonationCompleted);
    socket.on('donation_received', handleDonationReceived);
    socket.on('donation_notification', handleDonationNotification);
    socket.on('donation_update', handleDonationUpdate);

    console.log('✅ DonatePage: All socket listeners attached');

    // Cleanup listeners on unmount
    return () => {
      console.log('🧹 DonatePage: Removing socket listeners');
      socket.off('donation_completed', handleDonationCompleted);
      socket.off('donation_received', handleDonationReceived);
      socket.off('donation_notification', handleDonationNotification);
      socket.off('donation_update', handleDonationUpdate);
    };
  }, [socket, isConnected]);

  const fetchDonationStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await donationAPI.getStats();
      // Handle different response formats
      const data = response.data?.data || response.data || {};
      
      setStats({
        totalRaised: data.totalAmount || data.totalRaised || 0,
        totalDonors: data.totalDonations || data.totalDonors || 0,
        monthlyGoal: data.monthlyGoal || 100000,
        currentMonthly: data.monthlyAmount || data.currentMonthly || 0,
        topDonation: data.topDonation || 0,
      });
    } catch (err) {
      console.error('Failed to fetch donation stats:', err);
      setError('Failed to load donation statistics. Using sample data.');
      // Set default values
      setStats({
        totalRaised: 1250000,
        totalDonors: 2450,
        monthlyGoal: 500000,
        currentMonthly: 375000,
        topDonation: 50000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: 'Donate Now', value: 'donate' },
    { label: 'Donor Wall', value: 'donors' },
    { label: 'Impact', value: 'impact' },
  ];

  const impactStories = [
    {
      title: 'Pothole-Free Main Road',
      description: 'Thanks to donations, we repaired 50+ potholes on Main Street',
      amount: 50000,
      image: 'https://images.unsplash.com/photo-1542225676-9dc0b3d55c8f?auto=format&fit=crop&w=600',
    },
    {
      title: 'New Street Lights',
      description: 'Installed 100 LED street lights in dark neighborhoods',
      amount: 75000,
      image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=600',
    },
    {
      title: 'Drainage System',
      description: 'Improved drainage system preventing water logging',
      amount: 120000,
      image: 'https://images.unsplash.com/photo-1599072000115-15d4b6f44c3c?auto=format&fit=crop&w=600',
    },
  ];

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" fontWeight={800} gutterBottom>
            Support Road Development
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
            Your donation helps transform roads, improve safety, and create better infrastructure for everyone
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <AccountBalance sx={{ fontSize: 48, color: theme.palette.success.main, mb: 2 }} />
                <Typography variant="h4" fontWeight={800} gutterBottom>
                  ₹{(stats.totalRaised || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Raised
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <People sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
                <Typography variant="h4" fontWeight={800} gutterBottom>
                  {(stats.totalDonors || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Donors
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Monthly Goal
                  </Typography>
                  <Typography variant="h4" fontWeight={800}>
                    ₹{(stats.currentMonthly || 0).toLocaleString()}/₹{(stats.monthlyGoal || 100000).toLocaleString()}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.monthlyGoal > 0 ? ((stats.currentMonthly || 0) / stats.monthlyGoal) * 100 : 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: theme.palette.success.main,
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 48, color: theme.palette.warning.main, mb: 2 }} />
                <Typography variant="h4" fontWeight={800} gutterBottom>
                  ₹{(stats.topDonation || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Top Donation
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card sx={{ mb: 6 }}>
          <CardContent sx={{ p: 0 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  py: 2,
                  fontSize: '1rem',
                  fontWeight: 600,
                },
              }}
            >
              {tabs.map((tab, index) => (
                <Tab key={index} label={tab.label} />
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Tab Content */}
        {activeTab === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Grid container spacing={6}>
              <Grid item xs={12} md={7}>
                <DonationForm />
              </Grid>
              <Grid item xs={12} md={5}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                      Why Donate?
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            backgroundColor: theme.palette.success.main + '20',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Favorite sx={{ color: theme.palette.success.main }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            Make a Real Impact
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Every rupee contributes directly to road improvement projects
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        How Your Donation Helps:
                      </Typography>
                      <Box component="ul" sx={{ pl: 2, color: 'text.secondary' }}>
                        <li>₹500 - Repair one pothole</li>
                        <li>₹2,000 - Install one street light</li>
                        <li>₹5,000 - Clean drainage for 100 meters</li>
                        <li>₹10,000 - Paint road markings for 500 meters</li>
                      </Box>
                    </Box>

                    <Box sx={{ p: 3, borderRadius: 2, backgroundColor: theme.palette.primary.main + '10' }}>
                      <Typography variant="body2" fontWeight={600} gutterBottom>
                        Tax Benefits
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        All donations are eligible for tax exemption under Section 80G of the Income Tax Act
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        )}

        {activeTab === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DonorWall />
          </motion.div>
        )}

        {activeTab === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
              Impact Stories
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 6 }}>
              See how donations have transformed communities
            </Typography>

            <Grid container spacing={4}>
              {impactStories.map((story, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <motion.div
                    whileHover={{ y: -8 }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <Box
                        component="img"
                        src={story.image}
                        alt={story.title}
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                        }}
                      />
                      <CardContent>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          {story.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {story.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6" color={theme.palette.success.main} fontWeight={700}>
                            ₹{story.amount.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Funded by donations
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {/* Impact Metrics */}
            <Card sx={{ mt: 6 }}>
              <CardContent>
                <Typography variant="h5" fontWeight={700} textAlign="center" gutterBottom>
                  Our Impact in Numbers
                </Typography>
                <Grid container spacing={3} sx={{ mt: 2 }}>
                  {[
                    { value: '500+', label: 'Potholes Repaired' },
                    { value: '1,200+', label: 'Street Lights Installed' },
                    { value: '50km', label: 'Drainage Cleaned' },
                    { value: '100km', label: 'Road Markings Painted' },
                    { value: '25k+', label: 'Lives Impacted' },
                    { value: '10k+', label: 'Happy Citizens' },
                  ].map((metric, index) => (
                    <Grid item xs={6} sm={4} md={2} key={index}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={800} color="primary">
                          {metric.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {metric.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Call to Action */}
        <Box
          sx={{
            mt: 8,
            p: 6,
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #818CF8 0%, #38BDF8 100%)'
              : 'linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%)',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <Typography variant="h3" fontWeight={800} gutterBottom>
            Be Part of the Change
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of donors making our roads safer every day
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => setActiveTab(0)}
              sx={{
                backgroundColor: '#fff',
                color: theme.palette.primary.main,
                fontSize: '1.1rem',
                px: 4,
                py: 1.5,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#f1f5f9' : '#f8fafc',
                },
              }}
            >
              Donate Now
            </Button>
            <Button
              variant="outlined"
              href="/gallery"
              sx={{
                borderColor: '#fff',
                color: '#fff',
                fontSize: '1.1rem',
                px: 4,
                py: 1.5,
                '&:hover': {
                  borderColor: '#fff',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              See Transformations
            </Button>
          </Box>
        </Box>
      </motion.div>
    </Container>
  );
};

export default DonatePage;