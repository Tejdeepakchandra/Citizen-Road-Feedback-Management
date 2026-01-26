const Donation = require('../models/Donation');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendEmail } = require('../services/email.service');
const { createNotification } = require('../services/notification.service');
const { emitToRole, emitToUser, emitToAll } = require('../services/socket.service');
const notificationEmitter = require('../services/notificationEmitter.service');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create donation order
// @route   POST /api/donations/create-order
// @access  Private
exports.createDonationOrder = asyncHandler(async (req, res, next) => {
  const { amount, currency = 'INR', message, name, email, anonymous = false, cause = 'general' } = req.body;

  // Validate amount
  if (amount < 10) {
    return next(new ErrorResponse('Minimum donation amount is ₹10', 400));
  }

  // Validate required fields
  if (!name || !email) {
    return next(new ErrorResponse('Name and email are required', 400));
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
      name: anonymous ? 'Anonymous' : name,
      email,
      anonymous,
      cause,
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

// @desc    Verify donation payment (fetch from Razorpay API)
// @route   POST /api/donations/verify
// @access  Private
exports.verifyDonation = asyncHandler(async (req, res, next) => {
  console.log('=== VERIFY DONATION REQUEST ===');
  console.log('Raw req.body:', req.body);
  
  const { razorpay_payment_id, donationId } = req.body;

  console.log('Extracted fields:', {
    razorpay_payment_id,
    donationId
  });

  // Validate input
  if (!razorpay_payment_id || !donationId) {
    console.error('Missing required parameters');
    return next(new ErrorResponse(`Missing required parameters: ${!razorpay_payment_id ? 'razorpay_payment_id ' : ''}${!donationId ? 'donationId' : ''}`, 400));
  }

  try {
    // Fetch payment details from Razorpay API
    console.log('Fetching payment details from Razorpay for payment:', razorpay_payment_id);
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    console.log('Payment fetched from Razorpay:', {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency
    });

    // Check if payment is successful
    if (payment.status !== 'captured') {
      console.error('Payment status is not captured:', payment.status);
      return next(new ErrorResponse(`Payment status is ${payment.status}, expected captured`, 400));
    }

    // Find donation record
    const donation = await Donation.findById(donationId);
    if (!donation) {
      console.error('Donation not found:', donationId);
      return next(new ErrorResponse('Donation not found', 404));
    }

    // Update donation status
    donation.paymentId = razorpay_payment_id;
    donation.orderId = payment.order_id;
    donation.status = 'completed';
    donation.completedAt = new Date();
    donation.razorpayOrder = payment;
    await donation.save();

    console.log('Donation updated successfully:', {
      donationId: donation._id,
      paymentId: donation.paymentId,
      status: donation.status
    });

    // Update user stats
    await User.findByIdAndUpdate(donation.user, {
      $inc: {
        'stats.donationsMade': 1,
        'stats.totalDonated': donation.amount
      }
    });

    // Create notification for ADMINS about new donation received
    try {
      await createNotification({
        user: donation.user,
        type: 'donation_received',
        title: 'New Donation Received',
        message: `${donation.anonymous ? 'Anonymous' : donation.name} donated ₹${donation.amount}`,
        data: { donationId: donation._id, amount: donation.amount },
        recipients: ['admin']  // Only admins get this notification
      });
    } catch (notificationError) {
      console.error('❌ Admin notification creation failed:', notificationError.message);
    }

    // Create notification for CITIZEN/DONOR about successful donation
    try {
      await createNotification({
        user: donation.user,
        type: 'donation_successful',
        title: 'Donation Successful',
        message: `Thank you for your donation of ₹${donation.amount}!`,
        data: { donationId: donation._id, amount: donation.amount },
        recipients: [donation.user]  // Only the donor gets this notification
      });
    } catch (notificationError) {
      console.error('❌ Donor notification creation failed:', notificationError.message);
    }

    // Send thank you email to donor
    try {
      await sendEmail({
        to: req.user.email,
        subject: 'Thank You for Your Donation!',
        template: 'donation-thankyou',
        context: {
          name: req.user.name,
          amount: donation.amount,
          date: new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          transactionId: razorpay_payment_id,
          message: donation.message || 'Your contribution will help improve our roads',
          appUrl: process.env.CLIENT_URL || 'http://localhost:3000',
          appName: 'Smart Road Feedback',
          year: new Date().getFullYear()
        }
      });
    } catch (emailError) {
      console.error('❌ Email send failed:', emailError.message);
    }

    // Send notification to all admins
    try {
      const admins = await User.find({ role: 'admin' }).select('email name');
      for (const admin of admins) {
        await sendEmail({
          to: admin.email,
          subject: 'New Donation Received',
          template: 'admin-donation-received',
          context: {
            adminName: admin.name,
            donorName: req.user.name,
            donorEmail: req.user.email,
            amount: donation.amount,
            date: new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            message: donation.message || 'No message provided',
            totalDonated: req.user.stats.totalDonated + donation.amount,
            appUrl: process.env.CLIENT_URL || 'http://localhost:3000',
            appName: 'Smart Road Feedback',
            year: new Date().getFullYear()
          }
        });
      }
    } catch (adminEmailError) {
      console.error('❌ Admin donation notification failed:', adminEmailError);
    }

    // 📬 Emit real-time notification for donation received
    try {
      await notificationEmitter.notifyDonationReceived(donation, req.user);
      console.log('✅ Real-time donation notification emitted to admins');
    } catch (notifError) {
      console.error('❌ Real-time donation notification failed:', notifError);
    }

    // Emit real-time update to admins with full donation data
    try {
      emitToRole('admin', 'donation_received', {
        donationId: donation._id,
        userId: donation.user,
        name: donation.name,
        email: donation.email,
        amount: donation.amount,
        cause: donation.cause,
        anonymous: donation.anonymous,
        message: donation.message,
        timestamp: new Date()
      });
      console.log('✅ Socket emission to admins successful');
    } catch (socketError) {
      console.error('❌ Socket emission failed:', socketError.message);
    }

    // Emit real-time update to the user (donor) with success confirmation
    try {
      emitToUser(donation.user, 'donation_completed', {
        donationId: donation._id,
        amount: donation.amount,
        status: 'completed',
        timestamp: new Date()
      });
      console.log('✅ Donor confirmation emitted to user:', donation.user);
    } catch (socketError) {
      console.error('❌ Donor socket emission failed:', socketError.message);
    }

    // Emit real-time notification for citizen about successful donation
    try {
      emitToUser(donation.user, 'donation_notification', {
        type: 'donation_successful',
        title: 'Donation Successful',
        message: `Thank you for your donation of ₹${donation.amount}!`,
        donationId: donation._id,
        amount: donation.amount,
        timestamp: new Date()
      });
      console.log('✅ Citizen donation notification emitted to user:', donation.user);
    } catch (socketError) {
      console.error('❌ Citizen notification socket emission failed:', socketError.message);
    }

    // Emit broadcast update to all connected users (fallback)
    try {
      emitToRole('all_users', 'donation_update', {
        donationId: donation._id,
        userId: donation.user,
        amount: donation.amount,
        status: 'completed',
        timestamp: new Date()
      });
      console.log('✅ Broadcast donation update emitted to all_users room');
    } catch (socketError) {
      console.error('❌ Broadcast emission failed:', socketError.message);
    }

    res.status(200).json({
      success: true,
      data: donation,
      message: 'Donation verified successfully'
    });
  } catch (error) {
    console.error('❌ Error verifying donation:', error);
    return next(new ErrorResponse(error.message || 'Payment verification failed', 500));
  }
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
        refundDate: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        notes: notes || 'Refund processed as per request',
        appUrl: process.env.CLIENT_URL || 'http://localhost:3000',
        appName: 'Smart Road Feedback',
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

    // 📬 Emit real-time notification for refund
    try {
      const donor = await User.findById(donation.user);
      await notificationEmitter.notifyDonationRefunded(donation, donor);
      console.log('✅ Real-time refund notification emitted to donor');
    } catch (notifError) {
      console.error('❌ Real-time refund notification failed:', notifError);
    }
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