import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Box, Typography, TextField, IconButton, useTheme } from '@mui/material';
import { Search, MyLocation } from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet - Using imports instead of require()
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const LocationMarker = ({ position, onPositionChange }) => {
  const map = useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
    locationfound(e) {
      onPositionChange(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    map.locate();
  }, [map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Selected Location</Popup>
    </Marker>
  );
};

const MapPicker = ({ onLocationSelect, initialLocation = null }) => {
  const [position, setPosition] = useState(initialLocation?.coordinates || null);
  const [searchQuery, setSearchQuery] = useState(initialLocation?.address || '');
  const [map, setMap] = useState(null);
  const theme = useTheme();

  const defaultCenter = [20.5937, 78.9629]; // India coordinates
  const defaultZoom = 5;

  const handlePositionChange = (newPosition) => {
    setPosition(newPosition);
    
    // Reverse geocode to get address
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPosition.lat}&lon=${newPosition.lng}`)
      .then(response => response.json())
      .then(data => {
        const address = data.display_name;
        setSearchQuery(address);
        onLocationSelect({
          address,
          coordinates: newPosition,
        });
      })
      .catch(error => {
        console.error('Reverse geocoding failed:', error);
        onLocationSelect({
          address: '',
          coordinates: newPosition,
        });
      });
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          const result = data[0];
          const newPosition = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
          setPosition(newPosition);
          
          if (map) {
            map.flyTo(newPosition, 15);
          }

          onLocationSelect({
            address: result.display_name,
            coordinates: newPosition,
          });
        }
      })
      .catch(error => {
        console.error('Geocoding failed:', error);
      });
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (geoPosition) => {
          const newPosition = {
            lat: geoPosition.coords.latitude,
            lng: geoPosition.coords.longitude,
          };
          setPosition(newPosition);
          
          if (map) {
            map.flyTo(newPosition, 15);
          }

          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPosition.lat}&lon=${newPosition.lng}`)
            .then(response => response.json())
            .then(data => {
              setSearchQuery(data.display_name);
              onLocationSelect({
                address: data.display_name,
                coordinates: newPosition,
              });
            });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      {/* Search Bar */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          right: 10,
          zIndex: 1000,
          display: 'flex',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search for a location or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            sx: {
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
            },
            endAdornment: (
              <IconButton size="small" onClick={handleSearch}>
                <Search />
              </IconButton>
            ),
          }}
        />
        <IconButton
          onClick={handleCurrentLocation}
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: 2,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <MyLocation />
        </IconButton>
      </Box>

      {/* Map Container */}
      <MapContainer
        center={position || defaultCenter}
        zoom={position ? 15 : defaultZoom}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        whenCreated={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} onPositionChange={handlePositionChange} />
      </MapContainer>

      {/* Instructions */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          right: 10,
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          p: 1.5,
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Click on the map to select a location, or search for an address
        </Typography>
      </Box>

      {/* Coordinates Display */}
      {position && (
        <Box
          sx={{
            position: 'absolute',
            top: 60,
            right: 10,
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            p: 1.5,
            borderRadius: 2,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MapPicker;