import { isIsoDate } from '../utilities/isIsoDate';

describe('isIsoDate', () => {
  it.each(['2024-05-17', '2024-02-29', '2000-02-29', '1999-12-31', '0050-01-01'])('accepts %s', (value) => {
    expect(isIsoDate(value)).toBe(true);
  });

  it.each([
    ['a non-leap 29 February', '2023-02-29'],
    ['a century non-leap 29 February', '1900-02-29'],
    ['30 February', '2023-02-30'],
    ['month 13', '2023-13-01'],
    ['month 00', '2023-00-10'],
    ['day 00', '2023-01-00'],
    ['day 32', '2023-01-32'],
    ['single-digit parts', '2024-5-7'],
    ['a time part', '2024-05-17T10:00:00Z'],
    ['another separator', '2024/05/17'],
    ['an empty string', ''],
    ['text', 'yesterday'],
  ])('rejects %s', (_label, value) => {
    expect(isIsoDate(value)).toBe(false);
  });
});
