import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default map pins in Vite + React
// We'll create a custom "Emergency Vehicle" icon using a simple div
const emergencyIcon = new L.divIcon({
  className: 'custom-icon',
  html: `<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px #ef4444; animation: pulse 2s infinite;"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function LiveMap() {
  // Coordinates for a cool "city center" (San Francisco used here as a placeholder)
  const mapCenter = [37.7749, -122.4194]; 
  const vehicleLocation = [37.7760, -122.4180]; // Slightly offset from center

  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <MapContainer 
        center={mapCenter} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false} // Hides default zoom to keep it looking like a dashboard
      >
        {/* Dark Mode Map Tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* The "Active Emergency" Marker */}
        <Marker position={vehicleLocation} icon={emergencyIcon}>
          <Popup className="custom-popup">
            <div className="text-gray-900 font-sans">
              <strong>🚑 Ambulance Unit 7</strong><br/>
              Status: <span className="text-red-600 font-bold">Code 3 (Preempting)</span><br/>
              ETA to Hospital: 4 mins
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}