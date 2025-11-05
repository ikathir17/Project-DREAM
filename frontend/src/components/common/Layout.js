import React from 'react';
import Navbar from './Navbar';
import './Layout.css';

const Layout = ({ children, isAdmin = false, title }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="layout">
      <Navbar isAdmin={isAdmin} />
      <main className="layout-main">
        <div className="layout-container">
          {title && (
            <div className="page-header">
              <div>
                <h1 className="page-title">{title}</h1>
              </div>
            </div>
          )}
          {children}
        </div>
      </main>
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h3 className="footer-title">DREAM</h3>
            <p>Disaster Resilience & Emergency Assistance Module - A platform for reporting and managing disaster-related complaints efficiently.</p>
          </div>
          <div className="footer-section">
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-links">
              <li className="footer-link"><a href="/">Home</a></li>
              {isAdmin ? (
                <>
                  <li className="footer-link"><a href="/admin/complaints">Manage Complaints</a></li>
                  <li className="footer-link"><a href="/admin/urgent-complaints">Urgent Complaints</a></li>
                </>
              ) : (
                <>
                  <li className="footer-link"><a href="/user/submit-complaint">Submit Complaint</a></li>
                  <li className="footer-link"><a href="/user/complaint-status">My Complaints</a></li>
                  <li className="footer-link"><a href="/user/nearby-complaints">Nearby Complaints</a></li>
                </>
              )}
            </ul>
          </div>
          <div className="footer-section">
            <h3 className="footer-title">Contact</h3>
            <ul className="footer-links">
              <li className="footer-link">Email: support@dream-system.com</li>
              <li className="footer-link">Phone: +91 8754780152</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {currentYear} DREAM - Disaster Resilience & Emergency Assistance Module. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
