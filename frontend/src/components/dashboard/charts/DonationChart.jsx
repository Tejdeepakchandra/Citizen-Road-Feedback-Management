import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const DonationChart = ({ data }) => {
  const theme = useTheme();

  // Sample data if not provided
  const chartData = data || [
    { date: 'Jan 1', amount: 5000 },
    { date: 'Jan 8', amount: 8000 },
    { date: 'Jan 15', amount: 6500 },
    { date: 'Jan 22', amount: 12000 },
    { date: 'Jan 29', amount: 9500 },
    { date: 'Feb 5', amount: 15000 },
    { date: 'Feb 12', amount: 11000 },
    { date: 'Feb 19', amount: 18000 },
    { date: 'Feb 26', amount: 22000 },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            p: 2,
            borderRadius: 1,
            boxShadow: theme.shadows[3],
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="body2" fontWeight={600} gutterBottom>
            {label}
          </Typography>
          <Typography variant="body2" color={theme.palette.success.main}>
            ₹{payload[0].value.toLocaleString()}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Donation Trends
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis
                dataKey="date"
                stroke={theme.palette.text.secondary}
                tick={{ fill: theme.palette.text.secondary }}
              />
              <YAxis
                stroke={theme.palette.text.secondary}
                tick={{ fill: theme.palette.text.secondary }}
                tickFormatter={(value) => `₹${value / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke={theme.palette.success.main}
                fill={theme.palette.success.main + '30'}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total Raised
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              ₹{chartData.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Avg. Donation
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              ₹{Math.round(chartData.reduce((sum, item) => sum + item.amount, 0) / chartData.length).toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Growth
            </Typography>
            <Typography variant="h6" fontWeight={600} color="success.main">
              +42%
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DonationChart;