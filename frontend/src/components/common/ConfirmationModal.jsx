import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Warning,
  Error,
  Info,
  CheckCircle,
  Close,
} from '@mui/icons-material';

const ConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  children,
  maxWidth = 'sm',
  fullWidth = true,
  disableConfirm = false,
  loading = false,
}) => {
  const theme = useTheme();

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <Error sx={{ color: theme.palette.error.main, fontSize: 48 }} />;
      case 'success':
        return <CheckCircle sx={{ color: theme.palette.success.main, fontSize: 48 }} />;
      case 'info':
        return <Info sx={{ color: theme.palette.info.main, fontSize: 48 }} />;
      default:
        return <Warning sx={{ color: theme.palette.warning.main, fontSize: 48 }} />;
    }
  };

  const getConfirmColor = () => {
    switch (type) {
      case 'error':
        return 'error';
      case 'success':
        return 'success';
      case 'info':
        return 'info';
      default:
        return 'primary';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: 200,
        },
      }}
    >
      <DialogTitle sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              {getIcon()}
            </Box>
            <Typography variant="h5" fontWeight={600}>
              {title}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ ml: 2 }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 0 }}>
        {message && (
          <DialogContentText sx={{ mb: 3, color: 'text.primary', fontSize: '1rem' }}>
            {message}
          </DialogContentText>
        )}
        
        {children}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{ 
            minWidth: 100,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={getConfirmColor()}
          disabled={disableConfirm || loading}
          sx={{ 
            minWidth: 100,
            background: type === 'warning' 
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              : type === 'error'
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : type === 'success'
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : undefined,
            '&:hover': {
              opacity: 0.9,
            },
          }}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationModal;