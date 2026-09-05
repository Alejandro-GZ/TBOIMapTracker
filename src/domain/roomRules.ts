import type { RoomShapeId, RoomTypeId } from './types';

const ALL_SHAPES: readonly RoomShapeId[] = [
  '1x1',
  'IH',
  'IV',
  '1x2',
  'IIV',
  '2x1',
  'IIH',
  '2x2',
  'LTL',
  'LTR',
  'LBL',
  'LBR',
];

const SINGLE_ROOM: readonly RoomShapeId[] = ['1x1'];
const BOSS_SHAPES: readonly RoomShapeId[] = ['1x1', '1x2', '2x1', '2x2'];
const BLACK_MARKET_SHAPES: readonly RoomShapeId[] = ['2x1'];
const PLANETARIUM_SHAPES: readonly RoomShapeId[] = ['1x1', 'IH', 'IV'];
const VERTICAL_CLOSET_SHAPES: readonly RoomShapeId[] = ['1x1', 'IV'];

/**
 * RoomType -> RoomShape validity for vanilla/Repentance+ layouts.
 *
 * Keep this table deliberately data-driven rather than treating every special
 * room as a normal room. Evidence used when defining the non-1x1 exceptions:
 *
 * - Planetarium has dedicated 1x1, IH and IV backdrop variants and the wiki
 *   explicitly documents closet-sized Planetarium layouts.
 * - Library has a documented closet-sized layout; the vanilla layout is the
 *   vertical closet form (IV).
 * - Arcade has vanilla narrow vertical layouts in addition to standard 1x1.
 * - Boss rooms retain the large rectangular arenas already supported here.
 * - Black Market is the canonical two-rooms-wide special room.
 *
 * Curse, Challenge/Boss Challenge, Sacrifice, Dice and Bedroom layouts in the
 * vanilla room pools are standard 1x1 rooms. They must not inherit arbitrary
 * L/large shapes simply because those shapes exist for normal rooms.
 */
export const ROOM_TYPE_ALLOWED_SHAPES: Record<RoomTypeId, readonly RoomShapeId[]> = {
  normal: ALL_SHAPES,
  start: SINGLE_ROOM,
  shop: SINGLE_ROOM,
  treasure: SINGLE_ROOM,
  boss: BOSS_SHAPES,
  miniboss: SINGLE_ROOM,
  secret: SINGLE_ROOM,
  'super-secret': SINGLE_ROOM,
  'ultra-secret': SINGLE_ROOM,
  arcade: VERTICAL_CLOSET_SHAPES,
  curse: SINGLE_ROOM,
  challenge: SINGLE_ROOM,
  'boss-challenge': SINGLE_ROOM,
  library: VERTICAL_CLOSET_SHAPES,
  sacrifice: SINGLE_ROOM,
  dice: SINGLE_ROOM,
  planetarium: PLANETARIUM_SHAPES,
  bedroom: SINGLE_ROOM,
  devil: SINGLE_ROOM,
  angel: SINGLE_ROOM,
  'black-market': BLACK_MARKET_SHAPES,
  error: SINGLE_ROOM,
  blue: SINGLE_ROOM,
  red: SINGLE_ROOM,
  'secret-exit': SINGLE_ROOM,
  other: ALL_SHAPES,
};

export const getAllowedRoomShapes = (type: RoomTypeId) => ROOM_TYPE_ALLOWED_SHAPES[type];

export const isRoomShapeAllowed = (type: RoomTypeId, shape: RoomShapeId) =>
  ROOM_TYPE_ALLOWED_SHAPES[type].includes(shape);

export const getDefaultRoomShape = (type: RoomTypeId): RoomShapeId =>
  ROOM_TYPE_ALLOWED_SHAPES[type][0];
