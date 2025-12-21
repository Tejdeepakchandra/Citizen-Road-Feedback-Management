import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color, 
  subtitle, 
  trend, 
  trendValue,
  loading = false 
}) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Loading...
              </Typography>
              <Typography variant="h4" sx={{ mb: 1 }}>
                ...
              </Typography>
            </Box>
            <Box sx={{ 
              backgroundColor: theme.palette.action.hover, 
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
            }}>
              ...
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[6],
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            
            {trend && trendValue && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                {trend === 'up' ? (
                  <TrendingUp sx={{ fontSize: 16, color: theme.palette.success.main }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 16, color: theme.palette.error.main }} />
                )}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: trend === 'up' ? theme.palette.success.main : theme.palette.error.main,
                    fontWeight: 600 
                  }}
                >
                  {trendValue}%
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box sx={{ 
            backgroundColor: `${color}15`,
            borderRadius: '50%',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
          }}>
            <Box sx={{ color: color, fontSize: 28 }}>
              {icon}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;