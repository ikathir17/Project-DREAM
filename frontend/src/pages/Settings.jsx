import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      profileVisibility: 'public',
      showOnlineStatus: true,
      allowMessages: true
    },
    security: {
      twoFactor: false,
      loginAlerts: true,
      sessionTimeout: '30'
    },
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC'
    }
  });

  const handleToggle = (category, setting) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting]
      }
    }));
  };

  const handleSelect = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleSave = () => {
    // Here you would typically save to a backend
    console.log('Saving settings:', settings);
    // Show success message
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h3>Settings</h3>
        <p>Manage your account preferences and security settings</p>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h4>Notifications</h4>
          <div className="settings-group">
            <div className="setting-item">
              <div className="setting-info">
                <label>Email Notifications</label>
                <p>Receive updates via email</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={() => handleToggle('notifications', 'email')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Push Notifications</label>
                <p>Receive push notifications in browser</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.notifications.push}
                  onChange={() => handleToggle('notifications', 'push')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>SMS Notifications</label>
                <p>Receive updates via SMS to {user?.mobileNumber}</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.notifications.sms}
                  onChange={() => handleToggle('notifications', 'sms')}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h4>Privacy</h4>
          <div className="settings-group">
            <div className="setting-item">
              <div className="setting-info">
                <label>Profile Visibility</label>
                <p>Who can see your profile</p>
              </div>
              <select
                value={settings.privacy.profileVisibility}
                onChange={(e) => handleSelect('privacy', 'profileVisibility', e.target.value)}
                className="setting-select"
              >
                <option value="public">Public</option>
                <option value="friends">Friends Only</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Show Online Status</label>
                <p>Let others see when you're online</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.privacy.showOnlineStatus}
                  onChange={() => handleToggle('privacy', 'showOnlineStatus')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Allow Messages</label>
                <p>Let others send you messages</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.privacy.allowMessages}
                  onChange={() => handleToggle('privacy', 'allowMessages')}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h4>Security</h4>
          <div className="settings-group">
            <div className="setting-item">
              <div className="setting-info">
                <label>Two-Factor Authentication</label>
                <p>Add an extra layer of security</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.security.twoFactor}
                  onChange={() => handleToggle('security', 'twoFactor')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Login Alerts</label>
                <p>Get notified of new login attempts</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.security.loginAlerts}
                  onChange={() => handleToggle('security', 'loginAlerts')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Session Timeout</label>
                <p>Automatically log out after inactivity</p>
              </div>
              <select
                value={settings.security.sessionTimeout}
                onChange={(e) => handleSelect('security', 'sessionTimeout', e.target.value)}
                className="setting-select"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="240">4 hours</option>
                <option value="0">Never</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h4>Preferences</h4>
          <div className="settings-group">
            <div className="setting-item">
              <div className="setting-info">
                <label>Theme</label>
                <p>Choose your preferred theme</p>
              </div>
              <select
                value={settings.preferences.theme}
                onChange={(e) => handleSelect('preferences', 'theme', e.target.value)}
                className="setting-select"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Language</label>
                <p>Select your preferred language</p>
              </div>
              <select
                value={settings.preferences.language}
                onChange={(e) => handleSelect('preferences', 'language', e.target.value)}
                className="setting-select"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Timezone</label>
                <p>Set your local timezone</p>
              </div>
              <select
                value={settings.preferences.timezone}
                onChange={(e) => handleSelect('preferences', 'timezone', e.target.value)}
                className="setting-select"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button className="save-button" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
