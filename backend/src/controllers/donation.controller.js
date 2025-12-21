const Donation = require('../models/Donation');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendEmail } = require('../services/email.service');
const { createNotification } = require('../services/notification.service');
const { emitToSocket } = require('../services/socket.service');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create donation order
// @route   POST /api/donations/create-order
// @access  Private
exports.createDonationOrder = asyncHandler(async (req, res, next) => {
  const { amount, currency = 'INR', message } = req.body;

  // Validate amount
  if (amount < 10) {
    return next(new ErrorResponse('Minimum donation amount is ₹10', 400));
  }

  const options = {
    amount: amount * 100, // Razorpay expects amount in paise
    currency,
    receipt: `donation_${Date.now()}`,
    notes: {
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      message: message || 'Thank you for supporting road development'
    }
  };

  try {
    const order = await razorpay.orders.create(options);

    // Create donation record
    const donation = await Donation.create({
      user: req.user.id,
      orderId: order.id,
      amount,
      currency,
      message,
      status: 'created'
    });

    res.status(200).json({
      success: true,
      data: {
        order,
        donationId: donation._id
      }
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return next(new ErrorResponse('Failed to create donation order', 500));
  }
});

// @desc    Verify donation payment
// @route   POST /api/donations/verify
// @access  Private
exports.verifyDonation = asyncHandler(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, donationId } = req.body;

  // Validate input
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !donationId) {
    return next(new ErrorResponse('Missing required parameters', 400));
  }

  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return next(new ErrorResponse('Payment verification failed', 400));
  }

  // Find donation record
  const donation = await Donation.findById(donationId);
  if (!donation) {
    return next(new ErrorResponse('Donation not found', 404));
  }

  // Update donation status
  donation.paymentId = razorpay_payment_id;
  donation.status = 'completed';
  donation.completedAt = new Date();
  await donation.save();

  // Update user stats
  await User.findByIdAndUpdate(donation.user, {
    $inc: {
      'stats.donationsMade': 1,
      'stats.totalDonated': donation.amount
    }
  });

  // Create notification
  await createNotification({
    user: donation.user,
    type: 'donation_received',
    title: 'Donation Successful',
    message: `Thank you for your donation of ₹${donation.amount}`,
    data: { donationId: donation._id, amount: donation.amount },
    recipients: ['admin', donation.user]
  });

  // Send thank you email
  await sendEmail({
    to: req.user.email,
    subject: 'Thank You for Your Donation!',
    template: 'donation-thankyou',
    context: {
      name: req.user.name,
      amount: donation.amount,
      date: new Date().toLocaleDateString(),
      transactionId: razorpay_payment_id,
      message: donation.message || 'Your contribution will help improve our roads',
      year: new Date().getFullYear()
    }
  });

  // Send notification to admin
  await sendEmail({
    to: 'admin@smartroad.com',
    subject: 'New Donation Received',
    template: 'admin-donation-received',
    context: {
      donorName: req.user.name,
      donorEmail: req.user.email,
      amount: donation.amount,
      date: new Date().toLocaleDateString(),
      message: donation.message || 'No message provided',
      totalDonated: req.user.stats.totalDonated + donation.amount
    }
  });

  // Emit real-time update
  emitToSocket('donation_received', {
    donationId: donation._id,
    userId: donation.user,
    amount: donation.amount,
    timestamp: new Date()
  });

  res.status(200).json({
    success: true,
    data: donation,
    message: 'Donation verified successfully'
  });
});

// @desc    Get all donations
// @route   GET /api/donations
// @access  Private (Admin)
exports.getDonations = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, status, startDate, endDate } = req.query;
  
  let query = {};

  if (status) query.status = status;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const donations = await Donation.find(query)
    .populate('user', 'name email avatar')
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Donation.countDocuments(query);

  res.status(200).json({
    success: true,
    count: donations.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: donations
  });
});

// @desc    Get user's donations
// @route   GET /api/donations/my
// @access  Private
exports.getMyDonations = asyncHandler(async (req, res, next) => {
  const donations = await Donation.find({ user: req.user.id })
    .sort('-createdAt')
    .limit(20);

  res.status(200).json({
    success: true,
    count: donations.length,
    data: donations
  });
});

// @desc    Get donation statistics
// @route   GET /api/donations/stats
// @access  Public
exports.getDonationStats = asyncHandler(async (req, res, next) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const [
    totalDonations,
    totalAmount,
    monthlyDonations,
    yearlyDonations,
    recentDonations,
    topDonors
  ] = await Promise.all([
    Donation.countDocuments({ status: 'completed' }),
    Donation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Donation.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]),
    Donation.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startOfYear }
        }
      },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]),
    Donation.find({ status: 'completed' })
      .populate('user', 'name avatar')
      .sort('-createdAt')
      .limit(5),
    Donation.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$user',
          totalAmount: { $sum: '$amount' },
          donationCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          userId: '$_id',
          name: '$userInfo.name',
          email: '$userInfo.email',
          avatar: '$userInfo.avatar',
          totalAmount: 1,
          donationCount: 1
        }
      }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalDonations: totalDonations || 0,
      totalAmount: totalAmount[0]?.total || 0,
      monthlyDonations: monthlyDonations[0]?.count || 0,
      monthlyAmount: monthlyDonations[0]?.total || 0,
      yearlyDonations: yearlyDonations[0]?.count || 0,
      yearlyAmount: yearlyDonations[0]?.total || 0,
      recentDonations,
      topDonors
    }
  });
});

// @desc    Get donation by ID
// @route   GET /api/donations/:id
// @access  Private (Admin/Owner)
exports.getDonation = asyncHandler(async (req, res, next) => {
  const donation = await Donation.findById(req.params.id)
    .populate('user', 'name email phone address');

  if (!donation) {
    return next(new ErrorResponse('Donation not found', 404));
  }

  // Check authorization
  if (donation.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to view this donation', 401));
  }

  res.status(200).json({
    success: true,
    data: donation
  });
});

// @desc    Update donation status
// @route   PUT /api/donations/:id/status
// @access  Private (Admin)
exports.updateDonationStatus = asyncHandler(async (req, res, next) => {
  const { status, notes } = req.body;

  const donation = await Donation.findById(req.params.id);
  if (!donation) {
    return next(new ErrorResponse('Donation not found', 404));
  }

  donation.status = status;
  if (notes) donation.adminNotes = notes;
  donation.updatedBy = req.user.id;

  await donation.save();

  if (status === 'refunded') {
    // Send refund notification email
    await sendEmail({
      to: donation.user.email,
      subject: 'Donation Refund Processed',
      template: 'donation-refunded',
      context: {
        name: donation.user.name,
        amount: donation.amount,
        transactionId: donation.paymentId,
        refundDate: new Date().toLocaleDateString(),
        notes: notes || 'Refund processed as per request',
        year: new Date().getFullYear()
      }
    });

    // Create notification
    await createNotification({
      user: req.user.id,
      type: 'donation_refunded',
      title: 'Donation Refunded',
      message: `Donation of ₹${donation.amount} has been refunded`,
      data: { donationId: donation._id },
      recipients: [donation.user]
    });
  }

  res.status(200).json({
    success: true,
    data: donation,
    message: 'Donation status updated successfully'
  });
});

// @desc    Get donation leaderboard
// @route   GET /api/donations/leaderboard
// @access  Public
exports.getDonationLeaderboard = asyncHandler(async (req, res, next) => {
  const { period = 'all', limit = 20 } = req.query;

  let dateFilter = {};
  if (period === 'month') {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    dateFilter.createdAt = { $gte: startOfMonth };
  } else if (period === 'year') {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    dateFilter.createdAt = { $gte: startOfYear };
  }

  const leaderboard = await Donation.aggregate([
    {
      $match: {
        status: 'completed',
        ...dateFilter
      }
    },
    {
      $group: {
        _id: '$user',
        totalAmount: { $sum: '$amount' },
        donationCount: { $sum: 1 },
        lastDonation: { $max: '$createdAt' }
      }
    },
    { $sort: { totalAmount: -1 } },
    { $limit: parseInt(limit) },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    { $unwind: '$userInfo' },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        name: '$userInfo.name',
        email: '$userInfo.email',
        avatar: '$userInfo.avatar',
        totalAmount: 1,
        donationCount: 1,
        lastDonation: 1,
        rank: { $add: [1, { $indexOfArray: ['$totalAmount', '$totalAmount'] }] }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: leaderboard
  });
});