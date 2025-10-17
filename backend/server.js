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
  }
} catch (error) {
  // Fallback to native fetch
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

// Validate required environment variables
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is not set');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true
}));

// Request logging middleware (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


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


// Offline location detection function
function getOfflineLocationInfo(lat, lon) {
  // Major countries and regions with approximate boundaries
  const regions = [
    { name: 'India', bounds: { minLat: 8, maxLat: 37, minLon: 68, maxLon: 97 } },
    { name: 'United States', bounds: { minLat: 25, maxLat: 49, minLon: -125, maxLon: -66 } },
    { name: 'China', bounds: { minLat: 18, maxLat: 54, minLon: 73, maxLon: 135 } },
    { name: 'Russia', bounds: { minLat: 41, maxLat: 82, minLon: 19, maxLon: 169 } },
    { name: 'Brazil', bounds: { minLat: -34, maxLat: 5, minLon: -74, maxLon: -32 } },
    { name: 'Australia', bounds: { minLat: -44, maxLat: -10, minLon: 113, maxLon: 154 } },
    { name: 'Canada', bounds: { minLat: 42, maxLat: 84, minLon: -141, maxLon: -52 } },
    { name: 'Europe', bounds: { minLat: 35, maxLat: 71, minLon: -10, maxLon: 40 } },
    { name: 'Africa', bounds: { minLat: -35, maxLat: 37, minLon: -18, maxLon: 52 } },
    { name: 'Southeast Asia', bounds: { minLat: -11, maxLat: 28, minLon: 92, maxLon: 141 } }
  ];

  for (const region of regions) {
    const { minLat, maxLat, minLon, maxLon } = region.bounds;
    if (lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon) {
      return region.name;
    }
  }

  // Ocean/remote area detection
  if (Math.abs(lat) < 60) {
    return 'Ocean/Remote Area';
  } else if (lat > 60) {
    return 'Arctic Region';
  } else {
    return 'Antarctic Region';
  }
}

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

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      // Try Nominatim first
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Project-DREAM/1.0 (Emergency Response System)'
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Format a more readable address
      let formattedAddress = '';
      if (data.address) {
        const addr = data.address;
        const parts = [
          addr.house_number,
          addr.road,
          addr.neighbourhood || addr.suburb,
          addr.city || addr.town || addr.village,
          addr.state,
          addr.country
        ].filter(Boolean);
        formattedAddress = parts.join(', ');
      }
      
      res.json({
        success: true,
        address: formattedAddress || data.display_name || `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`,
        data: data,
        source: 'nominatim'
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Try alternative geocoding service (BigDataCloud - free tier)
      try {
        console.log('Nominatim failed, trying alternative service...');
        const altController = new AbortController();
        const altTimeoutId = setTimeout(() => altController.abort(), 3000);
        
        const altResponse = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
          {
            signal: altController.signal
          }
        );
        
        clearTimeout(altTimeoutId);
        
        if (altResponse.ok) {
          const altData = await altResponse.json();
          
          let altAddress = '';
          if (altData) {
            const parts = [
              altData.locality,
              altData.city,
              altData.principalSubdivision,
              altData.countryName
            ].filter(Boolean);
            altAddress = parts.join(', ');
          }
          
          return res.json({
            success: true,
            address: altAddress || `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`,
            data: altData,
            source: 'bigdatacloud'
          });
        }
      } catch (altError) {
        console.log('Alternative geocoding also failed:', altError.message);
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    console.error('Error type:', error.constructor.name);
    console.error('Error code:', error.code);
    
    // Enhanced fallback with approximate location description
    const { lat, lon } = req.query;
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    
    // Enhanced geographic region detection
    let region = getOfflineLocationInfo(latNum, lonNum);
    
    console.log(`Falling back to offline geocoding: ${latNum}, ${lonNum} -> ${region}`);
    
    res.json({
      success: true,
      address: `${latNum.toFixed(6)}, ${lonNum.toFixed(6)} (${region})`,
      fallback: true,
      source: 'offline',
      error: 'Geocoding services temporarily unavailable'
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
const atlasURI = process.env.MONGODB_URI;

// Connect to MongoDB with minimal logging
mongoose.connect(atlasURI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

module.exports = app;
