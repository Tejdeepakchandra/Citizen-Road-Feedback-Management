import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Pending,
  Assignment,
  Build,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { format } from 'date-fns';

const StatusTimeline = ({ status, createdAt, onStatusUpdate }) => {
  const theme = useTheme();

  const steps = [
    {
      label: 'Pending',
      icon: <Pending />,
      description: 'Report submitted and awaiting review',
      color: theme.palette.warning.main,
    },
    {
      label: 'Assigned',
      icon: <Assignment />,
      description: 'Assigned to staff for investigation',
      color: theme.palette.info.main,
    },
    {
      label: 'In Progress',
      icon: <Build />,
      description: 'Work has started on the issue',
      color: theme.palette.primary.main,
    },
    {
      label: 'Completed',
      icon: <CheckCircle />,
      description: 'Issue has been resolved',
      color: theme.palette.success.main,
    },
    {
      label: 'Cancelled',
      icon: <Cancel />,
      description: 'Report was cancelled',
      color: theme.palette.error.main,
      optional: true,
    },
  ];

  const getCurrentStep = () => {
    const statusMap = {
      pending: 0,
      assigned: 1,
      in_progress: 2,
      completed: 3,
      cancelled: 4,
    };
    return statusMap[status] || 0;
  };

  const currentStep = getCurrentStep();

  const getNextStatus = () => {
    const nextMap = {
      pending: 'assigned',
      assigned: 'in_progress',
      in_progress: 'completed',
    };
    return nextMap[status];
  };

  const handleNext = () => {
    const nextStatus = getNextStatus();
    if (nextStatus && onStatusUpdate) {
      onStatusUpdate(nextStatus);
    }
  };

  return (
    <Box>
      <Stepper activeStep={currentStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label} completed={index < currentStep}>
            <StepLabel
              StepIconProps={{
                icon: step.icon,
                sx: {
                  color: index <= currentStep ? step.color : theme.palette.grey[400],
                },
              }}
              optional={
                step.optional ? (
                  <Typography variant="caption">Optional</Typography>
                ) : null
              }
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body1" fontWeight={600}>
                  {step.label}
                </Typography>
                {index === currentStep && (
                  <Chip
                    label="Current"
                    size="small"
                    color="primary"
                    sx={{ height: 20 }}
                  />
                )}
              </Box>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary">
                {step.description}
              </Typography>
              {index === currentStep && index !== steps.length - 1 && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!getNextStatus()}
                  >
                    Mark as {steps[index + 1].label}
                  </Button>
                </Box>
              )}
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {currentStep === steps.length - 1 && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600} color="success.contrastText">
            Process Completed
          </Typography>
          <Typography variant="caption" color="success.contrastText">
            This report has been marked as {steps[currentStep].label.toLowerCase()}
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary">
          Report created: {format(new Date(createdAt), 'PPpp')}
        </Typography>
      </Box>
    </Box>
  );
};

export default StatusTimeline;