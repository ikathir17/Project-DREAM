import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom red marker for emergency locations
const emergencyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map clicks
// Helper function for reverse geocoding
const getReverseGeocode = async (lat, lng, onLocationSelect) => {
  try {
    const data = await api.reverseGeocode(lat, lng);
    const address = data.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    onLocationSelect({
      lat: lat,
      lng: lng,
      address: address
    });
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    // Fallback to coordinates
    const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    onLocationSelect({
      lat: lat,
      lng: lng,
      address: address
    });
  }
};

function LocationMarker({ position, setPosition, onLocationSelect }) {
  useMapEvents({
    click(e) {
      const newPosition = [e.latlng.lat, e.latlng.lng];
      setPosition(newPosition);
      
      // Reverse geocoding to get address using our backend proxy
      getReverseGeocode(e.latlng.lat, e.latlng.lng, onLocationSelect);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={emergencyIcon}>
      <Popup>
        <div style={{ textAlign: 'center' }}>
          <strong>🚨 Emergency Location</strong>
          <br />
          <small>Lat: {position[0].toFixed(6)}</small>
          <br />
          <small>Lng: {position[1].toFixed(6)}</small>
        </div>
      </Popup>
    </Marker>
  );
}

const LocationMap = ({ onLocationSelect, initialLocation }) => {
  const [position, setPosition] = useState(initialLocation || null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default to India center
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [locationError, setLocationError] = useState(null);

  // Get user's current location with high accuracy
  useEffect(() => {
    if (navigator.geolocation && !initialLocation) {
      setIsGettingLocation(true);
      
      // First try with high accuracy
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = [position.coords.latitude, position.coords.longitude];
          setUserLocation(userPos);
          setMapCenter(userPos);
          setPosition(userPos); // Automatically set as selected location
          setIsGettingLocation(false);
          
          // Automatically get address for current location and call onLocationSelect
          getReverseGeocode(position.coords.latitude, position.coords.longitude, onLocationSelect);
        },
        (error) => {
          console.log('High accuracy geolocation failed:', error);
          setLocationError(error.message);
          
          // Fallback to lower accuracy
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userPos = [position.coords.latitude, position.coords.longitude];
              setUserLocation(userPos);
              setMapCenter(userPos);
              setPosition(userPos);
              setIsGettingLocation(false);
              
              // Get address for fallback location
              getReverseGeocode(position.coords.latitude, position.coords.longitude, onLocationSelect);
            },
            (fallbackError) => {
              console.log('Geolocation completely failed:', fallbackError);
              setLocationError('Unable to get your location. Please select manually on the map.');
              setIsGettingLocation(false);
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
          );
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 60000 
        }
      );
    } else if (initialLocation) {
      setPosition(initialLocation);
      setMapCenter(initialLocation);
      setIsGettingLocation(false);
    } else {
      setLocationError('Geolocation is not supported by this browser.');
      setIsGettingLocation(false);
    }
  }, [initialLocation, onLocationSelect]);

  const handleCurrentLocation = () => {
    if (userLocation) {
      setPosition(userLocation);
      setMapCenter(userLocation);
      
      // Get address for current location
      getReverseGeocode(userLocation[0], userLocation[1], onLocationSelect);
    }
  };

  return (
    <div className="location-map-container">
      <div className="map-header">
        <h4>📍 Select Emergency Location</h4>
        {isGettingLocation ? (
          <div className="location-status getting-location">
            <div className="location-spinner"></div>
            <p>🔍 Getting your current location...</p>
          </div>
        ) : locationError ? (
          <div className="location-status error">
            <p>⚠️ {locationError}</p>
            <small>Please click on the map to select location manually</small>
          </div>
        ) : position ? (
          <div className="location-status success">
            <p>✅ Location detected automatically</p>
            <small>You can click on the map to change the location if needed</small>
          </div>
        ) : (
          <p>Click on the map to mark the exact location of the emergency</p>
        )}
        
        <div className="map-controls">
          <button
            type="button"
            onClick={handleCurrentLocation}
            className="current-location-btn"
            disabled={!userLocation || isGettingLocation}
          >
            {isGettingLocation ? (
              <>
                <span className="btn-spinner"></span>
                Getting Location...
              </>
            ) : (
              <>
                📍 Use My Current Location
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="map-wrapper">
        <MapContainer
          center={mapCenter}
          zoom={position ? 16 : 13}
          style={{ height: '400px', width: '100%', borderRadius: '8px' }}
          key={`${mapCenter[0]}-${mapCenter[1]}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            position={position}
            setPosition={setPosition}
            onLocationSelect={onLocationSelect}
          />
        </MapContainer>
      </div>
      
      <div className="map-instructions">
        <p><strong>Instructions:</strong></p>
        <ul>
          <li>🎯 Your current location is automatically detected and marked</li>
          <li>🖱️ Click anywhere on the map to change the emergency location</li>
          <li>📍 Use "My Current Location" button to reset to your GPS position</li>
          <li>🔍 Zoom in/out for more precise location marking</li>
          <li>📋 The address is automatically filled when you select a location</li>
        </ul>
      </div>
    </div>
  );
};

export default LocationMap;
