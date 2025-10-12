import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Home from '../pages/Home';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import './Dashboard.css';

const Dashboard = () => {
  const [activePage, setActivePage] = useState('home');
  const { user, logout } = useAuth();

  const pages = {
    home: { component: Home, label: 'Home', icon: '🏠' },
    profile: { component: Profile, label: 'Profile', icon: '👤' },
    settings: { component: Settings, label: 'Settings', icon: '⚙️' }
  };

  const ActiveComponent = pages[activePage].component;

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard</h1>
          <div className="user-info">
            <span className="user-name">Welcome, {user?.name}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <nav className="sidebar">
          <div className="nav-items">
            {Object.entries(pages).map(([key, page]) => (
              <button
                key={key}
                className={`nav-item ${activePage === key ? 'active' : ''}`}
                onClick={() => setActivePage(key)}
              >
                <span className="nav-icon">{page.icon}</span>
                <span className="nav-label">{page.label}</span>
              </button>
            ))}
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
