# DREAM - Disaster Resilience & Emergency Assistance Module

A comprehensive full-stack disaster management and emergency response platform that enables efficient reporting, tracking, and management of disaster-related complaints and emergency assistance requests. DREAM leverages advanced machine learning algorithms for intelligent verification and classification of emergency reports, ensuring rapid response to genuine disaster situations.

## Overview

DREAM is designed to streamline the process of emergency reporting and management through:
- Intelligent classification of complaints using dual ML algorithms
- Real-time tracking of emergency requests
- Mobile-friendly interface with location-based features
- Automated verification system for priority handling of disaster-related complaints
- Comprehensive admin dashboard for emergency response coordination

## Features

### User Features
- Mobile OTP-based authentication
- Submit emergency assistance requests through DREAM with location, images, and audio
- Track complaint status
- View nearby verified complaints on a map

### Admin Features
- Dashboard with analytics and statistics
- Manage and verify complaints
- View urgent complaints (older than 5 hours)
- Update complaint status

## Tech Stack

### Frontend
- React.js
- React Router for navigation
- Leaflet.js for maps
- Formik & Yup for form validation
- Axios for API requests
- React-Toastify for notifications

### Backend
- Node.js with Express
- MongoDB for data storage
- JWT for authentication
- Multer for file uploads
- Python ML integration for intelligent spam and disaster classification

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Python 3.x (for ML-powered classification)

## Installation

### 1. Clone the Repository
```bash
git clone [repository-url]
cd Project-DREAM
```

### 2. Backend Setup
```bash
cd backend
npm install

# Set up Python environment
cd python
pip install -r requirements.txt
python setup.py  # This will install dependencies and train ML models
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Environment Configuration
1. Create `.env` file in the backend directory
2. Configure the following variables:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

## Usage

### Starting the Application

1. Start the backend server:
```bash
cd backend
npm run dev  # For development
# or
npm start    # For production
```

2. Start the frontend application:
```bash
cd frontend
npm start
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Key Features Guide

1. **User Interface**
   - Register/Login with mobile OTP
   - Submit complaints with location, images, and audio
   - Track complaint status
   - View nearby verified complaints on map

2. **Admin Dashboard**
   - Access at `/admin`
   - View analytics and complaint statistics
   - Manage and verify complaints
   - Handle urgent complaints (>5 hours old)

3. **ML-Powered Classification**
   - Automatic spam detection
   - Disaster-related complaint verification
   - Real-time complaint processing

## Installation

### Setting up MongoDB
1. You can either:
   - Install MongoDB locally and create a database named `d-complaints`
   - Use MongoDB Atlas (recommended):
     - Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
     - Set up a new cluster
     - Create a database named `d-complaints`
     - Get your connection string from the Atlas dashboard

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   NODE_ENV=development
   PORT=8000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.ras9gis.mongodb.net/d-complaints?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   ```
   
   Note: Replace `<username>` and `<password>` with your MongoDB Atlas credentials.

4. Start the backend server:
   ```
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the frontend directory to set the port:
   ```
   PORT=4000
   ```

4. Start the frontend development server:
   ```
   npm start
   ```

5. Access the application at http://localhost:4000

## Usage

### User Flow
1. Login with mobile number and OTP (OTP will be shown in the backend console for testing)
2. Navigate to "Submit Complaint" to report an emergency through DREAM
3. Use the map to select your location
4. Optionally upload images or audio recordings
5. Track your complaint status in "My Complaints"
6. View nearby verified complaints in "Nearby Complaints"

### Admin Flow
1. Login with an admin account (you'll need to manually set `isAdmin: true` in the MongoDB user document)
2. View analytics on the dashboard
3. Manage complaints in the "Complaints" section
4. Address urgent complaints in the "Urgent" section
5. Verify complaints and update their status

## Project Structure

```
disaster-complaint-system/
├── backend/
│   ├── config/        # Database configuration
│   ├── controllers/   # Request handlers
│   │   ├── authController.js
│   │   ├── complaintController.js
│   │   └── notificationController.js
│   ├── middleware/    # Authentication middleware
│   ├── models/        # MongoDB schemas
│   │   ├── Complaint.js
│   │   ├── Notification.js
│   │   ├── OTP.js
│   │   └── User.js
│   ├── python/        # ML classification system
│   │   ├── disaster_classifier.py
│   │   ├── spam_classifier.py
│   │   ├── train_disaster_model.py
│   │   └── models/    # Trained ML models
│   ├── routes/        # API routes
│   ├── uploads/       # Uploaded files
│   ├── utils/         # Utility functions
│   │   ├── geminiValidator.js
│   │   ├── mlValidators.js
│   │   └── notificationHelper.js
│   ├── .env          # Environment variables
│   ├── package.json  # Backend dependencies
│   └── server.js     # Main server file
│
└── frontend/
    ├── public/       # Static files
    ├── src/
    │   ├── components/
    │   │   ├── admin/    # Admin components
    │   │   │   ├── AdminDashboard.js
    │   │   │   ├── ComplaintManagement.js
    │   │   │   └── UrgentComplaints.js
    │   │   ├── auth/     # Authentication components
    │   │   ├── common/   # Shared components
    │   │   └── user/     # User components
    │   ├── contexts/   # React contexts
    │   ├── services/   # API services
    │   └── utils/      # Utility functions
    ├── package.json   # Frontend dependencies
    └── README.md     # Frontend documentation
```
    │   │   ├── common/    # Shared components
    │   │   └── user/      # User components
    │   ├── services/      # API services
    │   ├── utils/         # Utility functions
    │   ├── App.js         # Main app component with routing
    │   └── index.js       # Entry point
    └── package.json       # Frontend dependencies
```

## ML Classification System

### Architecture
- **Dual Algorithm Approach**: Uses both Random Forest and SVM for robust classification
- **Ensemble Prediction**: Combines predictions from both models for better accuracy
- **Feature Engineering**: 
  - TF-IDF vectorization
  - Disaster-specific keyword detection
  - Urgency indicators
  - Text statistics analysis

### Performance
- High accuracy in disaster-related complaint identification
- Automatic spam filtering
- Real-time classification processing
- Configurable confidence thresholds

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - OTP verification

### Complaint Endpoints
- `POST /api/complaints` - Submit new complaint
- `GET /api/complaints` - List complaints
- `GET /api/complaints/:id` - Get complaint details
- `PATCH /api/complaints/:id` - Update complaint status
- `GET /api/complaints/nearby` - Get nearby complaints

### Admin Endpoints
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/urgent` - List urgent complaints
- `POST /api/admin/verify/:id` - Verify complaint

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please:
1. Check the documentation
2. Review existing issues
3. Create a new issue with:
   - Detailed description
   - Steps to reproduce
   - Expected vs actual behavior
