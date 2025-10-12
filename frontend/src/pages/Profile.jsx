import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    mobileNumber: user?.mobileNumber || '',
    email: '',
    bio: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      // Show success message
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Show error message
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      mobileNumber: user?.mobileNumber || '',
      email: '',
      bio: ''
    });
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-circle">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
        <div className="profile-info">
          <h3>{user?.name}</h3>
          <p>Member since {new Date(user?.loginTime).toLocaleDateString()}</p>
        </div>
        <button 
          className="edit-button"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h4>Personal Information</h4>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={isEditing ? 'editable' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="mobileNumber">Mobile Number</label>
              <input
                type="tel"
                id="mobileNumber"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={isEditing ? 'editable' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={isEditing ? 'editable' : ''}
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={isEditing ? 'editable' : ''}
                placeholder="Tell us about yourself"
                rows="4"
              />
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h4>Account Statistics</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Account Created</div>
              <div className="stat-value">{new Date(user?.loginTime).toLocaleDateString()}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Last Login</div>
              <div className="stat-value">Just now</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Total Sessions</div>
              <div className="stat-value">1</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Status</div>
              <div className="stat-value status-active">Active</div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="form-actions">
            <button className="save-button" onClick={handleSave}>
              Save Changes
            </button>
            <button className="cancel-button" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
