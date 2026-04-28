import { useState } from 'react';

export const useBooking = () => {
  const [bookingActivity, setBookingActivity] = useState(null);

  const openBooking = (activity) => setBookingActivity(activity);
  const closeBooking = () => setBookingActivity(null);

  return { bookingActivity, openBooking, closeBooking, isOpen: bookingActivity !== null };
};
