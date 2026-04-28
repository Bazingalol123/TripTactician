import { describe, it, expect } from 'vitest';
import { formatPriceLevel, convertCurrency } from '../../client/src/utils/currency.js';

describe('formatPriceLevel', () => {
  it('returns Free for price level 0', () => {
    expect(formatPriceLevel(0)).toBe('Free');
  });

  it('returns Free for null', () => {
    expect(formatPriceLevel(null)).toBe('Free');
  });

  it('returns Free for undefined', () => {
    expect(formatPriceLevel(undefined)).toBe('Free');
  });

  it('returns range for price level 1', () => {
    const result = formatPriceLevel(1, 'USD');
    expect(result).toContain('10');
    expect(result).toContain('25');
    expect(result).toContain('per person');
  });

  it('returns range for price level 2', () => {
    const result = formatPriceLevel(2, 'USD');
    expect(result).toContain('25');
    expect(result).toContain('60');
  });

  it('returns range for price level 3', () => {
    const result = formatPriceLevel(3, 'USD');
    expect(result).toContain('60');
    expect(result).toContain('120');
  });

  it('returns open range for price level 4', () => {
    const result = formatPriceLevel(4, 'USD');
    expect(result).toContain('120');
    expect(result).toContain('+');
  });

  it('respects currency', () => {
    const result = formatPriceLevel(2, 'EUR', 'de-DE');
    expect(result).toMatch(/€|EUR/);
  });
});

describe('convertCurrency', () => {
  it('converts correctly', () => {
    expect(convertCurrency(100, 1, 0.9)).toBe(90);
  });

  it('returns same amount when rates are equal', () => {
    expect(convertCurrency(100, 1, 1)).toBe(100);
  });

  it('rounds to nearest integer', () => {
    expect(convertCurrency(100, 3, 1)).toBe(33);
  });
});
