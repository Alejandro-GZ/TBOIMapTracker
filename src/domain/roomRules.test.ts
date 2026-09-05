import { describe, expect, it } from 'vitest';
import { getAllowedRoomShapes, getDefaultRoomShape, isRoomShapeAllowed } from './roomRules';

const ALL_SHAPES = [
  '1x1', 'IH', 'IV', '1x2', 'IIV', '2x1', 'IIH', '2x2', 'LTL', 'LTR', 'LBL', 'LBR',
];

describe('vanilla room shape rules', () => {
  it('keeps normal and other rooms unrestricted', () => {
    expect(getAllowedRoomShapes('normal')).toEqual(ALL_SHAPES);
    expect(getAllowedRoomShapes('other')).toEqual(ALL_SHAPES);
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
    'arcade',
    'curse',
    'challenge',
    'boss-challenge',
    'library',
    'sacrifice',
    'dice',
    'planetarium',
    'bedroom',
    'devil',
    'angel',
    'error',
    'blue',
    'red',
    'secret-exit',
  ] as const)('keeps %s at 1x1', (type) => {
    expect(getAllowedRoomShapes(type)).toEqual(['1x1']);
    expect(isRoomShapeAllowed(type, '2x1')).toBe(false);
  });
});
