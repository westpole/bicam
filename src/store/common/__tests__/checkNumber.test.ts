import { checkNumber } from '../utilities/checkNumber';

describe('checkNumber', () => {
  it.each([0, 0.1, 412.5, 499_999.9, 500_000])('accepts %s with at most 1 decimal', (value) => {
    expect(checkNumber(value, 500_000, 1)).toBeNull();
  });

  // Multiplying these by 100 does not give a whole number.
  it.each([0.29, 0.57, 1.15, 4.35])('accepts %s with at most 2 decimals', (value) => {
    expect(checkNumber(value, 5, 2)).toBeNull();
  });

  it.each([NaN, Infinity, -Infinity])('rejects %s as invalidFormat', (value) => {
    expect(checkNumber(value, 500_000, 1)).toBe('invalidFormat');
  });

  it.each([-0.1, -1, 500_000.1, Number.MAX_VALUE])('rejects %s as outOfRange', (value) => {
    expect(checkNumber(value, 500_000, 1)).toBe('outOfRange');
  });

  it.each([
    [412.55, 1],
    [0.01, 1],
    [1e-7, 1],
    [0.755, 2],
    [0.5, 0],
  ])('rejects %s with at most %s decimals as invalidFormat', (value, decimals) => {
    expect(checkNumber(value, 500_000, decimals)).toBe('invalidFormat');
  });

  it('reports the range before the decimals', () => {
    expect(checkNumber(-0.55, 5, 1)).toBe('outOfRange');
    expect(checkNumber(5.55, 5, 1)).toBe('outOfRange');
  });
});
