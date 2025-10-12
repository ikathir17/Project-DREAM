const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');

// For Node.js versions < 18, we might need to install node-fetch
// For Node.js 18+, fetch is available globally
try {
  if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
    console.log('📦 Using node-fetch for HTTP requests');
  } else {
    console.log('📦 Using native fetch for HTTP requests');
  }
} catch (error) {
  console.log('⚠️ node-fetch not available, using native fetch');
}

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
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Present' : 'Missing');

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true
}));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Additional debug middleware to check body parsing AFTER JSON parsing
app.use((req, res, next) => {
  console.log('🔍 Body parsing check (after JSON middleware):');
  console.log('Body exists:', !!req.body);
  console.log('Body type:', typeof req.body);
  console.log('Body content:', req.body);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// Test POST endpoint
app.post('/api/test-post', (req, res) => {
  console.log('🧪 Test POST endpoint hit');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body:', req.body);
  console.log('Body keys:', req.body ? Object.keys(req.body) : 'No body');
  
  res.json({
    success: true,
    message: 'Test POST working',
    receivedBody: req.body,
    bodyKeys: req.body ? Object.keys(req.body) : [],
    contentType: req.headers['content-type']
  });
});

// Reverse geocoding proxy endpoint
app.get('/api/geocode/reverse', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Use fetch to call Nominatim API from backend
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      {
        headers: {
          'User-Agent': 'Project-DREAM/1.0 (Emergency Response System)'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    
    res.json({
      success: true,
      address: data.display_name || `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`,
      data: data
    });

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    
    // Fallback to coordinates if geocoding fails
    const { lat, lon } = req.query;
    res.json({
      success: true,
      address: `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`,
      fallback: true
    });
  }
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

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is not set');
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
