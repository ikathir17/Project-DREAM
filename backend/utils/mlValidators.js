const { PythonShell } = require('python-shell');
const path = require('path');

/**
 * Run spam classifier synchronously
 * @param {string} text - The complaint text
 * @returns {Promise<{isSpam: boolean}>}
 */
async function runSpamClassifier(text) {
  return new Promise((resolve, reject) => {
    const options = {
      mode: 'text',
      pythonPath: 'python',
      scriptPath: path.join(__dirname, '../python'),
      args: [text],
    };

    PythonShell.run('spam_classifier.py', options, (err, results) => {
      if (err) {
        console.error('❌ Spam classifier error:', err);
        // Return not spam on error to allow processing
        resolve({ isSpam: false, error: err.message });
        return;
      }

      if (results && results[0]) {
        const isSpam = results[0].trim().toLowerCase() === 'spam';
        console.log(`Spam classifier result: ${isSpam ? 'SPAM' : 'NOT SPAM'}`);
        resolve({ isSpam });
      } else {
        resolve({ isSpam: false, error: 'No result from spam classifier' });
      }
    });
  });
}

/**
 * Run disaster classifier synchronously
 * @param {string} text - The complaint text
 * @returns {Promise<{isVerified: boolean}>}
 */
async function runDisasterClassifier(text) {
  return new Promise((resolve, reject) => {
    const options = {
      mode: 'text',
      pythonPath: 'python',
      scriptPath: path.join(__dirname, '../python'),
      args: [text],
    };

    PythonShell.run('disaster_classifier.py', options, (err, results) => {
      if (err) {
        console.error('❌ Disaster classifier error:', err);
        // Return not verified on error to require manual verification
        resolve({ isVerified: false, error: err.message });
        return;
      }

      if (results && results[0]) {
        const classificationResult = results[0].trim().toLowerCase();
        const isVerified = classificationResult === 'verified';
        console.log(`Disaster classifier result: ${isVerified ? 'VERIFIED' : 'NOT VERIFIED'}`);
        resolve({ isVerified });
      } else {
        resolve({ isVerified: false, error: 'No result from disaster classifier' });
      }
    });
  });
}

module.exports = {
  runSpamClassifier,
  runDisasterClassifier
};
