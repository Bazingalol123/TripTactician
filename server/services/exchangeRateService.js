import axios from 'axios';
import logger from '../utils/logger.js';

let cache = { rates: {}, fetchedAt: null };
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const getExchangeRate = async (from, to) => {
  if (from === to) return 1;
  if (!cache.fetchedAt || Date.now() - cache.fetchedAt > CACHE_TTL_MS) {
    try {
      const res = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
      cache = { rates: res.data.rates, fetchedAt: Date.now() };
    } catch (err) {
      logger.warn({ err }, 'Exchange rate fetch failed, using cached rates');
    }
  }
  const fromRate = cache.rates[from] || 1;
  const toRate = cache.rates[to] || 1;
  return toRate / fromRate;
};
