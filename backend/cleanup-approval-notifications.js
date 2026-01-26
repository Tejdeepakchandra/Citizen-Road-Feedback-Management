require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('./src/models/Notification');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Delete old staff task approval notifications with wrong URL
    const result = await Notification.deleteMany({ 
      title: '🎉 Task Approved',
      actionUrl: { $regex: '/staff/tasks/' }
    });
    
    console.log('✅ Cleaned up old task approval notifications:', result.deletedCount);
    
    // Show current approval notifications
    const current = await Notification.find({ 
      title: '🎉 Task Approved'
    }).limit(3);
    
    console.log('\n📋 Current task approval notifications:');
    if (current.length === 0) {
      console.log('   No notifications yet (old ones deleted)');
    } else {
      current.forEach(n => {
        console.log(`   → ${n.actionUrl}`);
      });
    }
    
    console.log('\n✅ Database cleaned. All new notifications will use correct URLs.');
    process.exit(0);
  } catch(err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
