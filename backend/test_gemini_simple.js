require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testSimple() {
  console.log('Testing Gemini API with simple prompt...');
  console.log('API Key:', process.env.GEMINI_API_KEY ? 'Found' : 'Missing');
  console.log();

  // Try different model names
  const modelsToTry = [
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-pro',
    'models/gemini-1.5-pro',
    'models/gemini-1.5-flash',
    'models/gemini-pro'
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say hello');
      const response = await result.response;
      const text = response.text();
      console.log(`✅ SUCCESS with ${modelName}`);
      console.log(`Response: ${text}`);
      console.log();
      break; // Stop after first success
    } catch (error) {
      console.log(`❌ Failed with ${modelName}: ${error.message}`);
      console.log();
    }
  }
}

testSimple().then(() => {
  console.log('Test completed!');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
