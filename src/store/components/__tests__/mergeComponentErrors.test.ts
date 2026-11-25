import { mergeComponentErrors } from '../utilities/mergeComponentErrors';

describe('mergeComponentErrors', () => {
  it('returns the validation errors when there are no conflicts', () => {
    const errors = [{ field: 'model', code: 'required' }] as const;

    expect(mergeComponentErrors([], errors)).toEqual(errors);
  });

  it('keeps the conflict and drops the validation error when both hit the same field', () => {
    expect(
      mergeComponentErrors(
        [{ field: 'initialDistance', code: 'notAllowed' }],
        [{ field: 'initialDistance', code: 'outOfRange' }],
      ),
    ).toEqual([{ field: 'initialDistance', code: 'notAllowed' }]);
  });

  it('sorts conflicts and validation errors into field order', () => {
    expect(
      mergeComponentErrors(
        [
          { field: 'type', code: 'notAllowed' },
          { field: 'initialDistance', code: 'notAllowed' },
        ],
        [
          { field: 'model', code: 'required' },
          { field: 'limits.cleaning', code: 'outOfRange' },
          { field: 'label', code: 'tooLong' },
        ],
      ),
    ).toEqual([
      { field: 'type', code: 'notAllowed' },
      { field: 'model', code: 'required' },
      { field: 'label', code: 'tooLong' },
      { field: 'initialDistance', code: 'notAllowed' },
      { field: 'limits.cleaning', code: 'outOfRange' },
    ]);
  });

  it('mutates neither list', () => {
    const conflicts = [{ field: 'initialDistance', code: 'notAllowed' } as const];
    const errors = [{ field: 'model', code: 'required' } as const];

    mergeComponentErrors(conflicts, errors);

    expect(conflicts).toEqual([{ field: 'initialDistance', code: 'notAllowed' }]);
    expect(errors).toEqual([{ field: 'model', code: 'required' }]);
  });
});
