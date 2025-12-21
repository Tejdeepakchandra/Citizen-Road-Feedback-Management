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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Alert,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Person,
  Email,
  Phone,
  Assignment,
  CheckCircle,
  Warning,
  MoreVert,
  Refresh,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { staffAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const ManageStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    address: '',
    status: 'active',
  });
  const [staffToDelete, setStaffToDelete] = useState(null);
  const theme = useTheme();

  const specializations = [
    { value: 'pothole', label: 'Pothole Repair' },
    { value: 'lighting', label: 'Street Lighting' },
    { value: 'drainage', label: 'Drainage' },
    { value: 'garbage', label: 'Garbage/Sanitation' },
    { value: 'signboard', label: 'Signboard/Signage' },
    { value: 'general', label: 'General Maintenance' },
  ];

  const statusColors = {
    active: 'success',
    inactive: 'warning',
    suspended: 'error',
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await staffAPI.getAllStaff();
      setStaff(response.data.staff || []);
    } catch (error) {
      toast.error('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (staffMember = null) => {
    if (staffMember) {
      setSelectedStaff(staffMember);
      setFormData({
        name: staffMember.name,
        email: staffMember.email,
        phone: staffMember.phone,
        specialization: staffMember.specialization,
        address: staffMember.address || '',
        status: staffMember.status || 'active',
      });
    } else {
      setSelectedStaff(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        address: '',
        status: 'active',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedStaff(null);
  };

  const handleSubmit = async () => {
    try {
      if (selectedStaff) {
        // Update existing staff
        await staffAPI.updateStaff(selectedStaff._id, formData);
        toast.success('Staff updated successfully');
      } else {
        // Create new staff
        await staffAPI.createStaff(formData);
        toast.success('Staff created successfully');
      }
      
      fetchStaff();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save staff');
    }
  };

  const handleDeleteClick = (staffMember) => {
    setStaffToDelete(staffMember);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return;

    try {
      await staffAPI.deleteStaff(staffToDelete._id);
      toast.success('Staff deleted successfully');
      fetchStaff();
    } catch (error) {
      toast.error('Failed to delete staff');
    } finally {
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
    }
  };

  const getSpecializationColor = (spec) => {
    const colors = {
      pothole: theme.palette.warning.main,
      lighting: theme.palette.secondary.main,
      drainage: theme.palette.primary.main,
      garbage: theme.palette.error.main,
      signboard: theme.palette.success.main,
      general: theme.palette.grey[500],
    };
    return colors[spec] || theme.palette.grey[500];
  };

  const getStaffStats = () => {
    const total = staff.length;
    const active = staff.filter(s => s.status === 'active').length;
    const tasksCompleted = staff.reduce((sum, s) => sum + (s.tasksCompleted || 0), 0);
    
    return { total, active, tasksCompleted };
  };

  const stats = getStaffStats();

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
              Staff Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Add Staff
            </Button>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Manage staff members, their specializations, and assignments
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: theme.palette.primary.main + '20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Person sx={{ color: theme.palette.primary.main }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={800}>
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Staff
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: theme.palette.success.main + '20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle sx={{ color: theme.palette.success.main }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={800}>
                      {stats.active}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Staff
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: theme.palette.warning.main + '20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Assignment sx={{ color: theme.palette.warning.main }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={800}>
                      {stats.tasksCompleted}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tasks Completed
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Staff Table */}
        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Staff Member</TableCell>
                    <TableCell>Specialization</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Performance</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staff.map((staffMember) => (
                    <TableRow key={staffMember._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: getSpecializationColor(staffMember.specialization),
                            }}
                          >
                            {staffMember.name?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {staffMember.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {staffMember.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={specializations.find(s => s.value === staffMember.specialization)?.label || staffMember.specialization}
                          size="small"
                          sx={{
                            backgroundColor: getSpecializationColor(staffMember.specialization) + '20',
                            color: getSpecializationColor(staffMember.specialization),
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {staffMember.phone}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {staffMember.address?.substring(0, 20)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={staffMember.status}
                          size="small"
                          color={statusColors[staffMember.status]}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min((staffMember.tasksCompleted || 0) * 10, 100)}
                            sx={{
                              width: 80,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: theme.palette.grey[200],
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: 
                                  (staffMember.tasksCompleted || 0) >= 8 ? theme.palette.success.main :
                                  (staffMember.tasksCompleted || 0) >= 5 ? theme.palette.warning.main :
                                  theme.palette.error.main,
                              },
                            }}
                          />
                          <Typography variant="caption">
                            {staffMember.tasksCompleted || 0} tasks
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(staffMember)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(staffMember)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {staff.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No staff members found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add staff members to assign tasks and manage road maintenance
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Typography variant="h6" fontWeight={600}>
              {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Specialization</InputLabel>
                  <Select
                    value={formData.specialization}
                    label="Specialization"
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    required
                  >
                    {specializations.map((spec) => (
                      <MenuItem key={spec.value} value={spec.value}>
                        {spec.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {selectedStaff ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Staff Member</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Are you sure you want to delete {staffToDelete?.name}?
            </Alert>
            <Typography variant="body2" color="text.secondary">
              This action cannot be undone. All assigned tasks will be unassigned.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default ManageStaff;