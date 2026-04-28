import { env } from '../config/env.js';

export const buildBookingLinks = (activity, date, partySize = 2) => {
  switch (activity.bookingType) {
    case 'experience':
      return buildExperienceLinks(activity, date, partySize);
    case 'restaurant':
      return buildRestaurantLinks(activity, date, partySize);
    case 'attraction':
    default:
      return buildAttractionLinks(activity);
  }
};

const buildExperienceLinks = (activity, date, partySize) => {
  const links = [];
  if (activity.viatorProductId && env.VIATOR_AFFILIATE_ID) {
    links.push({
      provider: 'Viator',
      label: 'Book on Viator',
      url: `https://www.viator.com/tours/${activity.viatorProductId}?pid=${env.VIATOR_AFFILIATE_ID}&date=${date}&pax=${partySize}`,
      primary: true,
    });
  }
  if (env.GYG_AFFILIATE_ID) {
    links.push({
      provider: 'GetYourGuide',
      label: 'Try GetYourGuide',
      url: `https://www.getyourguide.com/s/?q=${encodeURIComponent(activity.name)}&partner_id=${env.GYG_AFFILIATE_ID}`,
      primary: links.length === 0,
    });
  }
  if (activity.website) {
    links.push({ provider: 'Website', label: 'Official website', url: activity.website, primary: links.length === 0 });
  }
  return links;
};

const buildRestaurantLinks = (activity, date, partySize) => {
  const links = [];
  links.push({
    provider: 'OpenTable',
    label: 'Reserve on OpenTable',
    url: `https://www.opentable.com/s/?term=${encodeURIComponent(activity.name)}&covers=${partySize}&dateTime=${date}`,
    primary: true,
  });
  links.push({
    provider: 'GoogleMaps',
    label: 'Google Maps',
    url: `https://www.google.com/maps/place/?q=place_id:${activity.placeId}`,
    primary: false,
  });
  return links;
};

const buildAttractionLinks = (activity) => [
  {
    provider: 'GoogleMaps',
    label: 'Get directions',
    url: `https://www.google.com/maps/dir/?api=1&destination_place_id=${activity.placeId}`,
    primary: true,
  },
  ...(activity.website
    ? [{ provider: 'Website', label: 'Official website', url: activity.website, primary: false }]
    : []),
];
