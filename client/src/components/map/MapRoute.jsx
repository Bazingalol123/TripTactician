import { Polyline } from 'react-leaflet';

/**
 * MapRoute — dashed polyline connecting ordered activities
 * Only renders when ordered === true and there are ≥2 activities with coords
 */
export default function MapRoute({ activities, ordered }) {
  if (!ordered) return null;

  const positions = activities
    .filter((a) => a.coords?.lat && a.coords?.lng)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((a) => [a.coords.lat, a.coords.lng]);

  if (positions.length < 2) return null;

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: '#185FA5',
        weight: 2,
        opacity: 0.7,
        dashArray: '6 4',
      }}
    />
  );
}
