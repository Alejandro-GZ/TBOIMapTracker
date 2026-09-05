import { describe, expect, it } from 'vitest';
import { getAllowedRoomShapes, getDefaultRoomShape, isRoomShapeAllowed } from './roomRules';

const ALL_SHAPES = [
  '1x1', 'IH', 'IV', '1x2', 'IIV', '2x1', 'IIH', '2x2', 'LTL', 'LTR', 'LBL', 'LBR',
];

describe('room shape rules', () => {
  it('keeps normal and other rooms unrestricted', () => {
    expect(getAllowedRoomShapes('normal')).toEqual(ALL_SHAPES);
    expect(getAllowedRoomShapes('other')).toEqual(ALL_SHAPES);
  });

  it('uses the three vanilla Planetarium shapes', () => {
    expect(getAllowedRoomShapes('planetarium')).toEqual(['1x1', 'IH', 'IV']);
    expect(isRoomShapeAllowed('planetarium', 'IH')).toBe(true);
    expect(isRoomShapeAllowed('planetarium', 'IV')).toBe(true);
    expect(isRoomShapeAllowed('planetarium', '1x2')).toBe(false);
    expect(isRoomShapeAllowed('planetarium', 'LTL')).toBe(false);
  });

  it('keeps the documented closet variants for Arcade and Library', () => {
    expect(getAllowedRoomShapes('arcade')).toEqual(['1x1', 'IV']);
    expect(getAllowedRoomShapes('library')).toEqual(['1x1', 'IV']);
    expect(isRoomShapeAllowed('arcade', 'IV')).toBe(true);
    expect(isRoomShapeAllowed('library', 'IV')).toBe(true);
    expect(isRoomShapeAllowed('arcade', 'IH')).toBe(false);
    expect(isRoomShapeAllowed('library', '2x1')).toBe(false);
  });

  it('allows regular, double and 2x2 boss rooms but rejects corridor/L variants', () => {
    expect(getAllowedRoomShapes('boss')).toEqual(['1x1', '1x2', '2x1', '2x2']);
    expect(isRoomShapeAllowed('boss', '2x1')).toBe(true);
    expect(isRoomShapeAllowed('boss', 'LTL')).toBe(false);
    expect(isRoomShapeAllowed('boss', 'IIH')).toBe(false);
  });

  it('fixes the Black Market to its two-rooms-wide footprint', () => {
    expect(getAllowedRoomShapes('black-market')).toEqual(['2x1']);
    expect(getDefaultRoomShape('black-market')).toBe('2x1');
  });

  it.each([
    'start',
    'shop',
    'treasure',
    'miniboss',
    'secret',
    'super-secret',
    'ultra-secret',
    'curse',
    'challenge',
    'boss-challenge',
    'sacrifice',
    'dice',
    'bedroom',
    'dirty-bedroom',
    'chest-room',
    'mirror',
    'rails',
    'red-treasure',
    'silver-treasure',
    'teleporter',
    'devil',
    'angel',
    'error',
    'blue',
    'red',
    'secret-exit',
  ] as const)('keeps %s at its vanilla 1x1 footprint', (type) => {
    expect(getAllowedRoomShapes(type)).toEqual(['1x1']);
    expect(isRoomShapeAllowed(type, '2x1')).toBe(false);
  });
});
