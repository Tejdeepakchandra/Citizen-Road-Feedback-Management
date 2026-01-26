require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('./src/models/Notification');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Delete old staff task notifications with wrong URL
    const result = await Notification.deleteMany({ 
      title: '🎯 New Task Assigned',
      actionUrl: { $regex: '/staff/tasks/' }
    });
    
    console.log('✅ Cleaned up old notifications:', result.deletedCount);
    
    // Show current staff notifications
    const current = await Notification.find({ 
      title: '🎯 New Task Assigned'
    }).limit(5);
    
    console.log('\n📋 Current staff notifications:');
    if (current.length === 0) {
      console.log('   No notifications yet (old ones deleted)');
    } else {
      current.forEach(n => {
        console.log(`   → ${n.actionUrl}`);
      });
    }
    
    console.log('\n✅ Database cleaned. New notifications will use correct URL.');
    process.exit(0);
  } catch(err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
