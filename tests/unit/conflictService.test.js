import { describe, it, expect } from 'vitest';
import { checkConflict } from '../../server/services/conflictService.js';

const basePrefs = (overrides = {}) => ({
  pace: 'moderate',
  interests: ['food', 'culture'],
  morningPerson: true,
  hardAvoids: '',
  ...overrides,
});

describe('checkConflict', () => {
  it('returns no conflict for normal activity', () => {
    const result = checkConflict({
      activity: { name: 'Tsukiji Market', category: 'food', source: 'ai_generated', timeOfDay: 'morning' },
      preferenceA: basePrefs(),
      preferenceB: basePrefs(),
    });
    expect(result.flagged).toBe(false);
  });

  it('flags conflict when activity matches hardAvoids', () => {
    const result = checkConflict({
      activity: { name: 'Tokyo Museum of Art', category: 'museum', source: 'ai_generated' },
      preferenceA: basePrefs({ hardAvoids: 'museum, art' }),
      preferenceB: basePrefs(),
    });
    expect(result.flagged).toBe(true);
    expect(result.partner).toBe('A');
    expect(result.reason).toMatch(/museum/i);
  });

  it('flags conflict when partner B has hard avoid match', () => {
    const result = checkConflict({
      activity: { name: 'Nightclub Womb', category: 'night_club', source: 'ai_generated' },
      preferenceA: basePrefs(),
      preferenceB: basePrefs({ hardAvoids: 'nightclub, loud' }),
    });
    expect(result.flagged).toBe(true);
    expect(result.partner).toBe('B');
  });

  it('flags morning conflict when partner not a morning person', () => {
    const result = checkConflict({
      activity: { name: 'Early Market', category: 'food', source: 'ai_generated', timeOfDay: 'morning' },
      preferenceA: basePrefs({ morningPerson: false }),
      preferenceB: basePrefs(),
    });
    expect(result.flagged).toBe(true);
    expect(result.partner).toBe('A');
    expect(result.reason).toMatch(/morning/i);
  });

  it('flags soft conflict when manual activity not in interests', () => {
    const result = checkConflict({
      activity: { name: 'Random Shop', category: 'shopping', source: 'manual' },
      preferenceA: basePrefs({ interests: ['food', 'nature'] }),
      preferenceB: basePrefs({ interests: ['culture', 'adventure'] }),
    });
    expect(result.flagged).toBe(true);
    expect(result.partner).toBeNull();
  });

  it('does not apply soft conflict rule to ai_generated activities', () => {
    const result = checkConflict({
      activity: { name: 'Random Shop', category: 'shopping', source: 'ai_generated' },
      preferenceA: basePrefs({ interests: ['food', 'nature'] }),
      preferenceB: basePrefs({ interests: ['culture', 'adventure'] }),
    });
    expect(result.flagged).toBe(false);
  });

  it('handles null preferences gracefully', () => {
    const result = checkConflict({
      activity: { name: 'Some Place', category: 'food', source: 'ai_generated' },
      preferenceA: null,
      preferenceB: null,
    });
    expect(result.flagged).toBe(false);
  });
});
