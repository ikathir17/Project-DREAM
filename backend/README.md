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
