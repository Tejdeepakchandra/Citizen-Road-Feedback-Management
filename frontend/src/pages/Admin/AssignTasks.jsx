import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  FilterList,
  Search,
  Assignment,
  Person,
  Schedule,
  CheckCircle,
  Warning,
  MoreVert,
  Refresh,
  Add,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { reportAPI, staffAPI } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const AssignTasks = () => {
  const [reports, setReports] = useState([]);
  const [staff, setStaff] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [filters, setFilters] = useState({
    status: 'pending',
    category: '',
    severity: '',
    search: '',
  });
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const theme = useTheme();
  const { emitEvent } = useSocket();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAndSortReports();
  }, [reports, filters, sortConfig]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsRes, staffRes] = await Promise.all([
        reportAPI.getReports({ status: 'pending', limit: 100 }),
        staffAPI.getAllStaff(),
      ]);

      setReports(reportsRes.data.reports || []);
      setStaff(staffRes.data.staff || []);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortReports = () => {
    let filtered = [...reports];

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(report => report.status === filters.status);
    }

    if (filters.category) {
      filtered = filtered.filter(report => report.category === filters.category);
    }

    if (filters.severity) {
      filtered = filtered.filter(report => report.severity === filters.severity);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchLower) ||
        report.description.toLowerCase().includes(searchLower) ||
        report.location?.address?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortConfig.direction === 'asc') {
        return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
      } else {
        return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
      }
    });

    setFilteredReports(filtered);
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const handleAssign = (report) => {
    setSelectedReport(report);
    setAssignDialogOpen(true);
  };

  const handleAssignConfirm = async () => {
    if (!selectedReport || !selectedStaff) return;

    try {
      await reportAPI.assignToStaff(selectedReport._id, selectedStaff);
      
      // Emit socket event
      await emitEvent('task:assigned', {
        reportId: selectedReport._id,
        staffId: selectedStaff,
        assignedBy: 'admin',
      });

      // Update local state
      setReports(prev => prev.filter(r => r._id !== selectedReport._id));
      
      toast.success('Task assigned successfully!');
      setAssignDialogOpen(false);
      setSelectedReport(null);
      setSelectedStaff('');
    } catch (error) {
      toast.error('Failed to assign task');
    }
  };

  const getStaffByCategory = (category) => {
    return staff.filter(s => s.specialization === category);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: theme.palette.success.main,
      medium: theme.palette.warning.main,
      high: theme.palette.error.main,
    };
    return colors[severity];
  };

  const SortableHeader = ({ label, sortKey }) => (
    <Box
      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
      onClick={() => handleSort(sortKey)}
    >
      <Typography variant="subtitle2" fontWeight={600}>
        {label}
      </Typography>
      {sortConfig.key === sortKey ? (
        sortConfig.direction === 'asc' ? (
          <ArrowUpward sx={{ fontSize: 14 }} />
        ) : (
          <ArrowDownward sx={{ fontSize: 14 }} />
        )
      ) : null}
    </Box>
  );

  const categories = [
    { value: 'pothole', label: 'Pothole Repair', color: theme.palette.warning.main },
    { value: 'drainage', label: 'Drainage', color: theme.palette.primary.main },
    { value: 'lighting', label: 'Lighting', color: theme.palette.secondary.main },
    { value: 'garbage', label: 'Garbage', color: theme.palette.error.main },
    { value: 'signboard', label: 'Signboard', color: theme.palette.success.main },
  ];

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <LinearProgress sx={{ width: '100%' }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" fontWeight={800}>
              Assign Tasks
            </Typography>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={fetchData}
            >
              Refresh
            </Button>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Assign pending reports to staff members based on their specialization
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {categories.map((category) => {
            const categoryReports = reports.filter(r => r.category === category.value);
            const availableStaff = getStaffByCategory(category.value);
            
            return (
              <Grid item xs={12} sm={6} md={2.4} key={category.value}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: category.color,
                        }}
                      />
                      <Typography variant="subtitle2" fontWeight={600}>
                        {category.label}
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight={800}>
                      {categoryReports.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {availableStaff.length} staff available
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="assigned">Assigned</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category}
                    label="Category"
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map(cat => (
                      <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={filters.severity}
                    label="Severity"
                    onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                  >
                    <MenuItem value="">All Severities</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search reports..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="25%">
                      <SortableHeader label="Title" sortKey="title" />
                    </TableCell>
                    <TableCell>
                      <SortableHeader label="Category" sortKey="category" />
                    </TableCell>
                    <TableCell>
                      <SortableHeader label="Severity" sortKey="severity" />
                    </TableCell>
                    <TableCell>
                      <SortableHeader label="Location" sortKey="location.address" />
                    </TableCell>
                    <TableCell>
                      <SortableHeader label="Date" sortKey="createdAt" />
                    </TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReports.length > 0 ? (
                    filteredReports.map((report) => {
                      const availableStaff = getStaffByCategory(report.category);
                      
                      return (
                        <TableRow key={report._id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {report.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {report.description.substring(0, 50)}...
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={report.category}
                              size="small"
                              sx={{
                                backgroundColor: categories.find(c => c.value === report.category)?.color + '20',
                                color: categories.find(c => c.value === report.category)?.color,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={report.severity}
                              size="small"
                              sx={{
                                backgroundColor: getSeverityColor(report.severity) + '20',
                                color: getSeverityColor(report.severity),
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {report.location?.address?.split(',')[0]}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {format(new Date(report.createdAt), 'MMM dd')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(report.createdAt), 'hh:mm a')}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Assignment />}
                              onClick={() => handleAssign(report)}
                              disabled={availableStaff.length === 0}
                            >
                              Assign
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                          <Typography variant="body1" color="text.secondary">
                            No reports found
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {filters.status === 'pending' 
                              ? 'All pending reports have been assigned'
                              : 'Try changing your filters'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Assign Dialog */}
        <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Typography variant="h6" fontWeight={600}>
              Assign Task
            </Typography>
          </DialogTitle>
          <DialogContent>
            {selectedReport && (
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    Assigning: <strong>{selectedReport.title}</strong>
                  </Typography>
                  <Typography variant="caption">
                    Category: {selectedReport.category} • Severity: {selectedReport.severity}
                  </Typography>
                </Alert>

                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Select Staff Member</InputLabel>
                  <Select
                    value={selectedStaff}
                    label="Select Staff Member"
                    onChange={(e) => setSelectedStaff(e.target.value)}
                  >
                    <MenuItem value="">Choose a staff member</MenuItem>
                    {getStaffByCategory(selectedReport.category).map((staffMember) => (
                      <MenuItem key={staffMember._id} value={staffMember._id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              backgroundColor: theme.palette.primary.main,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontWeight: 600,
                            }}
                          >
                            {staffMember.name?.charAt(0)}
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {staffMember.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {staffMember.email}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {getStaffByCategory(selectedReport.category).length === 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    No staff members available for this category. Please add staff members first.
                  </Alert>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAssignConfirm}
              variant="contained"
              disabled={!selectedStaff}
            >
              Assign Task
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default AssignTasks;