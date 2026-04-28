import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the AI SDK before importing
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

vi.mock('../../server/config/env.js', () => ({
  env: {
    LLM_PROVIDER: 'openai',
    OPENAI_API_KEY: 'test-key',
    OPENAI_MODEL: 'gpt-4o-mini',
  },
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => vi.fn(() => 'mock-model')),
}));

const { generateObject } = await import('ai');
const { generateItinerary, extractSearchParams } = await import('../../server/services/llmService.js');

beforeEach(() => vi.clearAllMocks());

const mockTrip = {
  destination: { name: 'Tokyo' },
  days: [{ dayNumber: 1 }, { dayNumber: 2 }],
  startDate: '2024-03-12',
  endDate: '2024-03-13',
};

const mockProfile = {
  pace: 'moderate',
  interests: ['food', 'culture'],
  morningPerson: true,
  hardAvoids: '',
};

describe('generateItinerary', () => {
  it('calls generateObject with schema and returns object', async () => {
    const mockItinerary = {
      days: [
        { dayNumber: 1, label: 'Arrival', activities: [{ placeId: 'p1', order: 1, timeOfDay: 'morning', conflict: { flagged: false, partner: null, reason: null } }] },
      ],
    };
    generateObject.mockResolvedValueOnce({ object: mockItinerary });

    const result = await generateItinerary({
      candidates: [{ placeId: 'p1', name: 'Tsukiji', category: 'food', priceLevel: 2 }],
      profileA: mockProfile,
      profileB: mockProfile,
      trip: mockTrip,
    });

    expect(generateObject).toHaveBeenCalledOnce();
    expect(result).toEqual(mockItinerary);
  });

  it('includes candidate data in prompt', async () => {
    generateObject.mockResolvedValueOnce({ object: { days: [] } });

    await generateItinerary({
      candidates: [{ placeId: 'p1', name: 'Senso-ji', category: 'culture', priceLevel: 0 }],
      profileA: mockProfile,
      profileB: mockProfile,
      trip: mockTrip,
    });

    const callArg = generateObject.mock.calls[0][0];
    expect(callArg.prompt).toContain('Senso-ji');
    expect(callArg.temperature).toBe(0.3);
  });
});

describe('extractSearchParams', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns extracted params on success', async () => {
    const mockParams = { categories: ['museum'], keywords: ['art'], timeOfDay: 'morning', maxPriceLevel: 3, nearPlaceType: null };
    generateObject.mockResolvedValueOnce({ object: mockParams });

    const result = await extractSearchParams('art museums in the morning');
    expect(result.categories).toContain('museum');
    expect(result.timeOfDay).toBe('morning');
  });

  it('returns fallback on LLM error', async () => {
    generateObject.mockRejectedValueOnce(new Error('LLM unavailable'));

    const result = await extractSearchParams('sushi restaurants');
    expect(result.categories).toEqual([]);
    expect(result.keywords).toEqual(expect.arrayContaining(['sushi']));
    expect(result.timeOfDay).toBeNull();
  });

  it('sanitizes malicious input', async () => {
    generateObject.mockResolvedValueOnce({ object: { categories: [], keywords: [], timeOfDay: null, maxPriceLevel: null, nearPlaceType: null } });

    await extractSearchParams('<script>alert(1)</script>');
    const callArg = generateObject.mock.calls[0][0];
    expect(callArg.prompt).not.toContain('<script>');
  });
});
