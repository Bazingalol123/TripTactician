export const getDirectionsUrl = (activity) => {
  const coords = `${activity.coords.lat},${activity.coords.lng}`;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) return `maps://maps.apple.com/?daddr=${coords}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${coords}`;
};

export const openDeepLink = (url) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};
