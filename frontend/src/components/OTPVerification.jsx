import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './OTPVerification.css';

const OTPVerification = ({ mobileNumber, onBack }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [currentOTP, setCurrentOTP] = useState('');
  const { login } = useAuth();
  
  const inputRefs = useRef([]);

  // Generate a random 6-digit OTP for testing
  const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentOTP(otp);
    return otp;
  };

  const generatedOTP = currentOTP || generateOTP();

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      setError('');
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    if (otpString !== generatedOTP) {
      setError('Invalid OTP. Please check and try again.');
      return;
    }

    setIsLoading(true);
    
    try {
      await login(mobileNumber);
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setTimeLeft(300); // Reset to 5 minutes
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    setError('');
    // Generate new OTP
    generateOTP();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="otp-container">
      <div className="otp-card">
        <div className="otp-header">
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
          <h1>Verify Your Number</h1>
          <p>We've sent a 6-digit code to</p>
          <p className="mobile-display">+91 {mobileNumber}</p>
        </div>

        {/* Display OTP for testing */}
        <div className="otp-display">
          <p className="otp-label">For testing purposes (valid for {formatTime(timeLeft)}):</p>
          <div className="otp-code">{generatedOTP}</div>
          <p className="otp-note">This OTP will be valid until the timer expires</p>
        </div>
        
        <form onSubmit={handleSubmit} className="otp-form">
          <div className="otp-input-group">
            <label htmlFor="otp">Enter OTP</label>
            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`otp-input ${error ? 'error' : ''}`}
                  disabled={isLoading}
                />
              ))}
            </div>
            {error && <span className="error-message">{error}</span>}
          </div>

          <button 
            type="submit" 
            className="verify-button"
            disabled={isLoading || otp.join('').length !== 6}
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className="otp-footer">
          <p>Didn't receive the code?</p>
          {canResend ? (
            <button className="resend-button" onClick={handleResend}>
              Resend OTP
            </button>
          ) : (
            <div className="timer-container">
              <p className="timer">Resend in {formatTime(timeLeft)}</p>
              <p className="timer-note">OTP expires in {formatTime(timeLeft)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
