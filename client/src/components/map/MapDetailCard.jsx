/**
 * MapDetailCard — slides up from map bottom when a pin is tapped
 */
export default function MapDetailCard({ activity, onClose, onBook }) {
  if (!activity) return null;

  const isConflict = activity.conflict?.flagged && !activity.conflict.overridden;
  const bg = isConflict ? '#FFFAFA' : '#FFFFFF';
  const topBorder = isConflict ? '2px solid #F09595' : '1px solid #E5E7EB';

  const getDirectionsUrl = () => {
    const { lat, lng } = activity.coords ?? {};
    if (!lat || !lng) return '#';
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return isIOS
      ? `maps://maps.apple.com/?daddr=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: bg, borderTop: topBorder, borderRadius: '12px 12px 0 0',
      padding: '16px', boxShadow: '0 -2px 12px rgba(0,0,0,.12)',
    }}>
      <div style={{ width: 36, height: 4, background: '#D1D5DB', borderRadius: 2, margin: '0 auto 12px' }} />

      {isConflict && (
        <div style={{ background: '#FCEBEB', border: '1px solid #F09595', borderRadius: 6, padding: '6px 10px', marginBottom: 10, fontSize: 12, color: '#A32D2D' }}>
          ⚠ {activity.conflict.reason}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        {activity.photos?.[0] && (
          <img
            src={activity.photos[0]}
            alt={activity.name}
            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
          />
        )}
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{activity.name}</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>
            {activity.category}
            {activity.priceLevel != null && ` · ${'$'.repeat(activity.priceLevel)}`}
            {activity.rating && ` · ${activity.rating}★`}
          </div>
        </div>
        <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6B7280' }}>✕</button>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <a
          href={getDirectionsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          style={{ flex: 1, padding: '9px 0', textAlign: 'center', background: '#185FA5', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
        >
          Get directions ↗
        </a>
        <button
          onClick={() => onBook?.(activity)}
          style={{ flex: 1, padding: '9px 0', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          Book →
        </button>
      </div>
    </div>
  );
}
