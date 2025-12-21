// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  changePassword,
  deleteAccount,
  getPreferences,
  updatePreferences,
  updateNotificationPreferences,
  updateLanguagePreferences,
  updateThemePreferences,
  forgotPassword,
  resetPassword,
  verifyEmail,
  logout,
  getProfile
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

// Make sure all these functions exist in your auth.controller.js
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/profile', protect, getProfile);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.put('/changepassword', protect, changePassword); // Line 36 - check this
router.delete('/deleteaccount', protect, deleteAccount);
router.get('/preferences', protect, getPreferences);
router.put('/preferences', protect, updatePreferences);
router.put('/notifications', protect, updateNotificationPreferences);
router.put('/language', protect, updateLanguagePreferences);
router.put('/theme', protect, updateThemePreferences);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.get('/logout', protect, logout);

module.exports = router;