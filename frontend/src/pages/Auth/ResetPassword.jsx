import React, { useState } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Lock,
  Visibility,
  VisibilityOff,
  ArrowBack,
  Check,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authAPI } from '../../services/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(true);
  const theme = useTheme();

  React.useEffect(() => {
    // Validate token on mount
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      setValidating(false);
    } else {
      setValidating(false);
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const validatePasswords = () => {
    const { password, confirmPassword } = formData;

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswords()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.resetPassword(token, formData.password);
      
      if (response.data.success) {
        setSubmitted(true);
        toast.success('Password reset successful!');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return 'none';
    if (password.length < 6) return 'weak';
    if (password.length < 10) return 'medium';
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) return 'strong';
    return 'medium';
  };

  const passwordStrength = getPasswordStrength();
  const strengthColor = {
    none: 'inherit',
    weak: '#ef4444',
    medium: '#f59e0b',
    strong: '#10b981',
  };

  if (validating) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        py: 3,
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            sx={{
              borderRadius: '12px',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.5)'
                : '0 8px 32px rgba(0, 0, 0, 0.1)',
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(30, 41, 59, 0.8)'
                : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.mode === 'dark'
                ? 'rgba(100, 116, 139, 0.3)'
                : 'rgba(148, 163, 184, 0.2)'
              }`,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {!submitted ? (
                <>
                  {/* Back Button */}
                  <Button
                    startIcon={<ArrowBack />}
                    component={RouterLink}
                    to="/login"
                    size="small"
                    sx={{ mb: 3 }}
                  >
                    Back to Login
                  </Button>

                  {/* Header */}
                  <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        mb: 1,
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Reset Password
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Enter your new password below.
                    </Typography>
                  </Box>

                  {/* Error Alert */}
                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit}>
                    {/* Password Input */}
                    <TextField
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      label="New Password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter new password"
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <Lock sx={{ mr: 1, color: 'action.active' }} />
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              disabled={loading}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mb: 2 }}
                    />

                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <Box sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 0.5,
                            mb: 0.5,
                          }}
                        >
                          {['', '', ''].map((_, i) => (
                            <Box
                              key={i}
                              sx={{
                                flex: 1,
                                height: 4,
                                borderRadius: 1,
                                backgroundColor:
                                  passwordStrength === 'weak'
                                    ? i === 0 ? '#ef4444' : '#e5e7eb'
                                    : passwordStrength === 'medium'
                                      ? i < 2 ? '#f59e0b' : '#e5e7eb'
                                      : '#10b981',
                              }}
                            />
                          ))}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: strengthColor[passwordStrength],
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}
                        >
                          {passwordStrength === 'none' ? 'Enter password' : `${passwordStrength} password`}
                        </Typography>
                      </Box>
                    )}

                    {/* Confirm Password Input */}
                    <TextField
                      fullWidth
                      type={showConfirmPassword ? 'text' : 'password'}
                      label="Confirm Password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <Lock sx={{ mr: 1, color: 'action.active' }} />
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                              disabled={loading}
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mb: 3 }}
                    />

                    {/* Match Indicator */}
                    {formData.password && formData.confirmPassword && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 2,
                          color: formData.password === formData.confirmPassword
                            ? '#10b981'
                            : '#ef4444',
                        }}
                      >
                        {formData.password === formData.confirmPassword ? (
                          <Check fontSize="small" />
                        ) : (
                          <Typography variant="caption">✗</Typography>
                        )}
                        <Typography variant="caption">
                          {formData.password === formData.confirmPassword
                            ? 'Passwords match'
                            : 'Passwords do not match'}
                        </Typography>
                      </Box>
                    )}

                    {/* Submit Button */}
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading || !formData.password || !formData.confirmPassword}
                      onClick={handleSubmit}
                      sx={{
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #0284c7 0%, #0891b2 100%)',
                        },
                        fontWeight: 600,
                      }}
                    >
                      {loading ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Resetting...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  {/* Success Message */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <Check sx={{ color: 'white', fontSize: 32 }} />
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      Password Reset Successful!
                    </Typography>

                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                      Your password has been reset successfully. You can now log in with your new password.
                    </Typography>

                    <Button
                      fullWidth
                      variant="contained"
                      component={RouterLink}
                      to="/login"
                      sx={{
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #0284c7 0%, #0891b2 100%)',
                        },
                        fontWeight: 600,
                      }}
                    >
                      Go to Login
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ResetPassword;
