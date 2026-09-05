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

/**
 * Shape validity for the vanilla-style tracker.
 *
 * Normal rooms are the only regular floor rooms that use the full RoomShape
 * catalogue. Named special rooms are fixed to their vanilla minimap footprint,
 * with the notable exceptions of boss rooms (regular/double/2x2 arenas) and
 * the two-rooms-wide Black Market. `other` intentionally remains unrestricted
 * as an escape hatch for unusual scripted rooms.
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
  arcade: SINGLE_ROOM,
  curse: SINGLE_ROOM,
  challenge: SINGLE_ROOM,
  'boss-challenge': SINGLE_ROOM,
  library: SINGLE_ROOM,
  sacrifice: SINGLE_ROOM,
  dice: SINGLE_ROOM,
  planetarium: SINGLE_ROOM,
  bedroom: SINGLE_ROOM,
  devil: SINGLE_ROOM,
  angel: SINGLE_ROOM,
  'black-market': BLACK_MARKET_SHAPES,
  error: SINGLE_ROOM,
  blue: SINGLE_ROOM,
  'secret-exit': SINGLE_ROOM,
  other: ALL_SHAPES,
};

export const getAllowedRoomShapes = (type: RoomTypeId) => ROOM_TYPE_ALLOWED_SHAPES[type];

export const isRoomShapeAllowed = (type: RoomTypeId, shape: RoomShapeId) =>
  ROOM_TYPE_ALLOWED_SHAPES[type].includes(shape);

export const getDefaultRoomShape = (type: RoomTypeId): RoomShapeId =>
  ROOM_TYPE_ALLOWED_SHAPES[type][0];
