import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, Typography, Box, Chip, LinearProgress, Button,
  Avatar, Divider, List, ListItem, ListItemText, ListItemAvatar, CircularProgress,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab
} from '@mui/material';
import { ArrowBack, LocationOn, Schedule, PhotoCamera, Update, CheckCircle, 
  Assignment, Build, Lightbulb, Water, Delete, EditRoad, Share, Download } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staffAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const StaffTaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await staffAPI.getTaskDetails(user._id, taskId);
      setTask(response.data);
    } catch (error) {
      console.error('Failed to fetch task details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Container>;
  if (!task) return <Container><Typography>Task not found</Typography></Container>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/staff/tasks')} sx={{ mb: 3 }}>Back to Tasks</Button>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box><Typography variant="h4" fontWeight={700}>{task.title}</Typography>
                  <Typography variant="body1" color="text.secondary">{task.description}</Typography></Box>
                <Chip label={task.status} color={task.status === 'completed' ? 'success' : 'primary'} />
              </Box>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Category</Typography>
                  <Typography variant="body1">{task.category}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Priority</Typography>
                  <Typography variant="body1">{task.priority}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Assigned</Typography>
                  <Typography variant="body1">{new Date(task.assignedAt).toLocaleDateString()}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Due Date</Typography>
                  <Typography variant="body1">{new Date(task.estimatedCompletion).toLocaleDateString()}</Typography></Grid>
              </Grid>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Progress</Typography>
                <LinearProgress variant="determinate" value={task.progress || 0} sx={{ height: 10, borderRadius: 5 }} />
                <Typography variant="body1" align="center" sx={{ mt: 1 }}>{task.progress || 0}% Complete</Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" startIcon={<Update />}>Update Progress</Button>
                <Button variant="outlined" startIcon={<PhotoCamera />}>Upload Images</Button>
                {task.progress >= 90 && <Button variant="contained" color="success" startIcon={<CheckCircle />}>Complete Task</Button>}
              </Box>
            </CardContent>
          </Card>

          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Progress Updates</Typography>
            <List>{task.progressUpdates?.map((update, idx) => (
              <ListItem key={idx}><ListItemAvatar><Avatar>{update.updatedBy?.name?.charAt(0)}</Avatar></ListItemAvatar>
                <ListItemText primary={update.description} secondary={`${update.status} • ${new Date(update.timestamp).toLocaleString()}`} />
              </ListItem>
            ))}</List>
          </CardContent></Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}><CardContent>
            <Typography variant="h6" gutterBottom>Location</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}><LocationOn />
              <Typography>{task.location?.address}</Typography></Box>
            <Button fullWidth variant="outlined" startIcon={<LocationOn />}>View on Map</Button>
          </CardContent></Card>

          <Card sx={{ mb: 3 }}><CardContent>
            <Typography variant="h6" gutterBottom>Reported By</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar>{task.user?.name?.charAt(0)}</Avatar>
              <Box><Typography>{task.user?.name}</Typography>
                <Typography variant="body2" color="text.secondary">{task.user?.email}</Typography></Box>
            </Box>
          </CardContent></Card>

          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button variant="outlined" startIcon={<PhotoCamera />}>Add Before Image</Button>
              <Button variant="outlined" startIcon={<PhotoCamera />}>Add Progress Image</Button>
              <Button variant="outlined" startIcon={<CheckCircle />}>Mark as Completed</Button>
              <Button variant="outlined" startIcon={<Share />}>Share Update</Button>
            </Box>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StaffTaskDetail;