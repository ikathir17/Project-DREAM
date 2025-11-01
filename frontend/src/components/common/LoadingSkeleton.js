import React from 'react';
import { motion } from 'framer-motion';
import './LoadingSkeleton.css';

const LoadingSkeleton = ({ 
  variant = 'card', 
  count = 1, 
  height = 'auto',
  width = '100%',
  className = '' 
}) => {
  const skeletonVariants = {
    loading: {
      opacity: [0.6, 1, 0.6],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const renderCardSkeleton = () => (
    <motion.div 
      className={`skeleton-card ${className}`}
      variants={skeletonVariants}
      animate="loading"
      style={{ height, width }}
    >
      <div className="skeleton-header">
        <div className="skeleton-icon"></div>
        <div className="skeleton-content">
          <div className="skeleton-title"></div>
          <div className="skeleton-subtitle"></div>
        </div>
      </div>
      <div className="skeleton-body">
        <div className="skeleton-line"></div>
        <div className="skeleton-line short"></div>
        <div className="skeleton-line medium"></div>
      </div>
      <div className="skeleton-footer">
        <div className="skeleton-button"></div>
      </div>
    </motion.div>
  );

  const renderLineSkeleton = () => (
    <motion.div 
      className={`skeleton-line-container ${className}`}
      variants={skeletonVariants}
      animate="loading"
      style={{ height, width }}
    >
      <div className="skeleton-line"></div>
    </motion.div>
  );

  const renderCircleSkeleton = () => (
    <motion.div 
      className={`skeleton-circle ${className}`}
      variants={skeletonVariants}
      animate="loading"
      style={{ width: height || '40px', height: height || '40px' }}
    />
  );

  const renderTableSkeleton = () => (
    <motion.div 
      className={`skeleton-table ${className}`}
      variants={skeletonVariants}
      animate="loading"
      style={{ height, width }}
    >
      <div className="skeleton-table-header">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton-table-cell header"></div>
        ))}
      </div>
      {[...Array(5)].map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {[...Array(4)].map((_, cellIndex) => (
            <div key={cellIndex} className="skeleton-table-cell"></div>
          ))}
        </div>
      ))}
    </motion.div>
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return renderCardSkeleton();
      case 'line':
        return renderLineSkeleton();
      case 'circle':
        return renderCircleSkeleton();
      case 'table':
        return renderTableSkeleton();
      default:
        return renderCardSkeleton();
    }
  };

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <React.Fragment key={index}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </>
  );
};

export default LoadingSkeleton;
