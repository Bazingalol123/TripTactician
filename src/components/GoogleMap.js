import React, { useEffect, useRef } from 'react';
import './GoogleMap.css';

const GoogleMap = ({ locations }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current && window.google) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 0, lng: 0 },
        zoom: 2,
      });
    }

    if (mapInstanceRef.current && locations && locations.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      locations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const position = { lat: loc.latitude, lng: loc.longitude };
          new window.google.maps.Marker({
            position,
            map: mapInstanceRef.current,
            title: loc.name || 'Location',
          });
          bounds.extend(position);
        }
      });
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [locations]);

  return (
    <div className="google-map-container">
      <div ref={mapRef} className="google-map"></div>
    </div>
  );
};

export default GoogleMap; 