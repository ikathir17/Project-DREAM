import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
      // Verify token is still valid by fetching profile
      verifyToken(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await api.getProfile(tokenToVerify);
      if (response.success) {
        setUser(response.data.user);
        setToken(tokenToVerify);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', tokenToVerify);
      } else {
        // Token is invalid, clear storage
        clearAuth();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const sendOTP = async (mobileNumber) => {
    try {
      const response = await api.sendOTP(mobileNumber);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to send OTP');
    }
  };

  const verifyOTP = async (mobileNumber, otp) => {
    try {
      const response = await api.verifyOTP(mobileNumber, otp);
      if (response.success) {
        setUser(response.data.user);
        setToken(response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
        return response.data;
      } else {
        throw new Error(response.message || 'OTP verification failed');
      }
    } catch (error) {
      throw new Error(error.message || 'OTP verification failed');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.updateProfile(token, profileData);
      if (response.success) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      throw new Error(error.message || 'Profile update failed');
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await api.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  };

  const value = {
    user,
    token,
    sendOTP,
    verifyOTP,
    updateProfile,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
