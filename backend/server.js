const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');

// Load environment variables with higher priority
const env = require('dotenv').config({ override: true });

// Force override system environment variables
if (env.parsed) {
  Object.keys(env.parsed).forEach(key => {
    process.env[key] = env.parsed[key];
  });
}

const app = express();
const PORT = process.env.PORT || 5000;

// Debug environment variables
console.log('🔧 Environment Variables:');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// Test database connection route
app.get('/api/test-db', async (req, res) => {
  try {
    const User = require('./models/User');
    
    // Create a test document to force database creation
    const testUser = new User({
      mobileNumber: '9999999999',
      name: 'Test User',
      isActive: true
    });
    
    await testUser.save();
    
    res.json({
      success: true,
      message: 'Database test successful',
      database: mongoose.connection.db.databaseName,
      collections: await mongoose.connection.db.listCollections().toArray()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Connect to MongoDB
console.log('🔗 Attempting to connect to MongoDB...');

// Use Atlas URI from environment variables
const atlasURI = process.env.MONGODB_URI;

if (!atlasURI) {
  console.error('❌ MONGODB_URI environment variable is not set');
  process.exit(1);
}

console.log('📍 Using URI:', atlasURI);

// Force Atlas connection by explicitly setting options
mongoose.connect(atlasURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4 // Use IPv4, skip trying IPv6
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
  console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
  console.log(`🌐 Host: ${mongoose.connection.host}`);
  console.log(`🔗 Port: ${mongoose.connection.port}`);
  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend URL: http://localhost:5173`);
    console.log(`🔗 Backend URL: http://localhost:${PORT}`);
  });
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

module.exports = app;
