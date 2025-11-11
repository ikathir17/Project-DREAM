import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Phone, 
  KeyRound, 
  ArrowLeft, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Lock,
  Smartphone
} from 'lucide-react';
import { authAPI } from '../../services/api';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('mobile'); // 'mobile' or 'otp'
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState(null);

  // Validation schema for mobile number
  const mobileSchema = Yup.object().shape({
    mobileNumber: Yup.string()
      .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits')
      .required('Mobile number is required')
  });

  // Validation schema for OTP
  const otpSchema = Yup.object().shape({
    otp: Yup.string()
      .matches(/^[0-9]{6}$/, 'OTP must be 6 digits')
      .required('OTP is required')
  });

  // Handle mobile number submission
  const handleMobileSubmit = async (values, { setSubmitting }) => {
    try {
      setLoading(true);
      const response = await authAPI.sendOTP(values.mobileNumber);
      
      if (response.data.success) {
        setMobileNumber(values.mobileNumber);
        setStep('otp');
        toast.success('OTP sent successfully');
        // Store OTP for development display when allowed
        if (response.data.otp) {
          setDevOtp(response.data.otp);
        }
        console.log('OTP for development:', response.data.otp);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  // Handle OTP verification
  const handleOTPSubmit = async (values, { setSubmitting }) => {
    try {
      setLoading(true);
      const response = await authAPI.verifyOTP(mobileNumber, values.otp);
      
      if (response.data.success) {
        // Save token and user data to local storage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        toast.success('Login successful');
        
        // Redirect based on user role
        if (response.data.user.isAdmin) {
          navigate('/admin');
        } else {
          navigate('/user');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="professional-login-page">
      {/* Background Elements */}
      <div className="login-background">
        <div className="bg-pattern"></div>
        <div className="bg-gradient"></div>
      </div>

      {/* Main Login Container */}
      <motion.div 
        className="professional-login-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Left Side - Branding */}
        <motion.div 
          className="login-branding"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <motion.div 
            className="brand-logo"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          >
            <Shield size={64} />
          </motion.div>
          
          <div className="brand-content">
            <h1 className="brand-title">DREAM</h1>
            <h2 className="brand-subtitle">Disaster Resilience & Emergency Assistance Module</h2>
            <p className="brand-description">
              Secure, reliable, and efficient emergency response platform for disaster management and community safety.
            </p>
            
            <div className="brand-features">
              <motion.div 
                className="feature-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <CheckCircle size={20} />
                <span>Secure Authentication</span>
              </motion.div>
              <motion.div 
                className="feature-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <Lock size={20} />
                <span>Data Protection</span>
              </motion.div>
              <motion.div 
                className="feature-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                <Smartphone size={20} />
                <span>Mobile Optimized</span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div 
          className="login-form-section"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="form-header">
            <h2 className="form-title">
              {step === 'mobile' ? 'Welcome Back' : 'Verify Your Identity'}
            </h2>
            <p className="form-subtitle">
              {step === 'mobile' 
                ? 'Enter your mobile number to access your account' 
                : 'Enter the verification code sent to your mobile'
              }
            </p>
          </div>
          
          <div className="form-content">
            <AnimatePresence mode="wait">
              {step === 'mobile' ? (
                <motion.div
                  key="mobile"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4 }}
                >
                  <Formik
                    initialValues={{ mobileNumber: '' }}
                    validationSchema={mobileSchema}
                    onSubmit={handleMobileSubmit}
                    validateOnMount
                  >
                    {({ isSubmitting, values, handleChange, handleBlur, errors, touched }) => (
                      <Form className="professional-form">
                        <div className="input-group">
                          <label htmlFor="mobileNumber" className="input-label">
                            Mobile Number
                          </label>
                          <div className="input-wrapper">
                            <div className="input-icon">
                              <Phone size={20} />
                            </div>
                            <Field
                              type="text"
                              name="mobileNumber"
                              id="mobileNumber"
                              className={`professional-input ${errors.mobileNumber && touched.mobileNumber ? 'error' : ''}`}
                              placeholder="Enter your 10-digit mobile number"
                              value={values.mobileNumber || ''}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          </div>
                          <AnimatePresence>
                            {errors.mobileNumber && touched.mobileNumber && (
                              <motion.div 
                                className="error-message"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                              >
                                <AlertCircle size={16} />
                                {errors.mobileNumber}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <motion.button
                          type="submit"
                          disabled={isSubmitting || loading}
                          className="professional-button primary"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {loading ? (
                            <>
                              <Loader2 size={20} className="animate-spin" />
                              Sending OTP...
                            </>
                          ) : (
                            <>
                              <Smartphone size={20} />
                              Send Verification Code
                            </>
                          )}
                        </motion.button>
                      </Form>
                    )}
                  </Formik>
                </motion.div>
              ) : (
                <>
                  {/* Show OTP inline for development/testing when allowed */}
                  {(process.env.REACT_APP_SHOW_OTP === 'true' || process.env.NODE_ENV !== 'production') && devOtp && (
                    <div className="dev-otp-notice">
                      <strong>OTP (dev):</strong> {devOtp}
                    </div>
                  )}
                
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <Formik
                    initialValues={{ otp: '' }}
                    validationSchema={otpSchema}
                    onSubmit={handleOTPSubmit}
                    validateOnMount
                  >
                    {({ isSubmitting, values, handleChange, handleBlur, errors, touched }) => (
                      <Form className="professional-form">
                        <motion.div 
                          className="otp-info-card"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <CheckCircle size={20} />
                          <span>Verification code sent to {mobileNumber}</span>
                        </motion.div>

                        <div className="input-group">
                          <label htmlFor="otp" className="input-label">
                            Verification Code
                          </label>
                          <div className="input-wrapper">
                            <div className="input-icon">
                              <KeyRound size={20} />
                            </div>
                            <Field
                              type="text"
                              name="otp"
                              id="otp"
                              className={`professional-input otp-input ${errors.otp && touched.otp ? 'error' : ''}`}
                              placeholder="Enter 6-digit verification code"
                              value={values.otp || ''}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              maxLength="6"
                            />
                          </div>
                          <AnimatePresence>
                            {errors.otp && touched.otp && (
                              <motion.div 
                                className="error-message"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                              >
                                <AlertCircle size={16} />
                                {errors.otp}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="button-group">
                          <motion.button
                            type="submit"
                            disabled={isSubmitting || loading}
                            className="professional-button primary"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {loading ? (
                              <>
                                <Loader2 size={20} className="animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <CheckCircle size={20} />
                                Verify & Continue
                              </>
                            )}
                          </motion.button>

                          <motion.button
                            type="button"
                            onClick={() => setStep('mobile')}
                            className="professional-button secondary"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <ArrowLeft size={20} />
                            Back to Mobile
                          </motion.button>
                        </div>
                      </Form>
                    )}
                  </Formik>
                </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Security Notice */}
          <motion.div 
            className="security-notice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <Lock size={16} />
            <span>Your data is protected with end-to-end encryption</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
