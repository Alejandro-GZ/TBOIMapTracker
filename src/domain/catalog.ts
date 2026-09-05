import type { PickupKind, RoomShapeId, RoomTypeId } from './types';

export interface RoomTypeMeta {
  id: RoomTypeId;
  label: string;
  icon: string;
  tone: string;
  group: 'core' | 'special' | 'hidden';
  offGrid?: boolean;
}

export const ROOM_TYPES: RoomTypeMeta[] = [
  { id: 'normal', label: 'Normal', icon: '·', tone: 'neutral', group: 'core' },
  { id: 'start', label: 'Starting room', icon: '⌂', tone: 'start', group: 'core' },
  { id: 'treasure', label: 'Treasure room', icon: '★', tone: 'gold', group: 'core' },
  { id: 'shop', label: 'Shop', icon: '$', tone: 'shop', group: 'core' },
  { id: 'boss', label: 'Boss', icon: '♛', tone: 'boss', group: 'core' },
  { id: 'miniboss', label: 'Miniboss', icon: '!', tone: 'boss', group: 'core' },
  { id: 'curse', label: 'Curse room', icon: '☠', tone: 'curse', group: 'special' },
  { id: 'sacrifice', label: 'Sacrifice room', icon: '†', tone: 'sacrifice', group: 'special' },
  { id: 'arcade', label: 'Arcade', icon: '7', tone: 'arcade', group: 'special' },
  { id: 'library', label: 'Library', icon: '≡', tone: 'library', group: 'special' },
  { id: 'challenge', label: 'Challenge room', icon: '⚔', tone: 'challenge', group: 'special' },
  { id: 'boss-challenge', label: 'Boss challenge', icon: '⚔+', tone: 'boss', group: 'special' },
  { id: 'dice', label: 'Dice room', icon: '⚄', tone: 'dice', group: 'special' },
  { id: 'planetarium', label: 'Planetarium', icon: '☾', tone: 'planetarium', group: 'special' },
  { id: 'bedroom', label: 'Bedroom', icon: 'Z', tone: 'bedroom', group: 'special' },
  { id: 'secret', label: 'Secret room', icon: '?', tone: 'secret', group: 'hidden' },
  { id: 'super-secret', label: 'Super secret', icon: '??', tone: 'secret', group: 'hidden' },
  { id: 'ultra-secret', label: 'Ultra secret', icon: '✦', tone: 'ultra', group: 'hidden' },
  { id: 'blue', label: 'Blue room', icon: 'B', tone: 'blue', group: 'hidden' },
  { id: 'red', label: 'Red room', icon: 'R', tone: 'red', group: 'hidden' },
  { id: 'secret-exit', label: 'Secret exit', icon: '↘', tone: 'secret', group: 'hidden' },
  { id: 'devil', label: 'Devil room', icon: '▼', tone: 'devil', group: 'hidden', offGrid: true },
  { id: 'angel', label: 'Angel room', icon: '△', tone: 'angel', group: 'hidden', offGrid: true },
  { id: 'black-market', label: 'Black market', icon: '$?', tone: 'shop', group: 'hidden', offGrid: true },
  { id: 'error', label: 'I AM ERROR', icon: 'ERR', tone: 'error', group: 'hidden', offGrid: true },
  { id: 'other', label: 'Other', icon: '•', tone: 'neutral', group: 'hidden' },
];

export const ROOM_SHAPES: Array<{ id: RoomShapeId; label: string; footprint: string }> = [
  { id: '1x1', label: '1×1', footprint: 'single cell' },
  { id: 'IH', label: 'I-H', footprint: 'narrow horizontal, 1 cell' },
  { id: 'IV', label: 'I-V', footprint: 'narrow vertical, 1 cell' },
  { id: '1x2', label: '1×2', footprint: '2 cells vertical' },
  { id: 'IIV', label: 'II-V', footprint: 'narrow, 2 cells vertical' },
  { id: '2x1', label: '2×1', footprint: '2 cells horizontal' },
  { id: 'IIH', label: 'II-H', footprint: 'narrow, 2 cells horizontal' },
  { id: '2x2', label: '2×2', footprint: '4 cells' },
  { id: 'LTL', label: 'L · missing TL', footprint: '3 cells' },
  { id: 'LTR', label: 'L · missing TR', footprint: '3 cells' },
  { id: 'LBL', label: 'L · missing BL', footprint: '3 cells' },
  { id: 'LBR', label: 'L · missing BR', footprint: '3 cells' },
];

export const DIMENSIONS = [
  { id: 'main' as const, label: 'Main', short: '0' },
  { id: 'secondary' as const, label: 'Secondary', short: '1' },
  { id: 'death-certificate' as const, label: 'Death Certificate', short: '2' },
];

export const PICKUP_META: Record<PickupKind, { label: string; icon: string }> = {
  coin: { label: 'Coin', icon: '¢' },
  key: { label: 'Key', icon: '⚿' },
  bomb: { label: 'Bomb', icon: '●' },
  heart: { label: 'Heart', icon: '♥' },
  chest: { label: 'Chest', icon: '▣' },
  sack: { label: 'Sack', icon: '◒' },
  battery: { label: 'Battery', icon: '▥' },
  card: { label: 'Card', icon: '▤' },
  pill: { label: 'Pill', icon: '◐' },
  rune: { label: 'Rune', icon: '◇' },
  trinket: { label: 'Trinket', icon: '⌁' },
  collectible: { label: 'Collectible', icon: '★' },
  other: { label: 'Other', icon: '•' },
};

export const getRoomTypeMeta = (id: RoomTypeId) =>
  ROOM_TYPES.find((roomType) => roomType.id === id) ?? ROOM_TYPES[0];
