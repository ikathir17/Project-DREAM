require('dotenv').config();
const https = require('https');

const API_KEY = process.env.GEMINI_API_KEY;

console.log('Testing Gemini API Key...');
console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'Missing');
console.log();

// Test 1: List available models
function listModels() {
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          const models = JSON.parse(data);
          console.log('✅ API Key is valid!');
          console.log('\nAvailable models:');
          if (models.models) {
            models.models.forEach(model => {
              console.log(`  - ${model.name}`);
              if (model.supportedGenerationMethods) {
                console.log(`    Methods: ${model.supportedGenerationMethods.join(', ')}`);
              }
            });
          }
          resolve(models);
        } else {
          console.log(`❌ API request failed with status: ${res.statusCode}`);
          console.log('Response:', data);
          reject(new Error(`Status ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', (err) => {
      console.log('❌ Network error:', err.message);
      reject(err);
    });
  });
}

// Test 2: Try a simple generation
function testGeneration(modelName) {
  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${API_KEY}`;
    
    const postData = JSON.stringify({
      contents: [{
        parts: [{
          text: 'Say hello in one word'
        }]
      }]
    });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(data);
          console.log(`\n✅ Generation test successful with ${modelName}!`);
          if (result.candidates && result.candidates[0]) {
            const text = result.candidates[0].content.parts[0].text;
            console.log(`Response: ${text}`);
          }
          resolve(result);
        } else {
          console.log(`\n❌ Generation failed with ${modelName}`);
          console.log(`Status: ${res.statusCode}`);
          console.log('Response:', data);
          reject(new Error(data));
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Request error:', err.message);
      reject(err);
    });
    
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  try {
    // First, list available models
    const models = await listModels();
    
    // Then try to generate with the first available model that supports generateContent
    if (models.models && models.models.length > 0) {
      const generativeModel = models.models.find(m => 
        m.supportedGenerationMethods && 
        m.supportedGenerationMethods.includes('generateContent')
      );
      
      if (generativeModel) {
        console.log(`\nTesting generation with: ${generativeModel.name}`);
        await testGeneration(generativeModel.name);
      }
    }
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

runTests();
