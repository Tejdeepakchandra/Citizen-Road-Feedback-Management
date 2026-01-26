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
  Divider,
  IconButton,
  InputAdornment,
  useTheme,
  Grid,
} from '@mui/material';
import {
  Lock,
  Email,
  Visibility,
  VisibilityOff,
  Google,
  GitHub,
  Check,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Login successful!');
        
        // Navigate to the appropriate dashboard based on role
        if (result.redirectTo) {
          navigate(result.redirectTo);
        } else {
          // Fallback based on role
          switch (result.user.role) {
            case 'admin':
              navigate('/admin/dashboard');
              break;
            case 'staff':
              navigate('/staff/dashboard');
              break;
            default:
              navigate('/dashboard');
          }
        }
      }
    } catch (error) {
      setErrors({ submit: 'Invalid email or password' });
      toast.error(error.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%' }}
        >
          <Card
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 20px 60px rgba(0, 0, 0, 0.5)'
                : '0 20px 60px rgba(0, 0, 0, 0.1)',
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(255, 255, 255, 0.2)',
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
                : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              bgcolor: theme.palette.background.paper,
            }}
          >
            <CardContent sx={{ p: 5 }}>
              {/* Logo */}
              <Box sx={{ textAlign: 'center', mb: 5 }}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: 2.5,
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    <Lock sx={{ color: '#fff', fontSize: 36 }} />
                  </Box>
                </motion.div>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  gutterBottom
                  sx={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Welcome Back
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                  Sign in to your RoadCare account and make a difference
                </Typography>
              </Box>

              {errors.submit && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {errors.submit}
                </Alert>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  margin="normal"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      color: theme.palette.text.primary,
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'rgba(0, 0, 0, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: theme.palette.text.primary,
                    },
                    '& .MuiInputAdornment-root': {
                      color: theme.palette.text.secondary,
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: theme.palette.primary.main }} />
                      </InputAdornment>
                    ),
                  }}
                  disabled={loading}
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  margin="normal"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      color: theme.palette.text.primary,
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'rgba(0, 0, 0, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: theme.palette.text.primary,
                    },
                    '& .MuiInputAdornment-root': {
                      color: theme.palette.text.secondary,
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: theme.palette.primary.main }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  disabled={loading}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 2 }}>
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    variant="body2"
                    color="primary"
                    underline="hover"
                    sx={{
                      transition: 'color 0.3s ease',
                      '&:hover': {
                        color: 'primary.dark',
                      },
                    }}
                  >
                    Forgot password?
                  </Link>
                  <Link
                    component={RouterLink}
                    to="/register"
                    variant="body2"
                    color="primary"
                    underline="hover"
                    sx={{
                      transition: 'color 0.3s ease',
                      '&:hover': {
                        color: 'primary.dark',
                      },
                    }}
                  >
                    Create new account
                  </Link>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.75,
                    mb: 2,
                    borderRadius: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
                      boxShadow: '0 12px 32px rgba(37, 99, 235, 0.4)',
                      transform: 'translateY(-2px)',
                    },
                    '&:disabled': {
                      background: 'linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%)',
                    },
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>


            </CardContent>
          </Card>

          {/* Features */}
          <Box sx={{ mt: 6 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              textAlign="center"
              gutterBottom
              sx={{
                fontSize: '1.25rem',
                mb: 3,
                color: theme.palette.text.primary,
              }}
            >
              Transform Your Community with RoadCare
            </Typography>
            <Grid container spacing={2.5} sx={{ mt: 1 }}>
              {[
                { title: 'Report Issues', desc: 'Instantly report road problems with photos and location' },
                { title: 'Real-time Updates', desc: 'Track resolution progress as it happens' },
                { title: 'Community Impact', desc: 'See before/after transformations of your city' },
                { title: 'Support Growth', desc: 'Contribute through donations for infrastructure' },
              ].map((item, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      background: theme.palette.mode === 'dark'
                        ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.action.hover} 100%)`
                        : 'linear-gradient(135deg, #f5f7fa 0%, #f0f4ff 100%)',
                      border: theme.palette.mode === 'dark'
                        ? `1px solid ${theme.palette.divider}`
                        : '1px solid #e5e9f2',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[4],
                        border: `1px solid ${theme.palette.primary.main}`,
                      },
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: theme.palette.primary.main + '20',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Check sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ mb: 0.5, color: theme.palette.text.primary }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </motion.div>
      </Box>
    </Container>
  );
};

export default Login;