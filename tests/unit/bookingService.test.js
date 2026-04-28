import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock env before importing bookingService
vi.mock('../../server/config/env.js', () => ({
  env: {
    VIATOR_AFFILIATE_ID: 'test-viator',
    GYG_AFFILIATE_ID: 'test-gyg',
  },
}));

const { buildBookingLinks } = await import('../../server/services/bookingService.js');

const baseActivity = (overrides = {}) => ({
  placeId: 'ChIJ_test',
  name: 'Test Place',
  coords: { lat: 35.6, lng: 139.7 },
  website: 'https://example.com',
  bookingType: 'none',
  viatorProductId: null,
  ...overrides,
});

describe('buildBookingLinks', () => {
  describe('experience', () => {
    it('includes Viator link when viatorProductId set', () => {
      const links = buildBookingLinks(
        baseActivity({ bookingType: 'experience', viatorProductId: 'prod123' }),
        '2024-03-12'
      );
      const viator = links.find((l) => l.provider === 'Viator');
      expect(viator).toBeDefined();
      expect(viator.primary).toBe(true);
      expect(viator.url).toContain('prod123');
      expect(viator.url).toContain('test-viator');
    });

    it('includes GetYourGuide link', () => {
      const links = buildBookingLinks(
        baseActivity({ bookingType: 'experience', viatorProductId: 'prod123' }),
        '2024-03-12'
      );
      const gyg = links.find((l) => l.provider === 'GetYourGuide');
      expect(gyg).toBeDefined();
      expect(gyg.url).toContain('test-gyg');
    });
  });

  describe('restaurant', () => {
    it('includes OpenTable as primary', () => {
      const links = buildBookingLinks(baseActivity({ bookingType: 'restaurant' }), '2024-03-12');
      const ot = links.find((l) => l.provider === 'OpenTable');
      expect(ot).toBeDefined();
      expect(ot.primary).toBe(true);
      expect(ot.url).toContain(encodeURIComponent('Test Place'));
    });

    it('includes Google Maps fallback', () => {
      const links = buildBookingLinks(baseActivity({ bookingType: 'restaurant' }), '2024-03-12');
      const gm = links.find((l) => l.provider === 'GoogleMaps');
      expect(gm).toBeDefined();
      expect(gm.url).toContain('ChIJ_test');
    });
  });

  describe('attraction / default', () => {
    it('returns Get directions as primary', () => {
      const links = buildBookingLinks(baseActivity({ bookingType: 'attraction' }), '2024-03-12');
      const dir = links.find((l) => l.provider === 'GoogleMaps');
      expect(dir).toBeDefined();
      expect(dir.primary).toBe(true);
      expect(dir.url).toContain('destination_place_id=ChIJ_test');
    });

    it('includes website link when available', () => {
      const links = buildBookingLinks(baseActivity({ bookingType: 'attraction' }), '2024-03-12');
      const web = links.find((l) => l.provider === 'Website');
      expect(web).toBeDefined();
      expect(web.url).toBe('https://example.com');
    });

    it('does not include website link when missing', () => {
      const links = buildBookingLinks(
        baseActivity({ bookingType: 'attraction', website: null }),
        '2024-03-12'
      );
      const web = links.find((l) => l.provider === 'Website');
      expect(web).toBeUndefined();
    });
  });
});
