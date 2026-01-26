import React, { useState } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Email,
  ArrowBack,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authAPI } from '../../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.forgotPassword(email);
      
      if (response.data.success) {
        setSubmitted(true);
        toast.success('Password reset link sent to your email!');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to send reset link. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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

              {!submitted ? (
                <>
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
                      Forgot Password?
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Enter your email address and we'll send you a link to reset your password.
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
                    {/* Email Input */}
                    <TextField
                      fullWidth
                      type="email"
                      label="Email Address"
                      name="email"
                      value={email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      disabled={loading}
                      InputProps={{
                        startAdornment: (
                          <Email sx={{ mr: 1, color: 'action.active' }} />
                        ),
                      }}
                      sx={{ mb: 3 }}
                      variant="outlined"
                    />

                    {/* Submit Button */}
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      onClick={handleSubmit}
                      sx={{
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #0284c7 0%, #0891b2 100%)',
                        },
                        mb: 2,
                        fontWeight: 600,
                      }}
                    >
                      {loading ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </Button>
                  </form>

                  {/* Sign Up Link */}
                  <Typography variant="body2" align="center" color="text.secondary">
                    Don't have an account?{' '}
                    <Link
                      component={RouterLink}
                      to="/register"
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'none',
                        fontWeight: 600,
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      Sign up
                    </Link>
                  </Typography>
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
                      <Typography variant="h4" sx={{ color: 'white' }}>
                        ✓
                      </Typography>
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      Check Your Email
                    </Typography>

                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                      We've sent a password reset link to <strong>{email}</strong>
                    </Typography>

                    <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
                      The link will expire in 30 minutes. If you don't see the email, check your spam folder.
                    </Typography>

                    {/* Back to Login Button */}
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
                      Back to Login
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

export default ForgotPassword;
