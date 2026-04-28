import { Marker } from 'react-leaflet';
import L from 'leaflet';

const pinColors = {
  blue:  { border: '#185FA5', bg: '#E6F1FB', text: '#185FA5' },
  red:   { border: '#A32D2D', bg: '#FCEBEB', text: '#A32D2D' },
  gray:  { border: '#9CA3AF', bg: '#F3F4F6', text: '#6B7280' },
};

const makeIcon = (variant, label) => {
  const { border, bg, text } = pinColors[variant];
  const inner = label
    ? `<span style="font-size:11px;font-weight:600;color:${text};">${label}</span>`
    : `<span style="width:8px;height:8px;border-radius:50%;background:${border};display:inline-block;"></span>`;

  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      border:2px solid ${border};background:${bg};
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 1px 4px rgba(0,0,0,.25);
      cursor:pointer;
    ">${inner}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

/**
 * MapPin — single activity marker
 * @param {object} activity
 * @param {boolean} ordered - show number badge when true
 * @param {number} index - 1-based order number
 * @param {function} onSelect - called with activity on click
 */
export default function MapPin({ activity, ordered, index, onSelect }) {
  const { coords, conflict } = activity;
  if (!coords?.lat || !coords?.lng) return null;

  let variant = 'gray';
  let label = null;

  if (conflict?.flagged && !conflict.overridden) {
    variant = 'red';
    label = ordered ? String(index) : null;
  } else if (ordered) {
    variant = 'blue';
    label = String(index);
  }

  return (
    <Marker
      position={[coords.lat, coords.lng]}
      icon={makeIcon(variant, label)}
      eventHandlers={{ click: () => onSelect?.(activity) }}
    />
  );
}
