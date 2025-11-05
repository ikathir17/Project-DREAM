require('dotenv').config();
const { validateDisasterComplaint } = require('./utils/geminiValidator');
const { runSpamClassifier, runDisasterClassifier } = require('./utils/mlValidators');

// Test cases
const testCases = [
  {
    name: "Valid Flood Complaint",
    type: "flood",
    text: "Severe flooding in my area, water level rising rapidly, need immediate evacuation assistance"
  },
  {
    name: "Valid Earthquake Complaint",
    type: "earthquake",
    text: "Major earthquake just hit, buildings are damaged and people are trapped, need rescue teams"
  },
  {
    name: "Invalid - Not a Disaster",
    type: "flood",
    text: "I want to order pizza for dinner tonight"
  },
  {
    name: "Ambiguous Complaint",
    type: "fire",
    text: "There is smoke in the area"
  }
];

async function testValidationFlow(testCase) {
  console.log('\n' + '='.repeat(80));
  console.log(`TEST: ${testCase.name}`);
  console.log('='.repeat(80));
  console.log(`Type: ${testCase.type}`);
  console.log(`Text: ${testCase.text}`);
  console.log('-'.repeat(80));

  try {
    // Step 1: Spam Check
    console.log('\n1️⃣ Running Spam Classifier...');
    const spamResult = await runSpamClassifier(testCase.text);
    console.log(`   Result: ${spamResult.isSpam ? 'SPAM ❌' : 'NOT SPAM ✅'}`);
    
    if (spamResult.isSpam) {
      console.log('\n🚫 FINAL DECISION: MANUAL VERIFICATION REQUIRED (Spam detected)');
      return;
    }

    // Step 2: ML Disaster Classifier
    console.log('\n2️⃣ Running ML Disaster Classifier...');
    const mlResult = await runDisasterClassifier(testCase.text);
    const mlVerified = mlResult.isVerified;
    console.log(`   Result: ${mlVerified ? 'VERIFIED ✅' : 'NOT VERIFIED ❌'}`);

    // Step 3: Gemini AI
    console.log('\n3️⃣ Running Gemini AI Validation...');
    let geminiVerified = null;
    try {
      const geminiResult = await validateDisasterComplaint(testCase.type, testCase.text);
      geminiVerified = geminiResult.isValid;
      console.log(`   Result: ${geminiVerified ? 'YES ✅' : 'NO ❌'}`);
      console.log(`   Response: "${geminiResult.confidence}"`);
    } catch (error) {
      console.log(`   Result: UNAVAILABLE ⚠️ (${error.message.substring(0, 50)}...)`);
    }

    // Step 4: Combined Decision
    console.log('\n📊 Combined Decision Logic:');
    console.log(`   ML Model: ${mlVerified ? 'VERIFIED' : 'NOT VERIFIED'}`);
    console.log(`   Gemini AI: ${geminiVerified === null ? 'UNAVAILABLE' : (geminiVerified ? 'YES' : 'NO')}`);

    let finalVerified = false;
    let requiresManual = true;
    let reason = '';

    if (geminiVerified === null) {
      // Gemini unavailable - use ML only
      if (mlVerified) {
        finalVerified = true;
        requiresManual = false;
        reason = 'Verified by ML model (Gemini unavailable)';
      } else {
        finalVerified = false;
        requiresManual = true;
        reason = 'Not verified by ML model (Gemini unavailable)';
      }
    } else if (mlVerified && geminiVerified) {
      // Both verified
      finalVerified = true;
      requiresManual = false;
      reason = 'Verified by both ML model and Gemini AI';
    } else if (!mlVerified && geminiVerified) {
      // Gemini overrides ML
      finalVerified = true;
      requiresManual = false;
      reason = 'Verified by Gemini AI (ML did not verify)';
    } else if (mlVerified && !geminiVerified) {
      // Conflict - manual review
      finalVerified = false;
      requiresManual = true;
      reason = 'ML verified but Gemini rejected - requires manual review';
    } else {
      // Both rejected
      finalVerified = false;
      requiresManual = true;
      reason = 'Not verified by both ML model and Gemini AI';
    }

    console.log('\n🎯 FINAL DECISION:');
    console.log(`   Verified: ${finalVerified ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   Manual Review: ${requiresManual ? 'REQUIRED ⚠️' : 'NOT NEEDED ✅'}`);
    console.log(`   Reason: ${reason}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(20) + 'VALIDATION FLOW TEST SUITE' + ' '.repeat(32) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  for (const testCase of testCases) {
    await testValidationFlow(testCase);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ All tests completed!');
  console.log('='.repeat(80) + '\n');
}

// Run tests
runAllTests().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
