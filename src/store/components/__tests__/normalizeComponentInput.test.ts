import type { ComponentInput, ComponentInputBase } from '../types';
import { normalizeComponentInput } from '../utilities/normalizeComponentInput';

const BASE: ComponentInputBase = {
  initialDistance: 120,
  limits: { distance: 5000, stretch: 0.5, lubrication: 300, cleaning: 1500 },
};

describe('normalizeComponentInput', () => {
  it('trims type, model, and label and keeps inner whitespace and case', () => {
    const input: ComponentInput = { type: ' chain ', model: '  Shimano  CN-M8100 ', label: ' Red  link ' };

    expect(normalizeComponentInput(input, BASE)).toEqual({
      type: 'chain',
      model: 'Shimano  CN-M8100',
      label: 'Red  link',
      initialDistance: 120,
      limits: BASE.limits,
    });
  });

  it.each([
    ['missing', {}],
    ['undefined', { label: undefined }],
    ['null', { label: null }],
    ['empty', { label: '' }],
    ['blank', { label: ' \t' }],
  ])('turns a %s label into null', (_name, label) => {
    expect(normalizeComponentInput({ type: 'chain', model: 'X12', ...label }, BASE).label).toBeNull();
  });

  it('takes the starting distance from the base when it is missing', () => {
    expect(normalizeComponentInput({ type: 'chain', model: 'X12' }, BASE).initialDistance).toBe(120);
  });

  it('keeps a given starting distance, also 0 and invalid numbers for validation to report', () => {
    for (const initialDistance of [0, 412.5, -1, NaN]) {
      expect(normalizeComponentInput({ type: 'chain', model: 'X12', initialDistance }, BASE).initialDistance).toBe(
        initialDistance,
      );
    }
  });

  it('takes every missing limit from the base and keeps the given ones, including null', () => {
    const input: ComponentInput = { type: 'chain', model: 'X12', limits: { stretch: 0.75, cleaning: null } };

    expect(normalizeComponentInput(input, BASE).limits).toEqual({
      distance: 5000,
      stretch: 0.75,
      lubrication: 300,
      cleaning: null,
    });
  });

  it('treats an undefined limit as missing', () => {
    const input: ComponentInput = { type: 'chain', model: 'X12', limits: { stretch: undefined } };

    expect(normalizeComponentInput(input, BASE).limits).toEqual(BASE.limits);
  });

  // toBe uses Object.is, which tells 0 from -0.
  it('turns -0 into 0', () => {
    const normalized = normalizeComponentInput(
      { type: 'chain', model: 'X12', initialDistance: -0, limits: { distance: -0 } },
      BASE,
    );

    expect(normalized.initialDistance).toBe(0);
    expect(normalized.limits.distance).toBe(0);
  });

  it('picks known fields and limits only', () => {
    const input = {
      type: 'chain',
      model: 'CN-M8100',
      id: 'chosen-id',
      history: [{ id: 'h' }],
      usage: [{ id: 'p' }],
      retired: { date: '2026-04-12', bicycleId: 'bike-1' },
      limits: { distance: 4000, chosen: 1 },
      extra: 1,
    };

    expect(normalizeComponentInput(input, BASE)).toStrictEqual({
      type: 'chain',
      model: 'CN-M8100',
      label: null,
      initialDistance: 120,
      limits: { ...BASE.limits, distance: 4000 },
    });
  });

  it('mutates neither the input nor the base', () => {
    const input: ComponentInput = { type: ' chain ', model: ' CN-M8100 ', limits: { distance: 1 } };
    const base = structuredClone(BASE);

    const normalized = normalizeComponentInput(input, base);

    expect(input).toEqual({ type: ' chain ', model: ' CN-M8100 ', limits: { distance: 1 } });
    expect(base).toEqual(BASE);
    expect(normalized.limits).not.toBe(base.limits);
  });
});
