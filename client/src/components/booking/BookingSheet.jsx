import Sheet from '../ui/Sheet.jsx';
import BookingOption from './BookingOption.jsx';
import Banner from '../ui/Banner.jsx';
import { getDirectionsUrl } from '../../utils/booking.js';
import { formatDate } from '../../utils/dates.js';

export default function BookingSheet({ activity, date, onClose }) {
  if (!activity) return null;

  const photo = activity.photos?.[0];
  const conflict = activity.conflict?.flagged && !activity.conflict?.overridden;
  const isNoBooking = !activity.bookingType || activity.bookingType === 'none';

  const directionLink = {
    provider: 'GoogleMaps',
    label: 'Get directions',
    url: getDirectionsUrl(activity),
  };

  return (
    <Sheet open={!!activity} onClose={onClose} variant={conflict ? 'conflict' : 'default'}>
      {photo && (
        <div className="-mx-4 -mt-2 mb-4">
          <img
            src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=480&photo_reference=${photo}&key=`}
            alt=""
            className="w-full h-44 object-cover"
          />
        </div>
      )}

      <h2 className="font-semibold text-gray-900">{activity.name}</h2>
      <p className="text-sm text-gray-500 mt-0.5">
        {date && formatDate(date, 'MMM d')} · 2 people
      </p>

      {conflict && activity.conflict?.reason && (
        <Banner variant="conflict" className="mt-3">
          ⚠ {activity.conflict.reason}
        </Banner>
      )}

      {isNoBooking && (
        <Banner variant="success" className="mt-3">
          ✓ No booking needed — just show up.
        </Banner>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {isNoBooking ? (
          <>
            <BookingOption link={directionLink} rank="primary" />
            {activity.website && (
              <BookingOption
                link={{ provider: 'Website', label: 'Official website', url: activity.website }}
                rank="secondary"
              />
            )}
          </>
        ) : (
          <>
            <BookingOption link={directionLink} rank="primary" />
            {activity.website && (
              <BookingOption
                link={{ provider: 'Website', label: 'Official website', url: activity.website }}
                rank="secondary"
              />
            )}
          </>
        )}
      </div>
    </Sheet>
  );
}
