// src/pages/Admin/FinancialManagement.jsx
import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
} from '@mui/material';

const FinancialManagement = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Financial Management
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Financial reporting and donation tracking will be implemented here.
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Features to include:
            <ul>
              <li>Donation tracking</li>
              <li>Financial reports</li>
              <li>Budget allocation</li>
              <li>Expense management</li>
            </ul>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default FinancialManagement;