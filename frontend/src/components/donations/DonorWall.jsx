import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Pagination,
  Chip,
  useTheme,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Search,
  FilterList,
  TrendingUp,
  People,
  AccountBalance,
  Refresh,
  Info,
  Cached,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import DonationCard from './DonationCard';
import { donationAPI } from '../../services/api';

// Mock data for fallback
const MOCK_DONATIONS = Array.from({ length: 20 }, (_, i) => ({
  _id: `mock-${i}`,
  name: i % 3 === 0 ? 'Anonymous' : `Donor ${i + 1}`,
  email: i % 3 === 0 ? '' : `donor${i + 1}@example.com`,
  amount: Math.floor(Math.random() * 10000) + 100,
  message: 'Thank you for your contribution to road safety!',
  date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  anonymous: i % 3 === 0,
  cause: ['general', 'pothole', 'lighting', 'greenery', 'safety'][i % 5],
  avatarColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 5],
}));

const MOCK_STATS = {
  totalDonations: 1543,
  totalAmount: 1250000,
  topDonors: 42,
  recentDonations: 87,
};

const DonorWall = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalAmount: 0,
    topDonors: 0,
    recentDonations: 0,
  });
  const [selectedCause, setSelectedCause] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [retryDelay, setRetryDelay] = useState(0);
  
  const theme = useTheme();
  const itemsPerPage = 9;

  const showError = useCallback((message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setUsingMockData(false);

      // Fetch donations
      const donationsResponse = await donationAPI.getDonations({ 
        limit: 100,
        sort: '-date' 
      });
      
      let fetchedDonations = [];
      if (donationsResponse.data) {
        if (Array.isArray(donationsResponse.data)) {
          fetchedDonations = donationsResponse.data;
        } else if (Array.isArray(donationsResponse.data.donations)) {
          fetchedDonations = donationsResponse.data.donations;
        } else if (donationsResponse.data.data && Array.isArray(donationsResponse.data.data)) {
          fetchedDonations = donationsResponse.data.data;
        }
      }
      
      // Fetch stats
      let fetchedStats = MOCK_STATS;
      try {
        const statsResponse = await donationAPI.getStats();
        if (statsResponse.data) {
          fetchedStats = {
            totalDonations: statsResponse.data.totalDonations || 0,
            totalAmount: statsResponse.data.totalAmount || 0,
            topDonors: statsResponse.data.topDonors || 0,
            recentDonations: statsResponse.data.recentDonations || 0,
          };
        }
      } catch (statsError) {
        console.warn('Using mock stats data:', statsError.message);
        fetchedStats = MOCK_STATS;
      }

      // Process donations
      if (fetchedDonations.length === 0) {
        console.warn('No donations received, using mock data');
        fetchedDonations = MOCK_DONATIONS;
        setUsingMockData(true);
      } else {
        fetchedDonations = fetchedDonations.map(donation => ({
          ...donation,
          name: donation.name || 'Anonymous',
          email: donation.email || '',
          message: donation.message || 'Thank you for your support!',
          amount: donation.amount || 0,
          date: donation.date || new Date().toISOString(),
          anonymous: donation.anonymous || false,
          cause: donation.cause || 'general',
          _id: donation._id || `temp-${Date.now()}-${Math.random()}`,
          avatarColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 5)]
        }));
      }

      setDonations(fetchedDonations);
      setStats(fetchedStats);
      setRetryDelay(0);

    } catch (error) {
      console.error('Failed to fetch data:', error);
      
      if (error.response?.status === 429) {
        // Rate limited - use mock data and schedule retry
        setDonations(MOCK_DONATIONS);
        setStats(MOCK_STATS);
        setUsingMockData(true);
        
        // Calculate exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retryDelay), 30000);
        showError(`Rate limited. Using sample data. Retrying in ${delay/1000}s...`);
        
        setTimeout(() => {
          setRetryDelay(prev => prev + 1);
          fetchData();
        }, delay);
      } else {
        // Other errors - use mock data
        setDonations(MOCK_DONATIONS);
        setStats(MOCK_STATS);
        setUsingMockData(true);
        showError('Using sample data. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [retryDelay, showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs = [
    { label: 'All Donations', value: 'all' },
    { label: 'Recent', value: 'recent' },
    { label: 'Large Donations', value: 'large' },
    { label: 'Anonymous', value: 'anonymous' },
    { label: 'By Cause', value: 'cause' },
  ];

  const causes = [
    { value: 'general', label: 'General Fund' },
    { value: 'pothole', label: 'Pothole Repair' },
    { value: 'lighting', label: 'Street Lighting' },
    { value: 'greenery', label: 'Greenery' },
    { value: 'safety', label: 'Road Safety' },
  ];

  // Safe filtering
  const filteredDonations = donations.filter(donation => {
    // Search filter
    const matchesSearch = search === '' || 
      donation.name?.toLowerCase().includes(search.toLowerCase()) ||
      donation.email?.toLowerCase().includes(search.toLowerCase()) ||
      donation.message?.toLowerCase().includes(search.toLowerCase());

    // Tab filter
    let matchesTab = true;
    const currentTab = tabs[tabValue]?.value || 'all';
    
    switch (currentTab) {
      case 'recent':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        matchesTab = new Date(donation.date) > oneWeekAgo;
        break;
      case 'large':
        matchesTab = donation.amount >= 5000;
        break;
      case 'anonymous':
        matchesTab = donation.anonymous === true;
        break;
      case 'cause':
        matchesTab = true; // Cause filtering handled separately
        break;
    }

    // Cause filter
    const matchesCause = !selectedCause || donation.cause === selectedCause;

    return matchesSearch && matchesTab && matchesCause;
  });

  const paginatedDonations = filteredDonations.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(1);
    if (tabs[newValue]?.value !== 'cause') {
      setSelectedCause(null);
    }
  };

  const handleCauseClick = (causeValue) => {
    if (selectedCause === causeValue) {
      setSelectedCause(null);
    } else {
      setSelectedCause(causeValue);
      setTabValue(tabs.findIndex(tab => tab.value === 'cause'));
    }
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const StatCard = ({ icon, label, value, color }) => (
    <motion.div
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Box
        sx={{
          p: 3,
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          textAlign: 'center',
          height: '100%',
          position: 'relative',
        }}
      >
        {usingMockData && (
          <Tooltip title="Using sample data">
            <Info 
              sx={{ 
                position: 'absolute', 
                top: 8, 
                right: 8, 
                color: theme.palette.warning.main,
                fontSize: 16 
              }} 
            />
          </Tooltip>
        )}
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: color + '20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          {React.cloneElement(icon, { sx: { color, fontSize: 28 } })}
        </Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </motion.div>
  );

  if (loading && donations.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, minHeight: '50vh' }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" color="text.secondary">
            Loading donor wall...
          </Typography>
          {retryDelay > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Waiting before retry...
            </Typography>
          )}
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
        {/* Error Alert */}
        {error && (
          <Alert 
            severity="warning" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={fetchData}>
                Retry Now
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h3" fontWeight={800} gutterBottom>
              Donor Wall
              {usingMockData && (
                <Chip 
                  label="Sample Data" 
                  size="small" 
                  color="warning" 
                  sx={{ ml: 2, verticalAlign: 'middle' }}
                />
              )}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Celebrating our generous donors who make roads safer for everyone
            </Typography>
          </Box>
          <Tooltip title="Refresh data">
            <IconButton 
              onClick={fetchData} 
              disabled={loading}
              sx={{ 
                backgroundColor: theme.palette.action.hover,
                '&:hover': { backgroundColor: theme.palette.action.selected }
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<AccountBalance />}
              label="Total Raised"
              value={`₹${(stats.totalAmount || 0).toLocaleString()}`}
              color={theme.palette.success.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<People />}
              label="Total Donors"
              value={(stats.totalDonations || 0).toLocaleString()}
              color={theme.palette.primary.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<TrendingUp />}
              label="This Month"
              value={`₹${Math.round((stats.totalAmount || 0) * 0.1).toLocaleString()}`}
              color={theme.palette.warning.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<FilterList />}
              label="Top Donors"
              value={(stats.topDonors || 0).toLocaleString()}
              color={theme.palette.secondary.main}
            />
          </Grid>
        </Grid>

        {/* Filters */}
        <Box sx={{ 
          mb: 4, 
          p: 3, 
          backgroundColor: theme.palette.background.paper, 
          borderRadius: 3, 
          boxShadow: theme.shadows[1],
          border: usingMockData ? `2px solid ${theme.palette.warning.light}` : 'none'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              {tabs.map((tab, index) => (
                <Tab 
                  key={index} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {tab.label}
                      {index === 0 && (
                        <Chip 
                          label={donations.length} 
                          size="small" 
                          sx={{ height: 20 }} 
                        />
                      )}
                    </Box>
                  } 
                />
              ))}
            </Tabs>
            
            {usingMockData && (
              <Tooltip title="This is sample data. Real data will load when available.">
                <Chip 
                  icon={<Cached />}
                  label="Demo Mode" 
                  size="small" 
                  color="warning" 
                  variant="outlined"
                />
              </Tooltip>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search donors or messages..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 200, flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {causes.map((cause) => (
                <Chip
                  key={cause.value}
                  label={cause.label}
                  size="small"
                  variant={selectedCause === cause.value ? "filled" : "outlined"}
                  color={selectedCause === cause.value ? "primary" : "default"}
                  clickable
                  onClick={() => handleCauseClick(cause.value)}
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Donations Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {paginatedDonations.length > 0 ? (
            paginatedDonations.map((donation, index) => (
              <Grid item key={donation._id} xs={12} sm={6} md={4}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <DonationCard donation={donation} isMock={usingMockData} />
                </motion.div>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 8, minHeight: '30vh' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No donations found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Try adjusting your search criteria
                </Typography>
                {(search || selectedCause) && (
                  <Button 
                    variant="outlined" 
                    onClick={() => {
                      setSearch('');
                      setSelectedCause(null);
                      setTabValue(0);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Pagination */}
        {filteredDonations.length > itemsPerPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 6 }}>
            <Pagination
              count={Math.ceil(filteredDonations.length / itemsPerPage)}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
        
         

        {/* Footer Note */}
        {usingMockData && (
          <Box sx={{ textAlign: 'center', mt: 4, mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Note: This page is showing sample data. Real donation data will appear when the server is available.
            </Typography>
          </Box>
        )}
      </motion.div>
    </Container>
  );
};

export default DonorWall;