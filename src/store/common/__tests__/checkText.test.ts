import { CONTROL_CHARACTER_PATTERN } from '../constants';
import { checkText } from '../utilities/checkText';

describe('checkText', () => {
  it.each([
    ['', 'required'],
    ['abcd', 'tooLong'],
    ['a\nb', 'invalidFormat'],
    ['a\u0007b', 'invalidFormat'],
    ['abc', null],
  ])('checks %j against a limit of 3 and returns %j', (value, expected) => {
    expect(checkText(value, 3, CONTROL_CHARACTER_PATTERN)).toBe(expected);
  });

  it('reports the length before the forbidden characters', () => {
    expect(checkText('ab\ncd', 3, CONTROL_CHARACTER_PATTERN)).toBe('tooLong');
  });

  it('allows characters the given pattern does not forbid', () => {
    expect(checkText('a\nb', 3, /x/)).toBeNull();
  });
});
