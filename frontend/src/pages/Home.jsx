import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Total Logins', value: '1', icon: '🔐' },
    { label: 'Account Age', value: '1 day', icon: '📅' },
    { label: 'Status', value: 'Active', icon: '✅' },
    { label: 'Last Login', value: 'Just now', icon: '🕐' }
  ];

  const recentActivities = [
    { action: 'Account created', time: 'Just now', icon: '✨' },
    { action: 'First login', time: 'Just now', icon: '🚀' },
    { action: 'Dashboard accessed', time: 'Just now', icon: '📊' }
  ];

  return (
    <div className="home-page">
      <div className="welcome-section">
        <h3>Welcome back, {user?.name}!</h3>
        <p>Here's what's happening with your account today.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="content-sections">
        <div className="section">
          <h4>Recent Activity</h4>
          <div className="activity-list">
            {recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-content">
                  <div className="activity-action">{activity.action}</div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h4>Quick Actions</h4>
          <div className="quick-actions">
            <button className="action-button">
              <span className="action-icon">📝</span>
              Update Profile
            </button>
            <button className="action-button">
              <span className="action-icon">🔒</span>
              Security Settings
            </button>
            <button className="action-button">
              <span className="action-icon">📊</span>
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
