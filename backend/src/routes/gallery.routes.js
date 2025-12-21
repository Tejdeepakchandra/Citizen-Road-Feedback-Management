const express = require('express');
const router = express.Router();
const {
  getApprovedGallery,
  getFeaturedGallery,
  getGalleryByCategory,
  likeGalleryImage,
  getGalleryDetails,
  getUserGallery,
  getUserGalleryStats

} = require('../controllers/gallery.controller');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/approved', getApprovedGallery);
router.get('/featured', getFeaturedGallery);
router.get('/category/:category', getGalleryByCategory);
router.get('/:id', getGalleryDetails);

// Authenticated routes
router.post('/:id/like', protect, likeGalleryImage);
router.get('/user/:userId', protect, getUserGallery);
router.get('/user/:userId/stats', protect, getUserGalleryStats);

module.exports = router;