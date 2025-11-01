# DREAM - Disaster Resilience & Emergency Assistance Module

A comprehensive full-stack disaster management and emergency response platform that enables efficient reporting, tracking, and management of disaster-related complaints and emergency assistance requests with intelligent ML-powered verification.

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
│   ├── middleware/    # Authentication middleware
│   ├── models/        # MongoDB schemas
│   ├── python/        # Python scripts for spam classification
│   ├── routes/        # API routes
│   ├── uploads/       # Uploaded files
│   ├── utils/         # Utility functions
│   ├── .env           # Environment variables
│   ├── package.json   # Backend dependencies
│   └── server.js      # Main server file
│
└── frontend/
    ├── public/        # Static files
    ├── src/
    │   ├── components/
    │   │   ├── admin/     # Admin components
    │   │   ├── auth/      # Authentication components
    │   │   ├── common/    # Shared components
    │   │   └── user/      # User components
    │   ├── services/      # API services
    │   ├── utils/         # Utility functions
    │   ├── App.js         # Main app component with routing
    │   └── index.js       # Entry point
    └── package.json       # Frontend dependencies
```

## License

This project is licensed under the MIT License.
