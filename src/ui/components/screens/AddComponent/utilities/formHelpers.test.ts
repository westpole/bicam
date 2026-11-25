import i18n from 'i18next';

import { COMPONENTS } from '../../../ComponentList/__mocks__/components';
import { DETAIL_FIELDS, LIMIT_FIELDS } from '../constants';
import { getSavedMessage } from './getSavedMessage';
import { hasChainLimits } from './hasChainLimits';
import { toFormErrors } from './toFormErrors';

describe('hasChainLimits', () => {
  it.each([
    ['chain', true],
    ['tire', false],
    ['cassette', false],
    ['', false],
    ['Chain', false],
  ])('is %s for %j', (type, expected) => {
    expect(hasChainLimits(type)).toBe(expected);
  });
});

describe('toFormErrors', () => {
  it('indexes the errors of the shown fields and leaves out the others', () => {
    expect(
      toFormErrors(
        [
          { field: 'model', code: 'required' },
          { field: 'limits.stretch', code: 'notAllowed' },
          { field: 'id', code: 'notFound' },
        ],
        [...DETAIL_FIELDS, LIMIT_FIELDS[0]],
      ),
    ).toEqual({ model: 'required' });
  });

  it('returns no errors for an empty list', () => {
    expect(toFormErrors([], DETAIL_FIELDS)).toEqual({});
  });
});

describe('getSavedMessage', () => {
  const { t } = i18n;

  it('names the type and model', () => {
    expect(getSavedMessage(t, COMPONENTS[0])).toBe('Chain Shimano CN-M8100 was added.');
  });

  it('adds the label when there is one', () => {
    expect(getSavedMessage(t, { ...COMPONENTS[1], label: 'front' })).toBe('Wheel DT Swiss G 1800 (front) was added.');
  });
});
