// Direct test of classification without API
const mongoose = require('mongoose');
const { PythonShell } = require('python-shell');
const path = require('path');
require('dotenv').config();

async function testClassification() {
  console.log('='.repeat(70));
  console.log('TESTING PYTHON CLASSIFIERS DIRECTLY');
  console.log('='.repeat(70));
  
  const testComplaints = [
    {
      name: "Verified Disaster",
      text: "Severe flooding in downtown area, need immediate evacuation assistance",
      expectedSpam: false,
      expectedVerified: true
    },
    {
      name: "Not Verified",
      text: "Street light not working on main road",
      expectedSpam: false,
      expectedVerified: false
    },
    {
      name: "Spam",
      text: "Win free money now! Click here for lottery prize!",
      expectedSpam: true,
      expectedVerified: false
    }
  ];
  
  for (const test of testComplaints) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Testing: ${test.name}`);
    console.log(`Text: "${test.text}"`);
    console.log('-'.repeat(70));
    
    // Test Spam Classifier
    console.log('\n1️⃣ SPAM CLASSIFIER:');
    const spamOptions = {
      mode: 'text',
      pythonPath: 'python',
      scriptPath: path.join(__dirname, 'python'),
      args: [test.text],
    };
    
    try {
      const spamResults = await new Promise((resolve, reject) => {
        PythonShell.run('spam_classifier.py', spamOptions, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      const isSpam = spamResults[0].trim().toLowerCase() === 'spam';
      console.log(`   Result: ${isSpam ? 'SPAM' : 'NOT SPAM'}`);
      console.log(`   Expected: ${test.expectedSpam ? 'SPAM' : 'NOT SPAM'}`);
      console.log(`   ${isSpam === test.expectedSpam ? '✅ PASS' : '❌ FAIL'}`);
      
      // Test Disaster Classifier only if not spam
      if (!isSpam) {
        console.log('\n2️⃣ DISASTER CLASSIFIER:');
        const disasterOptions = {
          mode: 'text',
          pythonPath: 'python',
          scriptPath: path.join(__dirname, 'python'),
          args: [test.text],
        };
        
        try {
          const disasterResults = await new Promise((resolve, reject) => {
            PythonShell.run('disaster_classifier.py', disasterOptions, (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });
          
          const isVerified = disasterResults[0].trim().toLowerCase() === 'verified';
          console.log(`   Result: ${isVerified ? 'VERIFIED' : 'NOT VERIFIED'}`);
          console.log(`   Expected: ${test.expectedVerified ? 'VERIFIED' : 'NOT VERIFIED'}`);
          console.log(`   ${isVerified === test.expectedVerified ? '✅ PASS' : '❌ FAIL'}`);
          
        } catch (error) {
          console.log(`   ❌ ERROR: ${error.message}`);
          console.log(`   This is the problem! Disaster classifier is failing.`);
        }
      } else {
        console.log('\n2️⃣ DISASTER CLASSIFIER: Skipped (spam detected)');
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      console.log(`   This is the problem! Spam classifier is failing.`);
    }
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log('TEST COMPLETED');
  console.log('='.repeat(70));
  console.log('\nIf you see errors above, that\'s why classification isn\'t working!');
  console.log('Common issues:');
  console.log('  - Python not in PATH');
  console.log('  - Missing Python packages (sklearn, pandas, nltk)');
  console.log('  - Model files not found');
  console.log('  - NLTK data not downloaded');
}

testClassification().catch(console.error);
