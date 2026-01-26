import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  Download,
  Refresh,
  Info,
  Payment,
  Group,
  AccountBalance,
  DateRange,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { donationAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const FinancialManagement = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalAmount: 0,
    topDonors: 0,
    recentDonations: 0,
    byCategory: {},
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    cause: 'all',
    status: 'all',
  });
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const theme = useTheme();

  const causes = [
    { value: 'general', label: 'General Fund' },
    { value: 'pothole', label: 'Pothole Repair' },
    { value: 'lighting', label: 'Street Lighting' },
    { value: 'greenery', label: 'Greenery' },
    { value: 'safety', label: 'Road Safety' },
  ];

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.cause !== 'all') params.cause = filters.cause;
      if (filters.status !== 'all') params.status = filters.status;

      const response = await donationAPI.getDonations(params);
      
      let fetchedDonations = [];
      if (Array.isArray(response.data)) {
        fetchedDonations = response.data;
      } else if (Array.isArray(response.data.data)) {
        fetchedDonations = response.data.data;
      } else if (response.data.donations && Array.isArray(response.data.donations)) {
        fetchedDonations = response.data.donations;
      }

      // Calculate statistics
      const totalAmount = fetchedDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
      const completedDonations = fetchedDonations.filter(d => d.status === 'completed');
      const categoryStats = {};

      causes.forEach(cause => {
        const categoryDonations = fetchedDonations.filter(d => d.cause === cause.value && d.status === 'completed');
        categoryStats[cause.value] = {
          count: categoryDonations.length,
          amount: categoryDonations.reduce((sum, d) => sum + (d.amount || 0), 0),
          label: cause.label,
        };
      });

      setDonations(fetchedDonations);
      setStats({
        totalDonations: fetchedDonations.length,
        completedDonations: completedDonations.length,
        totalAmount: totalAmount,
        completedAmount: completedDonations.reduce((sum, d) => sum + (d.amount || 0), 0),
        uniqueDonors: new Set(fetchedDonations.map(d => d.user || d.email)).size,
        byCategory: categoryStats,
      });
    } catch (err) {
      console.error('Error fetching donations:', err);
      setError('Failed to load donations. Please try again.');
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [filters]);

  const handleExport = () => {
    try {
      const csvContent = [
        ['Date', 'Donor', 'Email', 'Amount', 'Cause', 'Status', 'Message'],
        ...donations.map(d => [
          format(new Date(d.createdAt || d.date), 'yyyy-MM-dd HH:mm'),
          d.anonymous ? 'Anonymous' : (d.name || 'N/A'),
          d.email || 'N/A',
          d.amount || 0,
          d.cause || 'general',
          d.status || 'pending',
          d.message ? d.message.replace(/"/g, '""') : '',
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      toast.success('Report exported successfully');
    } catch (err) {
      toast.error('Failed to export report');
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
    <motion.div
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
          border: `1px solid ${color}30`,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box>
              <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                {label}
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {value}
              </Typography>
              {subtext && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  {subtext}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: `${color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon sx={{ color, fontSize: 24 }} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            💰 Financial Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Track donations, manage funds, and generate financial reports
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            startIcon={<Refresh />}
            onClick={fetchDonations}
            variant="outlined"
          >
            Refresh
          </Button>
          <Button
            startIcon={<Download />}
            onClick={handleExport}
            variant="contained"
            color="success"
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Statistics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={Payment}
            label="Total Donations"
            value={stats.totalDonations}
            color={theme.palette.primary.main}
            subtext={`${stats.completedDonations || 0} completed`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={AccountBalance}
            label="Total Funds Raised"
            value={`₹${(stats.totalAmount || 0).toLocaleString()}`}
            color={theme.palette.success.main}
            subtext={`₹${(stats.completedAmount || 0).toLocaleString()} confirmed`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={Group}
            label="Unique Donors"
            value={stats.uniqueDonors || 0}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={TrendingUp}
            label="Average Donation"
            value={`₹${stats.totalDonations > 0 ? Math.round((stats.totalAmount || 0) / stats.totalDonations) : 0}`}
            color={theme.palette.warning.main}
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="Cause"
              value={filters.cause}
              onChange={(e) => setFilters({ ...filters, cause: e.target.value })}
              size="small"
            >
              <MenuItem value="all">All Causes</MenuItem>
              {causes.map(cause => (
                <MenuItem key={cause.value} value={cause.value}>
                  {cause.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              size="small"
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Category Breakdown */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Funds by Category
          </Typography>
        </Grid>
        {causes.map(cause => {
          const categoryData = stats.byCategory?.[cause.value] || { count: 0, amount: 0 };
          return (
            <Grid item xs={12} sm={6} md={4} key={cause.value}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {cause.label}
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        ₹{categoryData.amount.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {categoryData.count} donations
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: theme.palette.primary.main + '20',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" fontWeight={600}>
                        {Math.round((categoryData.amount / (stats.completedAmount || 1)) * 100)}%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Donations Table */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Recent Donations
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: theme.palette.grey[100] }}>
            <TableRow>
              <TableCell fontWeight={600}>Donor</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Cause</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {donations.slice(0, 10).map(donation => (
              <TableRow key={donation._id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                      {donation.anonymous ? '😊' : donation.name?.charAt(0) || 'D'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {donation.anonymous ? 'Anonymous' : donation.name}
                      </Typography>
                      {!donation.anonymous && (
                        <Typography variant="caption" color="textSecondary">
                          {donation.email}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  ₹{(donation.amount || 0).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={causes.find(c => c.value === donation.cause)?.label || donation.cause}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={donation.status || 'pending'}
                    size="small"
                    color={donation.status === 'completed' ? 'success' : 'default'}
                    variant={donation.status === 'completed' ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell>
                  {format(new Date(donation.createdAt || donation.date), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    onClick={() => {
                      setSelectedDonation(donation);
                      setDialogOpen(true);
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Donation Details</DialogTitle>
        <DialogContent>
          {selectedDonation && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Donor Name</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedDonation.anonymous ? 'Anonymous' : selectedDonation.name}
                  </Typography>
                </Grid>
                {!selectedDonation.anonymous && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Email</Typography>
                    <Typography variant="body1">{selectedDonation.email}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Amount</Typography>
                  <Typography variant="h6" fontWeight={600}>
                    ₹{selectedDonation.amount?.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Cause</Typography>
                  <Typography variant="body1">
                    {causes.find(c => c.value === selectedDonation.cause)?.label || selectedDonation.cause}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Status</Typography>
                  <Chip
                    label={selectedDonation.status || 'pending'}
                    color={selectedDonation.status === 'completed' ? 'success' : 'default'}
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Date</Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedDonation.createdAt || selectedDonation.date), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </Grid>
                {selectedDonation.message && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Message</Typography>
                    <Typography variant="body2" sx={{ p: 1.5, backgroundColor: theme.palette.grey[100], borderRadius: 1, mt: 1 }}>
                      {selectedDonation.message}
                    </Typography>
                  </Grid>
                )}
                {selectedDonation.paymentId && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Payment ID</Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {selectedDonation.paymentId}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FinancialManagement;