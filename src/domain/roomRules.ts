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
 * Tracker shape validity.
 *
 * The first implementation was deliberately conservative and forced almost
 * every named special room to 1x1. That is too restrictive for a layout
 * tracker: special-room data can use non-square/narrow/large layouts, and the
 * editor should not reject those footprints just because the room has a named
 * type. Curse Rooms, Planetariums and the other floor specials below therefore
 * use the complete RoomShape catalogue.
 *
 * Types whose minimap semantics are intrinsically fixed (start/secret/off-grid
 * transitions, coloured single rooms, etc.) remain constrained. Bosses keep
 * their regular large arenas and Black Market remains two rooms wide.
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
  arcade: ALL_SHAPES,
  curse: ALL_SHAPES,
  challenge: ALL_SHAPES,
  'boss-challenge': ALL_SHAPES,
  library: ALL_SHAPES,
  sacrifice: ALL_SHAPES,
  dice: ALL_SHAPES,
  planetarium: ALL_SHAPES,
  bedroom: ALL_SHAPES,
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
