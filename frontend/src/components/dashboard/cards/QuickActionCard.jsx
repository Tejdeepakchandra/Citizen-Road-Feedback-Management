import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  useTheme,
} from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const QuickActionCard = ({ 
  title, 
  description, 
  icon, 
  color, 
  path,
  onClick 
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
          '& .action-button': {
            backgroundColor: color,
            color: theme.palette.getContrastText(color),
          }
        }
      }}
      onClick={handleClick}
    >
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ 
            backgroundColor: `${color}20`,
            color: color,
            borderRadius: 2,
            p: 1.5,
            mr: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {icon}
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Button
            className="action-button"
            variant="outlined"
            size="small"
            endIcon={<ArrowForward />}
            sx={{
              borderColor: color,
              color: color,
              '&:hover': {
                borderColor: color,
                backgroundColor: `${color}10`,
              }
            }}
          >
            Take Action
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default QuickActionCard;