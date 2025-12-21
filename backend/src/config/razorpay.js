const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
exports.razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Verify payment signature
exports.verifyPayment = (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');
    
  return expectedSignature === razorpay_signature;
};

// Create payment order
exports.createOrder = async (amount, currency = 'INR', receipt, notes = {}) => {
  const options = {
    amount: amount * 100, // Convert to paise
    currency,
    receipt,
    notes
  };

  try {
    const order = await exports.razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    throw new Error('Failed to create payment order');
  }
};

// Fetch payment details
exports.fetchPayment = async (paymentId) => {
  try {
    const payment = await exports.razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Razorpay fetch payment error:', error);
    throw new Error('Failed to fetch payment details');
  }
};

// Create payment link
exports.createPaymentLink = async (amount, customer = {}, notes = {}) => {
  const options = {
    amount: amount * 100,
    currency: 'INR',
    accept_partial: false,
    description: 'Donation for Road Development',
    customer: {
      name: customer.name || 'Anonymous',
      email: customer.email,
      contact: customer.phone
    },
    notify: {
      sms: true,
      email: true
    },
    reminder_enable: false,
    notes,
    callback_url: `${process.env.CLIENT_URL}/donate/success`,
    callback_method: 'get'
  };

  try {
    const paymentLink = await exports.razorpay.paymentLink.create(options);
    return paymentLink;
  } catch (error) {
    console.error('Razorpay payment link creation error:', error);
    throw new Error('Failed to create payment link');
  }
};

// Refund payment
exports.createRefund = async (paymentId, amount, notes = {}) => {
  const options = {
    payment_id: paymentId,
    amount: amount * 100,
    notes
  };

  try {
    const refund = await exports.razorpay.refunds.create(options);
    return refund;
  } catch (error) {
    console.error('Razorpay refund creation error:', error);
    throw new Error('Failed to create refund');
  }
};