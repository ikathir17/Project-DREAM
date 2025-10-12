import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import OTPVerification from './OTPVerification';
import './Login.css';

const Login = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const { login } = useAuth();

  const validateMobileNumber = (number) => {
    // Basic mobile number validation (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(number);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!mobileNumber.trim()) {
      setError('Please enter your mobile number');
      return;
    }

    if (!validateMobileNumber(mobileNumber)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    
    // Simulate sending OTP
    setTimeout(() => {
      setIsLoading(false);
      setShowOTP(true);
    }, 1000);
  };

  const handleBackToLogin = () => {
    setShowOTP(false);
    setError('');
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 10) {
      setMobileNumber(value);
      setError('');
    }
  };

  if (showOTP) {
    return <OTPVerification mobileNumber={mobileNumber} onBack={handleBackToLogin} />;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Sign in with your mobile number</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="mobile">Mobile Number</label>
            <div className="input-wrapper">
              <span className="country-code">+91</span>
              <input
                type="tel"
                id="mobile"
                value={mobileNumber}
                onChange={handleMobileChange}
                placeholder="Enter 10-digit mobile number"
                maxLength="10"
                className={error ? 'error' : ''}
                disabled={isLoading}
              />
            </div>
            {error && <span className="error-message">{error}</span>}
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading || !mobileNumber.trim()}
          >
            {isLoading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>

        <div className="login-footer">
          <p>By signing in, you agree to our Terms of Service</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
