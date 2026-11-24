import { definedChanges } from '../utilities/definedChanges';

describe('definedChanges', () => {
  it('drops undefined values and keeps null, empty, and zero values', () => {
    const changes = { size: undefined, frameGeometry: null, model: '', distance: 0 };

    expect(definedChanges(changes)).toStrictEqual({ frameGeometry: null, model: '', distance: 0 });
  });

  it('returns a new object and does not mutate the input', () => {
    const changes = { model: 'CN-M8100', type: undefined };

    const result = definedChanges(changes);

    expect(result).not.toBe(changes);
    expect(changes).toStrictEqual({ model: 'CN-M8100', type: undefined });
  });

  it('returns an empty object when nothing is set', () => {
    expect(definedChanges({ model: undefined })).toStrictEqual({});
  });
});
