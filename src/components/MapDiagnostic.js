import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

const MapDiagnostic = () => {
  const [diagnostics, setDiagnostics] = useState({
    openStreetMapLoaded: false,
    leafletLoaded: false,
    nominatimWorking: false,
    overpassWorking: false,
    osrmWorking: false,
    error: null
  });

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const results = {
      openStreetMapLoaded: false,
      leafletLoaded: false,
      nominatimWorking: false,
      overpassWorking: false,
      osrmWorking: false,
      error: null
    };

    try {
      // Check if Leaflet is loaded
      results.leafletLoaded = window.L !== undefined;

      // Test OpenStreetMap tiles
      try {
        const osmResponse = await fetch('https://tile.openstreetmap.org/0/0/0.png');
        results.openStreetMapLoaded = osmResponse.ok;
      } catch (error) {
        console.warn('OpenStreetMap tiles test failed:', error);
      }

      // Test Nominatim geocoding service
      try {
        const nominatimResponse = await fetch(
          'https://nominatim.openstreetmap.org/search?q=New+York&format=json&limit=1'
        );
        const nominatimData = await nominatimResponse.json();
        results.nominatimWorking = nominatimData.length > 0;
      } catch (error) {
        console.warn('Nominatim test failed:', error);
      }

      // Test Overpass API for places
      try {
        const overpassResponse = await fetch(
          'https://overpass-api.de/api/interpreter',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'data=[out:json][timeout:5];(node["amenity"="restaurant"](40.7,-74.0,40.8,-73.9););out geom;'
          }
        );
        const overpassData = await overpassResponse.json();
        results.overpassWorking = overpassData.elements !== undefined;
      } catch (error) {
        console.warn('Overpass API test failed:', error);
      }

      // Test OSRM routing service
      try {
        const osrmResponse = await fetch(
          'https://router.project-osrm.org/route/v1/driving/-74.0059,40.7128;-73.9857,40.7484?overview=false&steps=false'
        );
        const osrmData = await osrmResponse.json();
        results.osrmWorking = osrmData.code === 'Ok';
      } catch (error) {
        console.warn('OSRM test failed:', error);
      }

    } catch (error) {
      results.error = `Diagnostic error: ${error.message}`;
    }

    setDiagnostics(results);
  };

  const DiagnosticItem = ({ label, status, description }) => {
    const getIcon = () => {
      if (status === true) return <CheckCircle className="w-5 h-5 text-green-500" />;
      if (status === false) return <XCircle className="w-5 h-5 text-red-500" />;
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    };

    const getStatusText = () => {
      if (status === true) return 'PASS';
      if (status === false) return 'FAIL';
      return 'UNKNOWN';
    };

    const getStatusColor = () => {
      if (status === true) return 'text-green-600';
      if (status === false) return 'text-red-600';
      return 'text-yellow-600';
    };

    return (
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center space-x-3">
          {getIcon()}
          <div>
            <div className="font-medium">{label}</div>
            {description && <div className="text-sm text-gray-500">{description}</div>}
          </div>
        </div>
        <div className={`font-semibold ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center space-x-3 mb-6">
        <Info className="w-6 h-6 text-green-500" />
        <h2 className="text-xl font-bold">🆓 FREE Maps Services Diagnostic</h2>
        <button
          onClick={runDiagnostics}
          className="ml-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Test Free Services
        </button>
      </div>

      <div className="space-y-3">
        <DiagnosticItem
          label="OpenStreetMap Tiles"
          status={diagnostics.openStreetMapLoaded}
          description="Tests if OpenStreetMap tiles are accessible (FREE map tiles)"
        />
        
        <DiagnosticItem
          label="Leaflet Library"
          status={diagnostics.leafletLoaded}
          description="Checks if Leaflet JavaScript library is loaded (FREE map renderer)"
        />
        
        <DiagnosticItem
          label="Nominatim Geocoding"
          status={diagnostics.nominatimWorking}
          description="Tests FREE geocoding service (OpenStreetMap)"
        />
        
        <DiagnosticItem
          label="Overpass Places API"
          status={diagnostics.overpassWorking}
          description="Tests FREE places search service (OpenStreetMap)"
        />
        
        <DiagnosticItem
          label="OSRM Routing"
          status={diagnostics.osrmWorking}
          description="Tests FREE routing service (real road directions)"
        />
      </div>

      {diagnostics.error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Error Details</h3>
              <p className="text-red-700">{diagnostics.error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2">🆓 FREE Services - No Setup Required!</h3>
        <div className="text-sm text-green-700 space-y-2">
          <p><strong>✅ Zero API keys needed!</strong> All services are completely free.</p>
          <p><strong>💰 Monthly cost: $0</strong> (vs $350+ for Google Maps APIs)</p>
          <p><strong>🌍 Services used:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><strong>OpenStreetMap:</strong> Free, open-source map tiles</li>
            <li><strong>Leaflet:</strong> Free, lightweight map rendering</li>
            <li><strong>Nominatim:</strong> Free geocoding (address to coordinates)</li>
            <li><strong>Overpass API:</strong> Free places search (restaurants, attractions)</li>
            <li><strong>OSRM:</strong> Free routing (real road directions)</li>
          </ul>
          <p><strong>🚀 Ready to use:</strong> Just run the app - no configuration needed!</p>
        </div>
      </div>
    </div>
  );
};

export default MapDiagnostic; 