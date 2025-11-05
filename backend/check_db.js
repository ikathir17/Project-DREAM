// Quick script to check complaint status in database
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dream-complaints')
  .then(() => console.log('✓ Connected to MongoDB'))
  .catch(err => console.error('✗ MongoDB connection error:', err));

const Complaint = require('./models/Complaint');

async function checkComplaints() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('CHECKING TEST COMPLAINTS IN DATABASE');
    console.log('='.repeat(70));

    // Test complaints
    const testTexts = [
      'Severe flooding',
      'Street light',
      'Win free money'
    ];

    for (const searchText of testTexts) {
      console.log(`\n📋 Searching for: "${searchText}"`);
      console.log('-'.repeat(70));
      
      const complaint = await Complaint.findOne({
        text: { $regex: searchText, $options: 'i' }
      }).sort({ createdAt: -1 });

      if (!complaint) {
        console.log('❌ Not found in database');
        continue;
      }

      console.log(`✓ Found: "${complaint.text.substring(0, 50)}..."`);
      console.log(`\nStatus:`);
      console.log(`  verified: ${complaint.verified}`);
      console.log(`  autoVerified: ${complaint.autoVerified}`);
      console.log(`  requiresManualVerification: ${complaint.requiresManualVerification}`);
      console.log(`  isSpam: ${complaint.isSpam}`);
      console.log(`  status: ${complaint.status}`);
      console.log(`  createdAt: ${complaint.createdAt}`);
      
      console.log(`\nWhere it appears:`);
      
      // Check where it should appear
      if (complaint.isSpam) {
        console.log(`  ✓ "Marked as Spam" tab`);
      }
      
      if (complaint.requiresManualVerification && !complaint.isSpam && !complaint.verified) {
        console.log(`  ✓ "Pending Review" tab`);
      }
      
      if (complaint.verified === false && complaint.autoVerified === true && !complaint.isSpam) {
        console.log(`  ✓ "Rejected by AI" tab`);
      }
      
      if (complaint.verified === true && complaint.requiresManualVerification === false && !complaint.isSpam) {
        console.log(`  ✓ Normal complaints list (VERIFIED)`);
        console.log(`  ✗ Should NOT be in manual verification`);
      }
      
      if (complaint.verified === false && complaint.requiresManualVerification === false && !complaint.isSpam) {
        console.log(`  ✓ "Previously Rejected" tab`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    
    const allComplaints = await Complaint.find().sort({ createdAt: -1 }).limit(10);
    console.log(`\nTotal complaints in database: ${await Complaint.countDocuments()}`);
    console.log(`\nLast 10 complaints:`);
    
    allComplaints.forEach((c, i) => {
      const status = c.verified ? '✓ VERIFIED' : 
                     c.isSpam ? '🚫 SPAM' : 
                     c.autoVerified ? '❌ AI REJECTED' : 
                     '⏳ PENDING';
      console.log(`  ${i+1}. ${status} - "${c.text.substring(0, 40)}..."`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

checkComplaints();
