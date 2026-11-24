import { toOptionalText } from '../utilities/toOptionalText';

describe('toOptionalText', () => {
  it.each([undefined, null, '', '  \n\t '])('turns %j into null', (value) => {
    expect(toOptionalText(value)).toBeNull();
  });

  it('trims text and keeps inner whitespace', () => {
    expect(toOptionalText('  Stack 594 mm\nReach 393 mm ')).toBe('Stack 594 mm\nReach 393 mm');
  });

  it("keeps the text '0'", () => {
    expect(toOptionalText(' 0 ')).toBe('0');
  });
});
