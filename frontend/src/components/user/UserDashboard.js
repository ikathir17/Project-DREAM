import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Eye, 
  MapPin, 
  Edit3, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import Layout from '../common/Layout';

const UserDashboard = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <Layout title="User Dashboard">
      <motion.div 
        className="dashboard-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Submit Complaint Card */}
        <motion.div 
          className="modern-card primary-card"
          variants={cardVariants}
          whileHover={{ 
            y: -8, 
            boxShadow: "0 20px 40px rgba(99, 102, 241, 0.2)" 
          }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="card-icon primary-icon">
            <FileText size={32} />
          </div>
          <div className="card-content">
            <h3 className="card-title">Submit a Complaint</h3>
            <p className="card-description">
              Report emergency incidents through DREAM with detailed information, location, and media attachments.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/user/submit-complaint" className="modern-btn primary-btn">
                <Edit3 size={18} />
                Submit New
              </Link>
            </motion.div>
          </div>
        </motion.div>
        
        {/* My Complaints Card */}
        <motion.div 
          className="modern-card success-card"
          variants={cardVariants}
          whileHover={{ 
            y: -8, 
            boxShadow: "0 20px 40px rgba(16, 185, 129, 0.2)" 
          }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="card-icon success-icon">
            <Eye size={32} />
          </div>
          <div className="card-content">
            <h3 className="card-title">My Complaints</h3>
            <p className="card-description">
              Track the progress of your submitted complaints and view detailed status updates.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/user/complaint-status" className="modern-btn success-btn">
                <CheckCircle size={18} />
                View Status
              </Link>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Nearby Complaints Card */}
        <motion.div 
          className="modern-card info-card"
          variants={cardVariants}
          whileHover={{ 
            y: -8, 
            boxShadow: "0 20px 40px rgba(59, 130, 246, 0.2)" 
          }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="card-icon info-icon">
            <MapPin size={32} />
          </div>
          <div className="card-content">
            <h3 className="card-title">Nearby Complaints</h3>
            <p className="card-description">
              Explore verified emergency reports from your local area through DREAM's network.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/user/nearby-complaints" className="modern-btn info-btn">
                <TrendingUp size={18} />
                Explore Area
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="how-it-works-section"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <motion.h2 
          className="section-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          How It Works
        </motion.h2>
        <motion.div 
          className="process-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="process-step" variants={cardVariants}>
            <div className="step-icon">
              <Edit3 size={40} />
            </div>
            <div className="step-number">01</div>
            <h3 className="step-title">Submit a Complaint</h3>
            <p className="step-description">
              Fill out the DREAM complaint form with comprehensive details about the emergency situation and location.
            </p>
          </motion.div>
          
          <motion.div className="process-step" variants={cardVariants}>
            <div className="step-icon">
              <CheckCircle size={40} />
            </div>
            <div className="step-number">02</div>
            <h3 className="step-title">Verification Process</h3>
            <p className="step-description">
              Our admin team reviews and verifies your complaint to ensure accuracy and legitimacy.
            </p>
          </motion.div>
          
          <motion.div className="process-step" variants={cardVariants}>
            <div className="step-icon">
              <Clock size={40} />
            </div>
            <div className="step-number">03</div>
            <h3 className="step-title">Track Resolution</h3>
            <p className="step-description">
              Monitor real-time updates as your complaint progresses through our resolution pipeline.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default UserDashboard;
