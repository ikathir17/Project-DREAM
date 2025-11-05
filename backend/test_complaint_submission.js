// Test complaint submission and classification
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = 'http://localhost:5001/api';

// You need to replace this with a valid user token
// To get a token: Login through the app and copy from localStorage or create a test user
const TEST_USER_TOKEN = 'YOUR_TOKEN_HERE';

// Test complaints
const testComplaints = [
  {
    name: "Verified Disaster",
    text: "Severe flooding in downtown area, need immediate evacuation assistance",
    type: "Flood",
    expectedResult: "VERIFIED"
  },
  {
    name: "Not Verified",
    text: "Street light not working on main road",
    type: "Infrastructure",
    expectedResult: "NOT VERIFIED"
  },
  {
    name: "Spam",
    text: "Win free money now! Click here for lottery prize!",
    type: "Other",
    expectedResult: "SPAM"
  }
];

async function testComplaintSubmission() {
  console.log('='.repeat(70));
  console.log('TESTING COMPLAINT SUBMISSION & CLASSIFICATION');
  console.log('='.repeat(70));
  
  // Connect to MongoDB to check results
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dream-complaints');
  console.log('✓ Connected to MongoDB\n');
  
  const Complaint = require('./models/Complaint');
  
  for (const test of testComplaints) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Testing: ${test.name}`);
    console.log(`Text: "${test.text}"`);
    console.log(`Expected: ${test.expectedResult}`);
    console.log('-'.repeat(70));
    
    try {
      // Submit complaint
      console.log('📤 Submitting complaint...');
      const response = await axios.post(
        `${API_URL}/complaints`,
        {
          text: test.text,
          type: test.type,
          location: JSON.stringify({
            type: "Point",
            coordinates: [77.5946, 12.9716]
          })
        },
        {
          headers: { 
            'Authorization': `Bearer ${TEST_USER_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const complaintId = response.data.data._id;
      console.log(`✓ Complaint created: ${complaintId}`);
      console.log(`\n⏳ Waiting for AI classification (10 seconds)...`);
      console.log('   (Check backend terminal for classification logs)\n');
      
      // Wait for classification to complete
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Check final status in database
      const complaint = await Complaint.findById(complaintId);
      
      console.log('📊 Final Status:');
      console.log(`   verified: ${complaint.verified}`);
      console.log(`   autoVerified: ${complaint.autoVerified}`);
      console.log(`   requiresManualVerification: ${complaint.requiresManualVerification}`);
      console.log(`   isSpam: ${complaint.isSpam}`);
      
      // Determine result
      let actualResult;
      if (complaint.isSpam) {
        actualResult = "SPAM";
      } else if (complaint.verified && !complaint.requiresManualVerification) {
        actualResult = "VERIFIED";
      } else if (!complaint.verified && complaint.autoVerified) {
        actualResult = "NOT VERIFIED (AI Rejected)";
      } else if (complaint.requiresManualVerification) {
        actualResult = "PENDING (Manual Verification Required)";
      } else {
        actualResult = "UNKNOWN";
      }
      
      console.log(`\n🎯 Result: ${actualResult}`);
      
      // Check if matches expected
      if (actualResult.includes(test.expectedResult)) {
        console.log(`✅ SUCCESS - Matches expected result!`);
      } else {
        console.log(`❌ FAILED - Expected ${test.expectedResult}, got ${actualResult}`);
      }
      
      console.log(`\n📍 Where it appears:`);
      if (complaint.isSpam) {
        console.log(`   - "Marked as Spam" tab`);
      }
      if (complaint.verified && !complaint.requiresManualVerification) {
        console.log(`   - Normal complaints list`);
        console.log(`   - Nearby complaints`);
        console.log(`   - Dashboard analytics`);
      }
      if (complaint.requiresManualVerification && !complaint.isSpam && !complaint.verified) {
        console.log(`   - "Pending Review" tab (Manual Verification)`);
      }
      if (!complaint.verified && complaint.autoVerified && !complaint.isSpam) {
        console.log(`   - "Rejected by AI" tab (Manual Verification)`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data.message}`);
      }
    }
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log('TEST COMPLETED');
  console.log('='.repeat(70));
  
  await mongoose.connection.close();
  console.log('\n✓ Database connection closed');
}

// Check if token is provided
if (TEST_USER_TOKEN === 'YOUR_TOKEN_HERE') {
  console.log('❌ ERROR: Please set TEST_USER_TOKEN in the script');
  console.log('\nTo get a token:');
  console.log('1. Login to the application');
  console.log('2. Open browser DevTools > Application > Local Storage');
  console.log('3. Copy the "token" value');
  console.log('4. Replace YOUR_TOKEN_HERE in this script\n');
  process.exit(1);
}

testComplaintSubmission().catch(console.error);
