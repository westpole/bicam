import { storedComponent } from '../__mocks__/storedComponent';
import type { ComponentCollection } from '../types';
import { hasComponent } from '../utilities/hasComponent';

const COLLECTION: ComponentCollection = {
  byId: { 'chain-1': storedComponent('chain-1', 'chain', 'CN-M8100') },
  allIds: ['chain-1'],
};

describe('hasComponent', () => {
  it('finds a stored id', () => {
    expect(hasComponent(COLLECTION, 'chain-1')).toBe(true);
  });

  it.each(['unknown-id', 'CHAIN-1', '', 'toString', 'constructor', '__proto__'])('does not find %j', (id) => {
    expect(hasComponent(COLLECTION, id)).toBe(false);
  });
});
