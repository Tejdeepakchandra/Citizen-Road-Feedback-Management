import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

const CategoryChart = ({ data = [] }) => {
  const theme = useTheme();

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    '#8B5CF6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
  ];

  const categoryIcons = {
    pothole: '🕳️',
    drainage: '🌊',
    lighting: '💡',
    garbage: '🗑️',
    signboard: '🪧',
    road_markings: '🛣️',
    sidewalk: '🚶',
    other: '❓',
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
      const percentage = total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : 0;
      
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            p: 1.5,
            borderRadius: 1,
            boxShadow: theme.shadows[3],
            border: `1px solid ${theme.palette.divider}`,
            minWidth: 150,
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            {payload[0].payload.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Count: {payload[0].value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Percentage: {percentage}%
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Hide small labels

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // If no data, show placeholder
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Issue Categories
          </Typography>
          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">
              No category data available
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
          Issue Categories
        </Typography>
        <Box sx={{ height: "300px" , width:"100%",  minHeight:"300px"}}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                innerRadius={40}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke={theme.palette.background.paper}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '12px' }}>
                    <span style={{ fontSize: '16px' }}>
                      {categoryIcons[value.toLowerCase()] || '📊'}
                    </span>
                    <span>{value}</span>
                  </Box>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
          {data.slice(0, 6).map((item, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                px: 1.5,
                py: 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: COLORS[index],
                  }}
                />
                <Typography variant="caption" color="text.secondary" noWrap>
                  {item.name}
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={600}>
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CategoryChart;