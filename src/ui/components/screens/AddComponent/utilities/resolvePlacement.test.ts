import { FORM_BICYCLES, GRAVEL_CHAIN, GRAVEL_WHEELS } from '../__mocks__/bicycles';
import { EMPTY_PLACEMENT } from '../constants';
import { resolvePlacement } from './resolvePlacement';

const [gravel, road] = FORM_BICYCLES;

describe('resolvePlacement', () => {
  it('is a spare without a bicycle, or with one that is no longer offered', () => {
    const spare = { chosen: undefined, inUse: false, candidates: [], needsReplace: false, replaces: '' };

    expect(resolvePlacement(FORM_BICYCLES, 'chain', EMPTY_PLACEMENT)).toEqual(spare);
    expect(resolvePlacement(FORM_BICYCLES, 'chain', { ...EMPTY_PLACEMENT, bicycleId: 'removed', inUse: true })).toEqual(
      spare,
    );
  });

  it('is in use by default without a known type', () => {
    expect(resolvePlacement(FORM_BICYCLES, '', { ...EMPTY_PLACEMENT, bicycleId: gravel.bicycle.id })).toMatchObject({
      chosen: gravel,
      inUse: true,
      candidates: [],
      needsReplace: false,
    });
  });

  it('follows the room by default and the rider once set', () => {
    const onGravel = { ...EMPTY_PLACEMENT, bicycleId: gravel.bicycle.id };

    expect(resolvePlacement(FORM_BICYCLES, 'saddle', onGravel).inUse).toBe(true);
    expect(resolvePlacement(FORM_BICYCLES, 'chain', onGravel).inUse).toBe(false);
    expect(resolvePlacement(FORM_BICYCLES, 'saddle', { ...onGravel, inUse: false }).inUse).toBe(false);
    expect(resolvePlacement([road], 'chain', { ...EMPTY_PLACEMENT, bicycleId: road.bicycle.id }).inUse).toBe(true);
  });

  it('keeps a chosen candidate, drops one that is not, and preselects a single one', () => {
    const wheels = { bicycleId: gravel.bicycle.id, inUse: true, replaces: GRAVEL_WHEELS[1].id };

    expect(resolvePlacement(FORM_BICYCLES, 'wheel', wheels)).toMatchObject({
      needsReplace: true,
      candidates: GRAVEL_WHEELS,
      replaces: GRAVEL_WHEELS[1].id,
    });
    expect(resolvePlacement(FORM_BICYCLES, 'wheel', { ...wheels, replaces: GRAVEL_CHAIN.id }).replaces).toBe('');
    expect(resolvePlacement(FORM_BICYCLES, 'chain', { ...wheels, replaces: 'gone' }).replaces).toBe(GRAVEL_CHAIN.id);
  });
});
