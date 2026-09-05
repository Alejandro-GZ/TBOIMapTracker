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
 * room as a normal room. The seven additional MiniMAPI room concepts exposed
 * by the tracker are represented as single rooms: Dirty Bedroom, Chest Room,
 * Mirror Room, Rails Room, Red/Silver Treasure Rooms and Teleporter Room.
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
  'dirty-bedroom': SINGLE_ROOM,
  'chest-room': SINGLE_ROOM,
  mirror: SINGLE_ROOM,
  rails: SINGLE_ROOM,
  'red-treasure': SINGLE_ROOM,
  'silver-treasure': SINGLE_ROOM,
  teleporter: SINGLE_ROOM,
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
