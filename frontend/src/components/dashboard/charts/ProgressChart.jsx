// src/components/dashboard/charts/ProgressChart.jsx
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

const ProgressChart = ({ data = [] }) => {
  const theme = useTheme();

  // ✅ Transform data properly - include all statuses
  const chartData = data.map(item => ({
    name: item.month || item.name,
    reports: item.reports || 0,
    resolved: item.resolved || 0,
    pending: item.pending || 0,
    assigned: item.assigned || 0, // Add this
    inProgress: item.inProgress || 0, // Add this if you have inProgress data
    progress: item.progress || 0
  }));

  console.log('ProgressChart received data:', data);
  console.log('ChartData after transformation:', chartData);

  // Colors for different statuses
  const statusColors = {
    resolved: theme.palette.success.main,
    pending: theme.palette.warning.main,
    assigned: theme.palette.info.main, // Add color for assigned
    inProgress: theme.palette.primary.main,
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataItem = chartData.find(item => item.name === label);
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            p: 2,
            borderRadius: 1,
            boxShadow: theme.shadows[3],
            border: `1px solid ${theme.palette.divider}`,
            minWidth: 200,
          }}
        >
          <Typography variant="body2" fontWeight={600} gutterBottom>
            {label}
          </Typography>
          {dataItem && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Total Reports:</Typography>
                <Typography variant="body2" fontWeight={600}>{dataItem.reports}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Resolved:</Typography>
                <Typography variant="body2" fontWeight={600} color={statusColors.resolved}>
                  {dataItem.resolved}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Assigned:</Typography>
                <Typography variant="body2" fontWeight={600} color={statusColors.assigned}>
                  {dataItem.assigned}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">In Progress:</Typography>
                <Typography variant="body2" fontWeight={600} color={statusColors.inProgress}>
                  {dataItem.inProgress}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Pending:</Typography>
                <Typography variant="body2" fontWeight={600} color={statusColors.pending}>
                  {dataItem.pending}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="body2" color="text.secondary">Resolution Rate:</Typography>
                <Typography variant="body2" fontWeight={600} color="primary.main">
                  {Math.round((dataItem.resolved / Math.max(dataItem.reports, 1)) * 100)}%
                </Typography>
              </Box>
            </>
          )}
        </Box>
      );
    }
    return null;
  };

  // If no data or all data is zero, show placeholder
  if (!chartData || chartData.length === 0 || chartData.every(item => item.reports === 0)) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Monthly Progress
          </Typography>
          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <Typography color="text.secondary" gutterBottom>
              No report data available
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Your progress will appear here once you submit reports
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Monthly Progress
        </Typography>
        <Box sx={{ height: "350px", minHeight: "350px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 10,
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme.palette.divider}
                vertical={false}
              />
              <XAxis 
                dataKey="name"
                stroke={theme.palette.text.secondary}
                tick={{ fill: theme.palette.text.secondary }}
                axisLine={{ stroke: theme.palette.divider }}
                tickLine={{ stroke: theme.palette.divider }}
              />
              <YAxis
                stroke={theme.palette.text.secondary}
                tick={{ fill: theme.palette.text.secondary }}
                axisLine={{ stroke: theme.palette.divider }}
                tickLine={{ stroke: theme.palette.divider }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top"
                height={40}
                wrapperStyle={{ paddingBottom: '10px' }}
                formatter={(value) => (
                  <span style={{ fontSize: '12px', color: theme.palette.text.secondary }}>
                    {value}
                  </span>
                )}
              />
              {/* Add all status bars */}
              <Bar
                dataKey="resolved"
                name="Resolved"
                stackId="a"
                fill={statusColors.resolved}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="inProgress"
                name="In Progress"
                stackId="a"
                fill={statusColors.inProgress}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="assigned"
                name="Assigned"
                stackId="a"
                fill={statusColors.assigned}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="pending"
                name="Pending"
                stackId="a"
                fill={statusColors.pending}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 3, 
          mt: 3,
          flexWrap: 'wrap' 
        }}>
          {[
            { label: 'Resolved', color: statusColors.resolved, value: chartData.reduce((sum, item) => sum + item.resolved, 0) },
            { label: 'In Progress', color: statusColors.inProgress, value: chartData.reduce((sum, item) => sum + item.inProgress, 0) },
            { label: 'Assigned', color: statusColors.assigned, value: chartData.reduce((sum, item) => sum + item.assigned, 0) },
            { label: 'Pending', color: statusColors.pending, value: chartData.reduce((sum, item) => sum + item.pending, 0) },
            { label: 'Total Reports', color: theme.palette.primary.main, value: chartData.reduce((sum, item) => sum + item.reports, 0) },
          ].map((item, index) => (
            <Box 
              key={index} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1 
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '2px',
                  backgroundColor: item.color,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {item.label}: <strong style={{ color: theme.palette.text.primary }}>{item.value}</strong>
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProgressChart;