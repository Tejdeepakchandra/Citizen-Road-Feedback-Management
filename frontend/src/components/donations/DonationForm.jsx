import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Alert,
  CircularProgress,
  useTheme,
  Checkbox,
} from '@mui/material';
import {
  AccountBalance,
  Paid,
  Message,
  Favorite,
  CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { donationAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  amount: yup.number().required('Amount is required').min(10, 'Minimum amount is ₹10'),
  message: yup.string().max(500, 'Message too long'),
  anonymous: yup.boolean(),
});

const presetAmounts = [100, 500, 1000, 2000, 5000];
const causes = [
  { value: 'general', label: 'General Road Development', description: 'Support overall road improvement projects' },
  { value: 'pothole', label: 'Pothole Repair Fund', description: 'Dedicated to fixing dangerous potholes' },
  { value: 'lighting', label: 'Street Lighting', description: 'Install and maintain street lights' },
  { value: 'greenery', label: 'Roadside Greenery', description: 'Plant trees and maintain green spaces' },
  { value: 'safety', label: 'Road Safety', description: 'Improve signage and safety measures' },
];

const DonationForm = () => {
  const [loading, setLoading] = useState(false);
  const [selectedCause, setSelectedCause] = useState('general');
  const [customAmount, setCustomAmount] = useState(500);
  const [showSuccess, setShowSuccess] = useState(false);
  const theme = useTheme();
  const { user } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      amount: 500,
      message: '',
      anonymous: false,
    },
  });

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const processPayment = async (paymentData) => {
    try {
      const response = await donationAPI.verifyPayment(paymentData);
      return response.data;
    } catch (error) {
      throw new Error('Payment verification failed');
    }
  };

  const onSubmit = async (data) => {
    if (!window.Razorpay) {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Failed to load payment gateway');
        return;
      }
    }

    setLoading(true);
    try {
      // Create order
      const orderResponse = await donationAPI.createOrder(data.amount);
      const { order_id, amount } = orderResponse.data;

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: amount,
        currency: 'INR',
        name: 'RoadCare - Smart Road Maintenance',
        description: `Donation for ${causes.find(c => c.value === selectedCause)?.label}`,
        order_id: order_id,
        handler: async (response) => {
          try {
            const paymentData = {
              ...response,
              donationData: {
                ...data,
                cause: selectedCause,
              },
            };

            const verification = await processPayment(paymentData);
            
            if (verification.success) {
              setShowSuccess(true);
              reset();
              toast.success('Donation successful! Thank you for your contribution.');
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            toast.error('Payment processing failed');
          }
        },
        prefill: {
          name: data.name,
          email: data.email,
        },
        theme: {
          color: theme.palette.primary.main,
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.info('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process donation');
    } finally {
      setLoading(false);
    }
  };

  const amount = watch('amount');

  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: theme.palette.success.main + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <CheckCircle sx={{ fontSize: 48, color: theme.palette.success.main }} />
            </Box>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Thank You for Your Donation!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your contribution will help make our roads safer and better for everyone.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              A confirmation email has been sent to your registered email address.
            </Typography>
            <Button
              variant="contained"
              onClick={() => setShowSuccess(false)}
              sx={{ mr: 2 }}
            >
              Make Another Donation
            </Button>
            <Button variant="outlined" href="/dashboard">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                backgroundColor: theme.palette.success.main + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Paid sx={{ color: theme.palette.success.main, fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Support Road Development
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your donation helps improve infrastructure and make roads safer
              </Typography>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              All donations are tax-deductible. You'll receive a receipt for your contribution.
            </Typography>
          </Alert>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Donation Amount */}
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Select Donation Amount
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={1}>
                    {presetAmounts.map((amt) => (
                      <Grid item key={amt}>
                        <Button
                          variant={amount === amt ? 'contained' : 'outlined'}
                          onClick={() => setValue('amount', amt)}
                          sx={{
                            minWidth: 80,
                            backgroundColor: amount === amt ? theme.palette.primary.main : 'transparent',
                            '&:hover': {
                              backgroundColor: amount === amt 
                                ? theme.palette.primary.dark 
                                : theme.palette.action.hover,
                            },
                          }}
                        >
                          ₹{amt}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
                <Box sx={{ px: 2 }}>
                  <Controller
                    name="amount"
                    control={control}
                    render={({ field }) => (
                      <Slider
                        {...field}
                        min={10}
                        max={10000}
                        step={10}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `₹${value}`}
                        sx={{
                          color: theme.palette.primary.main,
                          '& .MuiSlider-valueLabel': {
                            backgroundColor: theme.palette.primary.main,
                          },
                        }}
                        onChange={(_, value) => {
                          field.onChange(value);
                          setCustomAmount(value);
                        }}
                      />
                    )}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      ₹10
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      ₹{customAmount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ₹10,000
                    </Typography>
                  </Box>
                </Box>
                {errors.amount && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {errors.amount.message}
                  </Alert>
                )}
              </Grid>

              {/* Select Cause */}
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Choose a Cause
                </Typography>
                <RadioGroup
                  value={selectedCause}
                  onChange={(e) => setSelectedCause(e.target.value)}
                >
                  {causes.map((cause) => (
                    <Card
                      key={cause.value}
                      sx={{
                        mb: 1,
                        cursor: 'pointer',
                        border: selectedCause === cause.value 
                          ? `2px solid ${theme.palette.primary.main}` 
                          : `1px solid ${theme.palette.divider}`,
                        backgroundColor: selectedCause === cause.value 
                          ? theme.palette.primary.main + '08' 
                          : 'transparent',
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                      onClick={() => setSelectedCause(cause.value)}
                    >
                      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                        <FormControlLabel
                          value={cause.value}
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="body1" fontWeight={600}>
                                {cause.label}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {cause.description}
                              </Typography>
                            </Box>
                          }
                          sx={{ m: 0, width: '100%' }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </RadioGroup>
              </Grid>

              {/* Donor Information */}
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Your Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Full Name"
                          fullWidth
                          error={!!errors.name}
                          helperText={errors.name?.message}
                          InputProps={{
                            startAdornment: (
                              <AccountBalance sx={{ mr: 1, color: 'action.active' }} />
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Email Address"
                          type="email"
                          fullWidth
                          error={!!errors.email}
                          helperText={errors.email?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Message */}
              <Grid item xs={12}>
                <Controller
                  name="message"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Optional Message"
                      multiline
                      rows={3}
                      fullWidth
                      placeholder="Add a personal message to be displayed on the donor wall..."
                      error={!!errors.message}
                      helperText={errors.message?.message}
                      InputProps={{
                        startAdornment: (
                          <Message sx={{ mr: 1, color: 'action.active', alignSelf: 'flex-start', mt: 1.5 }} />
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Anonymous Donation */}
              <Grid item xs={12}>
                <Controller
                  name="anonymous"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          {...field}
                          checked={field.value}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Favorite sx={{ color: 'text.secondary', fontSize: 16 }} />
                          <Typography variant="body2" color="text.secondary">
                            Make this donation anonymous
                          </Typography>
                        </Box>
                      }
                    />
                  )}
                />
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Amount
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      ₹{amount}
                    </Typography>
                  </Box>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      px: 6,
                      py: 1.5,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Donate Now'
                    )}
                  </Button>
                </Box>
              </Grid>

              {/* Security Note */}
              <Grid item xs={12}>
                <Alert severity="info" icon={false}>
                  <Typography variant="caption">
                    <strong>Secure Payment:</strong> Your donation is processed securely through Razorpay.
                    We do not store your payment information.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DonationForm;