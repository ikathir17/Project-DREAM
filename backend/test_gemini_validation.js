require('dotenv').config();
const { validateDisasterComplaint, validateWithReasoning } = require('./utils/geminiValidator');

// Test cases
const testCases = [
  {
    type: 'flood',
    description: 'Heavy rainfall causing severe flooding in my area. Water level rising rapidly, need immediate evacuation assistance.'
  },
  {
    type: 'earthquake',
    description: 'Just experienced a major earthquake. Buildings are damaged and people are trapped.'
  },
  {
    type: 'fire',
    description: 'Large fire spreading in the residential area. Multiple houses affected.'
  },
  {
    type: 'flood',
    description: 'Hey, just testing the system. This is not a real complaint.'
  },
  {
    type: 'earthquake',
    description: 'I want to order pizza for dinner tonight.'
  }
];

async function runTests() {
  console.log('='.repeat(80));
  console.log('GEMINI DISASTER COMPLAINT VALIDATION TEST');
  console.log('='.repeat(80));
  console.log();

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`Test Case ${i + 1}:`);
    console.log(`Type: ${testCase.type}`);
    console.log(`Description: ${testCase.description}`);
    console.log('-'.repeat(80));

    try {
      // Test basic validation
      const result = await validateDisasterComplaint(testCase.type, testCase.description);
      console.log(`✓ Basic Validation Result:`);
      console.log(`  - Is Valid: ${result.isValid}`);
      console.log(`  - Confidence: ${result.confidence}`);
      console.log(`  - Raw Response: ${result.rawResponse}`);
      
      // Test detailed validation
      console.log();
      const detailedResult = await validateWithReasoning(testCase.type, testCase.description);
      console.log(`✓ Detailed Validation Result:`);
      console.log(`  - Is Valid: ${detailedResult.isValid}`);
      console.log(`  - Reasoning: ${detailedResult.reasoning}`);
      
    } catch (error) {
      console.error(`✗ Error:`, error.message);
    }

    console.log();
    console.log('='.repeat(80));
    console.log();
  }
}

// Run the tests
runTests().then(() => {
  console.log('All tests completed!');
  process.exit(0);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
