# Backend API - Dream App

A Node.js backend API for the Dream App with MongoDB integration and OTP-based authentication.

## Features

- 🔐 OTP-based authentication
- 👤 User management (create/update profiles)
- 📱 Mobile number validation
- 🗄️ MongoDB integration
- 🔒 JWT token authentication
- ⏰ OTP expiration handling
- 📊 User statistics tracking

## API Endpoints

### Authentication

#### POST `/api/auth/send-otp`
Send OTP to mobile number
```json
{
  "mobileNumber": "9876543210"
}
```

#### POST `/api/auth/verify-otp`
Verify OTP and login/register
```json
{
  "mobileNumber": "9876543210",
  "otp": "123456"
}
```

#### GET `/api/auth/profile`
Get user profile (requires JWT token)
```
Authorization: Bearer <jwt_token>
```

#### PUT `/api/auth/profile`
Update user profile (requires JWT token)
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "bio": "Software Developer"
}
```

#### POST `/api/auth/logout`
Logout user

### Complaints

#### POST `/api/complaints/submit`
Submit a new disaster complaint (requires JWT token)
```json
{
  "disasterType": "flood",
  "urgencyLevel": "critical",
  "location": "123 Main St, City, State",
  "coordinates": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "description": "Severe flooding in residential area",
  "contactNumber": "9876543210",
  "affectedPeople": 50,
  "resourcesNeeded": ["rescue", "medical", "food"],
  "customHelp": "Need boats for evacuation",
  "audioRecording": "data:audio/webm;codecs=opus;base64,GkXfo..."
}
```

#### GET `/api/complaints/my-complaints`
Get user's complaints with pagination (requires JWT token)
```
Query parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 10)
```

#### GET `/api/complaints/:complaintId`
Get complaint details by ID (requires JWT token)

#### PUT `/api/complaints/:complaintId`
Update complaint (limited fields, only for pending complaints)
```json
{
  "description": "Updated description",
  "contactNumber": "9876543210",
  "affectedPeople": 75,
  "customHelp": "Additional help needed"
}
```

#### GET `/api/complaints/:complaintId/audio`
Get audio recording for a specific complaint (requires JWT token)
Returns audio file as binary data with appropriate MIME type headers.

#### GET `/api/complaints/stats/summary`
Get complaint statistics for user (requires JWT token)

### Health Check

#### GET `/api/health`
Check server status

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

## Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with your MongoDB connection string

3. Start development server:
```bash
npm run dev
```

4. Start production server:
```bash
npm start
```

## Database Schema

### User Model
- `mobileNumber` (String, Unique, Required)
- `name` (String, Required)
- `email` (String, Optional)
- `bio` (String, Optional)
- `isActive` (Boolean, Default: true)
- `lastLogin` (Date)
- `loginCount` (Number, Default: 1)
- `createdAt` (Date)
- `updatedAt` (Date)

### OTP Model
- `mobileNumber` (String, Required)
- `otp` (String, Required, 6 digits)
- `expiresAt` (Date, 5 minutes from creation)
- `isUsed` (Boolean, Default: false)
- `attempts` (Number, Max: 3)
- `createdAt` (Date)

### Complaint Model
- `submittedBy` (ObjectId, Reference to User)
- `submitterName` (String, Required)
- `contactNumber` (String, Required, 10 digits)
- `disasterType` (String, Enum: flood, earthquake, fire, etc.)
- `urgencyLevel` (String, Enum: critical, high, medium, low)
- `location` (Object)
  - `address` (String, Required)
  - `coordinates` (Object: lat, lng)
- `description` (String, Required, Max: 2000 chars)
- `affectedPeople` (Number, Min: 0)
- `resourcesNeeded` (Array of Strings)
- `customHelp` (String, Max: 500 chars)
- `audioRecording` (Object, Optional)
  - `data` (String, Base64 encoded audio, Max: 10MB)
  - `duration` (Number, Duration in seconds)
  - `size` (Number, File size in bytes)
  - `mimeType` (String, Audio MIME type)
  - `recordedAt` (Date, Recording timestamp)
- `status` (String, Enum: pending, acknowledged, in_progress, resolved, closed)
- `priority` (Number, 1-5, Auto-assigned based on urgency)
- `assignedTo` (String, Optional)
- `responseTeam` (String, Optional)
- `estimatedResponseTime` (Date, Optional)
- `actualResponseTime` (Date, Optional)
- `notes` (Array of Objects: content, addedBy, addedAt)
- `createdAt` (Date)
- `updatedAt` (Date)
- `resolvedAt` (Date, Optional)

## Security Features

- JWT token authentication
- OTP expiration (5 minutes)
- Rate limiting on OTP attempts (max 3)
- Input validation
- CORS protection
- Environment variable protection

## Testing

Test the API endpoints using:
- Postman
- curl
- Frontend application

Example curl commands:

```bash
# Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210"}'

# Verify OTP
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210","otp":"123456"}'
```
