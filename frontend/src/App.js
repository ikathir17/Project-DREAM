import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { ThemeProvider } from './contexts/ThemeContext';

// Auth Components
import Login from './components/auth/Login';

// User Components
import UserDashboard from './components/user/UserDashboard';
import ComplaintForm from './components/user/ComplaintForm';
import ComplaintStatus from './components/user/ComplaintStatus';
import NearbyComplaints from './components/user/NearbyComplaints';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import ComplaintManagement from './components/admin/ComplaintManagement';
import UrgentComplaints from './components/admin/UrgentComplaints';
import ManualVerification from './components/admin/ManualVerification';

// Private Route Component
const PrivateRoute = ({ children, isAdmin = false }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!token) {
    return <Navigate to="/" />;
  }
  
  if (isAdmin && (!user || !user.isAdmin)) {
    return <Navigate to="/user" />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        
        {/* User Routes */}
        <Route path="/user" element={
          <PrivateRoute>
            <UserDashboard />
          </PrivateRoute>
        } />
        <Route path="/user/submit-complaint" element={
          <PrivateRoute>
            <ComplaintForm />
          </PrivateRoute>
        } />
        <Route path="/user/complaint-status" element={
          <PrivateRoute>
            <ComplaintStatus />
          </PrivateRoute>
        } />
        <Route path="/user/nearby-complaints" element={
          <PrivateRoute>
            <NearbyComplaints />
          </PrivateRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <PrivateRoute isAdmin={true}>
            <AdminDashboard />
          </PrivateRoute>
        } />
        <Route path="/admin/complaints" element={
          <PrivateRoute isAdmin={true}>
            <ComplaintManagement />
          </PrivateRoute>
        } />
        <Route path="/admin/urgent-complaints" element={
          <PrivateRoute isAdmin={true}>
            <UrgentComplaints />
          </PrivateRoute>
        } />
        <Route path="/admin/manual-verification" element={
          <PrivateRoute isAdmin={true}>
            <ManualVerification />
          </PrivateRoute>
        } />
      </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
