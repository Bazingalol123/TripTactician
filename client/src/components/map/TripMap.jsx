import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MapPin from './MapPin.jsx';
import MapRoute from './MapRoute.jsx';
import MapDetailCard from './MapDetailCard.jsx';

function FitBounds({ activities }) {
  const map = useMap();
  useEffect(() => {
    const pts = activities.filter((a) => a.coords?.lat && a.coords?.lng);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView([pts[0].coords.lat, pts[0].coords.lng], 14);
      return;
    }
    const lats = pts.map((a) => a.coords.lat);
    const lngs = pts.map((a) => a.coords.lng);
    map.fitBounds(
      [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
      { padding: [40, 40] }
    );
  }, [activities, map]);
  return null;
}

/**
 * TripMap — Leaflet map for a single day's activities
 * @param {Array}    activities        - activities for the current day
 * @param {boolean}  ordered           - show numbered pins + route polyline
 * @param {function} onPinSelect       - (activity) => void
 * @param {object}   selectedActivity  - activity whose detail card is shown
 * @param {boolean}  fullscreen
 * @param {function} onFullscreenToggle
 */
export default function TripMap({
  activities = [],
  ordered = false,
  onPinSelect,
  selectedActivity,
  fullscreen = false,
  onFullscreenToggle,
}) {
  const containerRef = useRef(null);
  const height = fullscreen ? '100vh' : '100%';

  return (
    <div ref={containerRef} style={{ position: 'relative', zIndex: 0, height, width: '100%' }}>
      <MapContainer
        center={[35.6762, 139.6503]}
        zoom={12}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />
        <FitBounds activities={activities} />

        {activities.map((activity, idx) => (
          <MapPin
            key={activity._id ?? idx}
            activity={activity}
            ordered={ordered}
            index={idx + 1}
            onSelect={onPinSelect}
          />
        ))}

        <MapRoute activities={activities} ordered={ordered} />
      </MapContainer>

      <MapDetailCard
        activity={selectedActivity}
        onClose={() => onPinSelect?.(null)}
      />

      <button
        onClick={onFullscreenToggle}
        style={{
          position: 'absolute', bottom: selectedActivity ? 180 : 16, right: 16,
          zIndex: 1001, background: '#fff', border: '1px solid #D1D5DB',
          borderRadius: 8, padding: '6px 10px', fontSize: 13, cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,.15)',
        }}
      >
        {fullscreen ? '← Back' : '⛶ Full'}
      </button>
    </div>
  );
}
