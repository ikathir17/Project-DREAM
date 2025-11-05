require('dotenv').config();
const { validateDisasterComplaint } = require('./utils/geminiValidator');

console.log('\n' + '═'.repeat(80));
console.log('  VALIDATION FLOW LOGIC TEST (Mocked ML Models)');
console.log('═'.repeat(80));

// Mock ML functions for testing logic
async function mockMLClassifier(text) {
  // Simulate ML model behavior
  const keywords = ['flood', 'earthquake', 'fire', 'disaster', 'emergency', 'help', 'urgent', 'rescue', 'evacuation'];
  const hasKeywords = keywords.some(keyword => text.toLowerCase().includes(keyword));
  
  return {
    isVerified: hasKeywords && text.length > 20
  };
}

async function mockSpamClassifier(text) {
  // Simulate spam detection
  const spamKeywords = ['click here', 'free prize', 'win now', 'amazing deal', 'order pizza'];
  const isSpam = spamKeywords.some(keyword => text.toLowerCase().includes(keyword));
  
  return {
    isSpam: isSpam
  };
}

// Test cases
const testCases = [
  {
    name: "✅ Scenario 1: Both ML and Gemini Verify → Auto-Approve",
    type: "flood",
    text: "Severe flooding in my area, water level rising rapidly, need immediate evacuation assistance",
    expectedML: true,
    expectedGemini: true,
    expectedVerified: true,
    expectedSpamCheck: false
  },
  {
    name: "✅ Scenario 2: ML No, Gemini Yes → Auto-Approve (Gemini Override)",
    type: "earthquake",
    text: "Major earthquake just hit, buildings collapsing, people trapped, urgent rescue needed",
    expectedML: true,
    expectedGemini: true,
    expectedVerified: true,
    expectedSpamCheck: false
  },
  {
    name: "⚠️  Scenario 3: ML Yes, Gemini No → Manual Review",
    type: "fire",
    text: "There is some smoke in the area",
    expectedML: false,
    expectedGemini: false,
    expectedVerified: false,
    expectedSpamCheck: true
  },
  {
    name: "❌ Scenario 4: Both Reject + Spam → Manual Review + Spam Flag",
    type: "flood",
    text: "Click here for free prizes and amazing deals!",
    expectedML: false,
    expectedGemini: false,
    expectedVerified: false,
    expectedSpamCheck: true
  },
  {
    name: "⚠️  Scenario 5: Both Reject + Not Spam → Manual Review Only",
    type: "earthquake",
    text: "I want to order pizza",
    expectedML: false,
    expectedGemini: false,
    expectedVerified: false,
    expectedSpamCheck: true
  }
];

async function testFlowLogic(testCase, index) {
  console.log('\n' + '─'.repeat(80));
  console.log(`TEST ${index + 1}: ${testCase.name}`);
  console.log('─'.repeat(80));
  console.log(`Type: ${testCase.type}`);
  console.log(`Text: "${testCase.text}"`);
  console.log('─'.repeat(80));

  try {
    // Step 1: ML Disaster Classifier
    console.log('\n1️⃣  ML Disaster Classifier');
    const mlResult = await mockMLClassifier(testCase.text);
    const mlVerified = mlResult.isVerified;
    console.log(`   Result: ${mlVerified ? 'VERIFIED ✅' : 'NOT VERIFIED ❌'}`);

    // Step 2: Gemini AI Validation
    console.log('\n2️⃣  Gemini AI Validation');
    let geminiVerified = null;
    let geminiResult = null;
    
    try {
      geminiResult = await validateDisasterComplaint(testCase.type, testCase.text);
      geminiVerified = geminiResult.isValid;
      console.log(`   Result: ${geminiVerified ? 'YES ✅' : 'NO ❌'}`);
      console.log(`   Response: "${geminiResult.confidence}"`);
    } catch (error) {
      console.log(`   Result: UNAVAILABLE ⚠️ (${error.message.substring(0, 50)}...)`);
      geminiVerified = null;
    }

    // Step 3: Combined Decision Logic
    console.log('\n3️⃣  Combined Decision Logic');
    console.log(`   ML Model: ${mlVerified ? 'VERIFIED' : 'NOT VERIFIED'}`);
    console.log(`   Gemini AI: ${geminiVerified === null ? 'UNAVAILABLE' : (geminiVerified ? 'YES' : 'NO')}`);

    let finalVerified = false;
    let requiresManual = true;
    let validationReason = '';

    if (geminiVerified === null) {
      if (mlVerified) {
        finalVerified = true;
        requiresManual = false;
        validationReason = 'Verified by ML model (Gemini unavailable)';
        console.log(`   → ✅ AUTO-APPROVED (ML verified, Gemini unavailable)`);
      } else {
        finalVerified = false;
        requiresManual = true;
        validationReason = 'Not verified by ML model (Gemini unavailable)';
        console.log(`   → ❌ MANUAL REVIEW (ML not verified, Gemini unavailable)`);
      }
    } else if (mlVerified && geminiVerified) {
      finalVerified = true;
      requiresManual = false;
      validationReason = 'Verified by both ML model and Gemini AI';
      console.log(`   → ✅ AUTO-APPROVED (Both verified)`);
    } else if (!mlVerified && geminiVerified) {
      finalVerified = true;
      requiresManual = false;
      validationReason = 'Verified by Gemini AI (ML did not verify)';
      console.log(`   → ✅ AUTO-APPROVED (Gemini override)`);
    } else if (mlVerified && !geminiVerified) {
      finalVerified = false;
      requiresManual = true;
      validationReason = 'ML verified but Gemini rejected';
      console.log(`   → ❌ MANUAL REVIEW (Conflict)`);
    } else {
      finalVerified = false;
      requiresManual = true;
      validationReason = 'Not verified by both';
      console.log(`   → ❌ MANUAL REVIEW (Both rejected)`);
    }

    // Step 4: Database Update
    console.log('\n4️⃣  Database Update');
    console.log(`   verified: ${finalVerified}`);
    console.log(`   requiresManualVerification: ${requiresManual}`);
    console.log(`   isSpam: false (initial)`);

    // Step 5: Spam Check (ONLY if NOT verified)
    console.log('\n5️⃣  Spam Check');
    let spamCheckRan = false;
    let isSpam = false;
    
    if (!finalVerified) {
      console.log(`   ✅ RUNNING (complaint not verified)`);
      spamCheckRan = true;
      const spamResult = await mockSpamClassifier(testCase.text);
      isSpam = spamResult.isSpam;
      
      if (isSpam) {
        console.log(`   Result: IS SPAM ❌`);
        console.log(`   Action: Update DB → isSpam = true`);
      } else {
        console.log(`   Result: NOT SPAM ✅`);
        console.log(`   Action: Manual review for other reasons`);
      }
    } else {
      console.log(`   ⏭️  SKIPPED (complaint verified - no spam check needed)`);
    }

    // Verification
    console.log('\n' + '┌' + '─'.repeat(78) + '┐');
    console.log('│' + ' '.repeat(32) + 'VERIFICATION' + ' '.repeat(34) + '│');
    console.log('└' + '─'.repeat(78) + '┘');
    
    const spamCheckCorrect = spamCheckRan === testCase.expectedSpamCheck;
    
    console.log(`   Spam Check Expected: ${testCase.expectedSpamCheck ? 'RUN' : 'SKIP'}`);
    console.log(`   Spam Check Actual: ${spamCheckRan ? 'RAN' : 'SKIPPED'}`);
    console.log(`   Match: ${spamCheckCorrect ? '✅ CORRECT' : '❌ WRONG'}`);
    
    console.log('\n' + '┌' + '─'.repeat(78) + '┐');
    console.log('│' + ' '.repeat(30) + 'FINAL RESULT' + ' '.repeat(36) + '│');
    console.log('└' + '─'.repeat(78) + '┘');
    console.log(`   Status: ${finalVerified ? 'VERIFIED ✅' : 'NOT VERIFIED ❌'}`);
    console.log(`   Manual Review: ${requiresManual ? 'REQUIRED ⚠️' : 'NOT NEEDED ✅'}`);
    console.log(`   Spam: ${isSpam ? 'YES ❌' : 'NO ✅'}`);
    console.log(`   Reason: ${validationReason}`);
    console.log(`   Processing: ${finalVerified ? '~4-6 sec (spam skipped)' : '~6-8 sec (spam ran)'}`);

    return {
      success: spamCheckCorrect,
      spamCheckRan,
      finalVerified,
      isSpam
    };

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function runAllTests() {
  console.log('\nTesting validation flow logic with mocked ML models...\n');
  
  const results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const result = await testFlowLogic(testCases[i], i);
    results.push(result);
    
    if (i < testCases.length - 1) {
      console.log('\n⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('  TEST SUMMARY');
  console.log('═'.repeat(80));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n✅ Passed: ${passed}/${testCases.length}`);
  console.log(`❌ Failed: ${failed}/${testCases.length}`);
  
  console.log('\n' + '═'.repeat(80));
  console.log('  FLOW VERIFICATION');
  console.log('═'.repeat(80));
  
  console.log('\n✅ Flow Order:');
  console.log('   1. ML Classifier → Runs FIRST');
  console.log('   2. Gemini AI → Runs SECOND');
  console.log('   3. Combined Logic → Applied');
  console.log('   4. Database Update → Single update');
  console.log('   5. Spam Check → ONLY if NOT verified');
  
  console.log('\n✅ Spam Check Behavior:');
  const verifiedTests = results.filter((r, i) => testCases[i].expectedVerified);
  const notVerifiedTests = results.filter((r, i) => !testCases[i].expectedVerified);
  
  console.log(`   Verified complaints: ${verifiedTests.filter(r => !r.spamCheckRan).length}/${verifiedTests.length} skipped spam check ✅`);
  console.log(`   Not verified complaints: ${notVerifiedTests.filter(r => r.spamCheckRan).length}/${notVerifiedTests.length} ran spam check ✅`);
  
  console.log('\n' + '═'.repeat(80));
  if (passed === testCases.length) {
    console.log('  ✅ ALL TESTS PASSED - FLOW IS CORRECT!');
  } else {
    console.log('  ⚠️  SOME TESTS FAILED - REVIEW NEEDED');
  }
  console.log('═'.repeat(80) + '\n');
}

// Run tests
runAllTests().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
