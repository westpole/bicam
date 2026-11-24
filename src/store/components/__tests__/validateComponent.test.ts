import { COMPONENT_LIMITS, COMPONENT_TYPES } from '../constants';
import { validateComponent } from '../utilities/validateComponent';

describe('validateComponent', () => {
  it.each(COMPONENT_TYPES)('accepts the type %s', (type) => {
    expect(validateComponent({ type, model: 'Model' })).toEqual({ ok: true, details: { type, model: 'Model' } });
  });

  it('requires a type', () => {
    expect(validateComponent({ type: '', model: 'Model' })).toEqual({
      ok: false,
      errors: [{ field: 'type', code: 'required' }],
    });
  });

  it.each(['Chain', 'bar tape', 'engine', 'toString', '__proto__', '0', 'length'])('rejects the type %j', (type) => {
    expect(validateComponent({ type, model: 'Model' })).toEqual({
      ok: false,
      errors: [{ field: 'type', code: 'invalidOption' }],
    });
  });

  it('accepts a model of exactly the maximum length', () => {
    const model = 'x'.repeat(COMPONENT_LIMITS.modelMaxLength);

    expect(validateComponent({ type: 'chain', model })).toEqual({ ok: true, details: { type: 'chain', model } });
  });

  it.each([
    ['a blank', '', 'required'],
    ['a too long', 'x'.repeat(COMPONENT_LIMITS.modelMaxLength + 1), 'tooLong'],
    ['a multi-line', 'a\nb', 'invalidFormat'],
    ['a bell-containing', 'a\u0007b', 'invalidFormat'],
  ])('rejects %s model', (_description, model, code) => {
    expect(validateComponent({ type: 'chain', model })).toEqual({ ok: false, errors: [{ field: 'model', code }] });
  });

  it('reports both fields, type first', () => {
    expect(validateComponent({ type: 'engine', model: '' })).toEqual({
      ok: false,
      errors: [
        { field: 'type', code: 'invalidOption' },
        { field: 'model', code: 'required' },
      ],
    });
  });
});
