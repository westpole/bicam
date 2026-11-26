import { fitsActiveLimit } from '../utilities/fitsActiveLimit';

describe('fitsActiveLimit', () => {
  describe('a limit of 1 (chain)', () => {
    it('fits a new period that starts where the last one ended, because periods are half-open', () => {
      expect(fitsActiveLimit([{ start: 0, end: 1500 }, { start: 1500, end: null }], 1500, 1)).toBe(true);
    });

    it('fits a new period after a gap', () => {
      expect(fitsActiveLimit([{ start: 0, end: 1500 }, { start: 2000, end: null }], 2000, 1)).toBe(true);
    });

    it('rejects a new period that starts inside a closed one', () => {
      expect(fitsActiveLimit([{ start: 0, end: 1500 }, { start: 1000, end: null }], 1000, 1)).toBe(false);
    });

    it('rejects a new period that runs into a later one', () => {
      expect(fitsActiveLimit([{ start: 1500, end: 3100 }, { start: 1000, end: null }], 1000, 1)).toBe(false);
    });

    it('ignores a zero-length period, which is never open', () => {
      expect(fitsActiveLimit([{ start: 1500, end: 1500 }, { start: 1500, end: null }], 1500, 1)).toBe(true);
    });

    it('ignores an overlap before the new start', () => {
      expect(
        fitsActiveLimit(
          [
            { start: 0, end: 1000 },
            { start: 500, end: 1000 },
            { start: 1000, end: null },
          ],
          1000,
          1,
        ),
      ).toBe(true);
    });
  });

  describe('a limit of 2 (wheel)', () => {
    it('fits a late swap of one wheel after a newer swap of the other', () => {
      // Front: W1 [0, 1000) replaced by W3 from 1000. Rear: W2 [0, 2000) replaced by W4 from 2000.
      const intervals = [
        { start: 0, end: 1000 },
        { start: 0, end: 2000 },
        { start: 2000, end: null },
        { start: 1000, end: null },
      ];

      expect(fitsActiveLimit(intervals, 1000, 2)).toBe(true);
    });

    it('rejects a third wheel at any later reading', () => {
      const intervals = [
        { start: 0, end: null },
        { start: 2000, end: null },
        { start: 1000, end: null },
      ];

      expect(fitsActiveLimit(intervals, 1000, 2)).toBe(false);
    });

    it('fits two open wheels', () => {
      expect(fitsActiveLimit([{ start: 0, end: null }, { start: 500, end: null }], 500, 2)).toBe(true);
    });
  });

  describe('no limit (front mount)', () => {
    it('fits any number of open periods', () => {
      const intervals = Array.from({ length: 10 }, () => ({ start: 0, end: null }));

      expect(fitsActiveLimit(intervals, 0, null)).toBe(true);
    });
  });

  it('fits when nothing else is on the bicycle', () => {
    expect(fitsActiveLimit([{ start: 300, end: null }], 300, 1)).toBe(true);
  });
});
