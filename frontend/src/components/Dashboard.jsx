import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Home from '../pages/Home';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import NearbyComplaints from '../pages/NearbyComplaints';
import './Dashboard.css';

const Dashboard = () => {
  const [activePage, setActivePage] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const pages = {
    home: { component: Home, label: 'Home', icon: '■' },
    nearby: { component: NearbyComplaints, label: 'Nearby Complaints', icon: '📍' },
    profile: { component: Profile, label: 'Profile', icon: '●' },
    settings: { component: Settings, label: 'Settings', icon: '◆' }
  };

  const ActiveComponent = pages[activePage].component;

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handlePageChange = (page) => {
    setActivePage(page);
    setSidebarOpen(false); // Close sidebar after navigation on mobile
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
            <h1>Dashboard</h1>
          </div>
          <div className="user-info">
            <span className="user-name">Welcome, {user?.name}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <nav className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
          <div className="sidebar-content">
            <div className="nav-items">
              {Object.entries(pages).map(([key, page]) => (
                <button
                  key={key}
                  className={`nav-item ${activePage === key ? 'active' : ''}`}
                  onClick={() => handlePageChange(key)}
                >
                  <span className="nav-icon">{page.icon}</span>
                  <span className="nav-label">{page.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <main className="main-content">
          <div className="page-header">
            <h2>{pages[activePage].label}</h2>
          </div>
          <div className="page-content">
            <ActiveComponent />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
