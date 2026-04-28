import { useState } from 'react';
import TripMap from './TripMap.jsx';

/**
 * FullscreenMap — fullscreen wrapper with day-selector tabs overlay
 * @param {Array}    days        - trip days array
 * @param {number}   activeDay   - currently selected dayNumber
 * @param {function} onDayChange - (dayNumber) => void
 * @param {Array}    activities  - activities for activeDay
 * @param {boolean}  ordered
 * @param {function} onClose     - called when user exits fullscreen
 */
export default function FullscreenMap({ days = [], activeDay, onDayChange, activities, ordered, onClose }) {
  const [selectedActivity, setSelectedActivity] = useState(null);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: '#fff' }}>
      {/* Day tabs overlay */}
      <div style={{
        position: 'absolute', top: 12, left: 0, right: 0, zIndex: 9001,
        display: 'flex', gap: 6, padding: '0 12px', overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        <button
          onClick={onClose}
          style={{ padding: '6px 10px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 20, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          ← Back
        </button>
        {days.map((day) => {
          const isActive = day.dayNumber === activeDay;
          return (
            <button
              key={day.dayNumber}
              onClick={() => onDayChange?.(day.dayNumber)}
              style={{
                padding: '6px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                background: isActive ? '#185FA5' : '#fff',
                color: isActive ? '#fff' : '#374151',
                border: isActive ? '1px solid #185FA5' : '1px solid #D1D5DB',
              }}
            >
              Day {day.dayNumber}
            </button>
          );
        })}
      </div>

      <TripMap
        activities={activities}
        ordered={ordered}
        onPinSelect={setSelectedActivity}
        selectedActivity={selectedActivity}
        fullscreen
        onFullscreenToggle={onClose}
      />
    </div>
  );
}
