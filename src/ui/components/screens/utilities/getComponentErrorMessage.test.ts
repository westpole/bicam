import i18n from 'i18next';

import type { ComponentErrorCode, ComponentField } from '@store/components/types';

import { getComponentErrorMessage } from './getComponentErrorMessage';

describe('getComponentErrorMessage', () => {
  const { t } = i18n;

  it.each<[ComponentField, ComponentErrorCode, string]>([
    ['type', 'required', 'This field is required.'],
    ['model', 'tooLong', 'Use 60 characters or fewer.'],
    ['label', 'tooLong', 'Use 20 characters or fewer.'],
    ['model', 'invalidFormat', 'Remove the characters that are not allowed.'],
    ['label', 'invalidFormat', 'Remove the characters that are not allowed.'],
    ['initialDistance', 'invalidFormat', 'Enter a number, for example 412.5.'],
    ['limits.distance', 'invalidFormat', 'Enter a number, for example 4000.'],
    ['limits.stretch', 'invalidFormat', 'Enter a number, for example 0.75.'],
    ['limits.lubrication', 'invalidFormat', 'Enter a number, for example 300.'],
    ['limits.cleaning', 'invalidFormat', 'Enter a number, for example 1500.'],
    ['initialDistance', 'outOfRange', 'Enter a number from 0 to 500,000.'],
    ['limits.distance', 'outOfRange', 'Enter a number above 0 and up to 500,000.'],
    ['limits.stretch', 'outOfRange', 'Enter a number above 0 and up to 5.'],
    ['limits.cleaning', 'outOfRange', 'Enter a number above 0 and up to 500,000.'],
    ['type', 'invalidOption', 'This value cannot be used.'],
    ['initialDistance', 'notAllowed', 'This value cannot be used.'],
    ['id', 'notFound', 'This value cannot be used.'],
    ['type', 'tooMany', 'This value cannot be used.'],
  ])('explains %s %s', (field, code, expected) => {
    expect(getComponentErrorMessage(t, field, code)).toBe(expected);
  });
});
