/**
 * Generate a random OTP of specified length
 * @param {number} length - Length of the OTP
 * @returns {string} - Generated OTP
 */
const generateOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

module.exports = generateOTP;
