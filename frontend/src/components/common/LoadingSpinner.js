import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  text = '', 
  fullScreen = false,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  };

  const colorClasses = {
    primary: 'spinner-primary',
    success: 'spinner-success',
    info: 'spinner-info',
    warning: 'spinner-warning',
    danger: 'spinner-danger',
    white: 'spinner-white'
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  const SpinnerContent = () => (
    <motion.div 
      className={`loading-spinner-container ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="spinner-icon"
        variants={spinnerVariants}
        animate="animate"
      >
        <Loader2 />
      </motion.div>
      {text && (
        <motion.p 
          className="spinner-text"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <motion.div 
        className="loading-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <SpinnerContent />
      </motion.div>
    );
  }

  return <SpinnerContent />;
};

export default LoadingSpinner;
