// Temporary mock API until backend is ready
export const donationAPI = {
  createOrder: async (amount) => {
    console.log('Creating order for amount:', amount);
    return {
      data: {
        order_id: `order_${Date.now()}`,
        amount: amount * 100,
        currency: 'INR'
      }
    };
  },
  
  verifyPayment: async (paymentData) => {
    console.log('Verifying payment:', paymentData);
    return {
      data: {
        success: true,
        donationId: `donation_${Date.now()}`
      }
    };
  },
  
  getStats: async () => {
    return {
      data: {
        totalRaised: 1250000,
        totalDonors: 2450,
        monthlyGoal: 500000,
        currentMonthly: 375000,
        topDonation: 50000,
        recentDonations: 25
      }
    };
  },
  
  getDonations: async () => {
    // Generate mock donations
    const mockDonations = Array.from({ length: 50 }, (_, i) => ({
      _id: `donation_${i}`,
      name: i % 5 === 0 ? 'Anonymous Donor' : `Donor ${i + 1}`,
      email: `donor${i + 1}@example.com`,
      amount: Math.floor(Math.random() * 5000) + 100,
      message: i % 3 === 0 ? 'Great initiative! Keep up the good work.' : '',
      cause: ['general', 'pothole', 'lighting', 'greenery', 'safety'][i % 5],
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      anonymous: i % 5 === 0,
      transactionId: `txn_${Date.now()}_${i}`,
      city: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'][i % 5],
      likes: Math.floor(Math.random() * 100)
    }));
    
    return {
      data: {
        donations: mockDonations,
        total: 50,
        pages: 1
      }
    };
  }
};