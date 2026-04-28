import { useMemo } from 'react';
import { convertCurrency } from '../utils/currency.js';

export const useExpenses = (activities, exchangeRate = 1) => {
  const totals = useMemo(() => {
    const perPerson = (activities ?? []).reduce(
      (sum, a) => sum + (a.estimatedCostPerPerson || 0),
      0
    );
    const forTwo = perPerson * 2;

    const byDay = (activities ?? []).reduce((acc, a) => {
      acc[a.dayNumber] = (acc[a.dayNumber] || 0) + (a.estimatedCostPerPerson || 0) * 2;
      return acc;
    }, {});

    return {
      perPerson: convertCurrency(perPerson, 1, exchangeRate),
      forTwo: convertCurrency(forTwo, 1, exchangeRate),
      byDay: Object.fromEntries(
        Object.entries(byDay).map(([day, amount]) => [day, convertCurrency(amount, 1, exchangeRate)])
      ),
    };
  }, [activities, exchangeRate]);

  return totals;
};
