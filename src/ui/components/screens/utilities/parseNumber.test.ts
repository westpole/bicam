import { parseNumber } from './parseNumber';

describe('parseNumber', () => {
  it.each(['', '   ', '\t'])('reads %j as an empty field', (text) => {
    expect(parseNumber(text)).toBeNull();
  });

  it.each<[string, number]>([
    ['412.5', 412.5],
    [' 12 ', 12],
    ['0', 0],
    ['+5', 5],
    ['-5', -5],
    ['.5', 0.5],
    ['5.', 5],
    ['007', 7],
  ])('reads %j as %s', (text, expected) => {
    expect(parseNumber(text)).toBe(expected);
  });

  it.each(['1,5', '1e3', 'abc', '1.2.3', '0x10', '1 000', '.', '-', 'Infinity', '12km'])(
    'reads %j as NaN, so the store rejects it',
    (text) => {
      expect(parseNumber(text)).toBeNaN();
    },
  );
});
