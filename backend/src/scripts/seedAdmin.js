const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const seedAdminAndStaff = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roadcare', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@roadcare.com', role: 'admin' });
    
    if (!existingAdmin) {
      // Create Super Admin with valid Indian phone number
      const admin = new User({
        name: 'Super Admin',
        email: 'admin@roadcare.com',
        password: 'Admin@123',
        role: 'admin',
        phone: '9876543210', // Changed to valid Indian format
        address: 'Admin Headquarters',
        city: 'Admin City',
        state: 'Admin State',
        pincode: '100001',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        isActive: true,
        emailVerified: true,
        loginCount: 0,
        preferences: {
          notifications: {
            emailNotifications: true,
            smsNotifications: true,
            pushNotifications: true,
            reportUpdates: true,
            donationUpdates: true,
            feedbackRequests: true,
            newsletter: true,
            marketingEmails: true
          },
          language: {
            language: 'en',
            region: 'IN',
            timezone: 'Asia/Kolkata',
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '12h'
          },
          theme: {
            mode: 'dark',
            fontSize: 'medium'
          }
        }
      });
      
      await admin.save();
      console.log('✅ Super Admin created:', admin.email);
    } else {
      console.log('⚠️  Admin already exists');
    }

    // Create Staff Members with valid Indian phone numbers
    const staffMembers = [
      {
        name: 'Rajesh Kumar',
        email: 'rajesh.staff@roadcare.com',
        password: 'Staff@123',
        role: 'staff',
        staffCategory: 'pothole',
        phone: '9876543210',
        address: '123 Staff Lane',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh',
        isActive: true,
        emailVerified: true
      },
      {
        name: 'Priya Sharma',
        email: 'priya.staff@roadcare.com',
        password: 'Staff@123',
        role: 'staff',
        staffCategory: 'lighting',
        phone: '9876543211',
        address: '456 Worker Street',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
        isActive: true,
        emailVerified: true
      },
      {
        name: 'Amit Patel',
        email: 'amit.staff@roadcare.com',
        password: 'Staff@123',
        role: 'staff',
        staffCategory: 'drainage',
        phone: '9876543212',
        address: '789 Service Road',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380001',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amit',
        isActive: true,
        emailVerified: true
      },
      {
        name: 'Sneha Reddy',
        email: 'sneha.staff@roadcare.com',
        password: 'Staff@123',
        role: 'staff',
        staffCategory: 'garbage',
        phone: '9876543213',
        address: '321 Clean Street',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sneha',
        isActive: true,
        emailVerified: true
      },
      {
        name: 'Vikram Singh',
        email: 'vikram.staff@roadcare.com',
        password: 'Staff@123',
        role: 'staff',
        staffCategory: 'signage',
        phone: '9876543214',
        address: '654 Signage Avenue',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vikram',
        isActive: true,
        emailVerified: true
      }
    ];

    for (const staffData of staffMembers) {
      const exists = await User.findOne({ email: staffData.email });
      if (!exists) {
        const newStaff = new User(staffData);
        await newStaff.save();
        console.log(`✅ Staff created: ${staffData.email} (${staffData.staffCategory})`);
      } else {
        console.log(`⚠️  Staff already exists: ${staffData.email}`);
      }
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('====================');
    console.log('👑 Admin:');
    console.log('  Email: admin@roadcare.com');
    console.log('  Password: Admin@123');
    console.log('\n👷 Staff Members:');
    console.log('  Email: rajesh.staff@roadcare.com (Pothole)');
    console.log('  Email: priya.staff@roadcare.com (Lighting)');
    console.log('  Email: amit.staff@roadcare.com (Drainage)');
    console.log('  Email: sneha.staff@roadcare.com (Garbage)');
    console.log('  Email: vikram.staff@roadcare.com (Signage)');
    console.log('  Password for all staff: Staff@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedAdminAndStaff();