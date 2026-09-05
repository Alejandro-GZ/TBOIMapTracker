import type { PickupKind, RoomTypeId } from './types';

export const MINIMAP_ICON_ATLAS_URL = new URL('../assets/minimap-icons.png', import.meta.url).href;
export const MINIMAP_ICON_CELL = 12;
export const MINIMAP_ICON_ATLAS_COLUMNS = 10;
export const MINIMAP_ICON_ATLAS_WIDTH = 120;
export const MINIMAP_ICON_ATLAS_HEIGHT = 108;

export const MINIMAP_ICON_ORDER = [
  'P_ADAPTIVEHEART','P_BATTERY','P_BIGCHEST','P_BLACKSACK','P_BOMB','P_BONEHEART','P_CARD','P_CHARGEDKEY','P_CHEST','P_CHESTALT',
  'P_DIME','P_ETERNALHEART','P_FULLDEVILHEART','P_FULLHEART','P_FULLSOULHEART','P_GOLDCHEST','P_GOLDCHESTALT','P_GOLDENBATTERY','P_GOLDENBOMB','P_GOLDENHEART',
  'P_GOLDENKEY','P_GOLDENPILL','P_HALFHEART','P_HALFSOULHEART','P_ITEM','P_KEY','P_MOMCHEST','P_NICKEL','P_PENNY','P_PILL',
  'P_POCKERCHIP','P_REDCHEST','P_REDCHESTALT','P_ROTTENHEART','P_RUNE','P_SACK','P_SILVERCHEST','P_SPIKECHEST','P_STONECHEST','P_TRINKET',
  'P_WOODCHEST','P_WOODCHESTALT','R_ANGEL','R_ARCADE','R_BARREN','R_BCHALLENGE','R_BOSS','R_CHEST','R_CRAWLSPACE','R_CURSE',
  'R_DEVIL','R_DICE','R_ERROR','R_ISAACS','R_LIBRARY','R_MINIBOSS','R_MIRROR','R_NCHALLENGE','R_NORMAL','R_PLANETARIUM',
  'R_RAILS','R_RTREASURE','R_SACRIFICE','R_SECRET','R_SHOP','R_START','R_STREASURE','R_SUPERSECRET','R_TELEPORTER','R_TREASURE',
  'R_ULTRASECRET','R_UNKNOWN','S_BEGGAR','S_BLOODDONATION','S_BOMBBEGGAR','S_CHARGEBEGGAR','S_CONFESIONARY','S_CRANE','S_DONATION','S_DRESSER',
  'S_EVILBEGGAR','S_FORTUNETELLER','S_GOLDENCOIN','S_KEYBEGGAR','S_POOP','S_REROLL','S_ROTTENBEGGAR','S_SLOT',
] as const;

export type MinimapIconId = typeof MINIMAP_ICON_ORDER[number];

export const getMinimapIconIndex = (id: MinimapIconId) => MINIMAP_ICON_ORDER.indexOf(id);

export const ROOM_ICON_BY_TYPE: Partial<Record<RoomTypeId, MinimapIconId>> = {
  normal: 'R_NORMAL', start: 'R_START', shop: 'R_SHOP', treasure: 'R_TREASURE', boss: 'R_BOSS', miniboss: 'R_MINIBOSS',
  secret: 'R_SECRET', 'super-secret': 'R_SUPERSECRET', 'ultra-secret': 'R_ULTRASECRET', arcade: 'R_ARCADE', curse: 'R_CURSE',
  challenge: 'R_NCHALLENGE', 'boss-challenge': 'R_BCHALLENGE', library: 'R_LIBRARY', sacrifice: 'R_SACRIFICE', dice: 'R_DICE',
  planetarium: 'R_PLANETARIUM', bedroom: 'R_ISAACS', devil: 'R_DEVIL', angel: 'R_ANGEL', error: 'R_ERROR',
  blue: 'R_NORMAL', red: 'R_NORMAL', 'black-market': 'R_SHOP', 'secret-exit': 'R_CRAWLSPACE', other: 'R_UNKNOWN',
};

/** Palette/inspector still show a key for these rooms, but the real minimap
 * view communicates them through the room body itself and should not draw a
 * central type icon. */
export const ROOM_TYPES_WITHOUT_MAP_ICON: readonly RoomTypeId[] = ['normal', 'blue', 'red'];

export const ROOM_ICON_VARIANT_CLASS: Partial<Record<RoomTypeId, string>> = {
  blue: 'isaac-room-type-blue', red: 'isaac-room-type-red', 'black-market': 'isaac-room-type-black-market',
};

export const DEFAULT_PICKUP_ICON_BY_KIND: Partial<Record<PickupKind, MinimapIconId>> = {
  coin: 'P_PENNY', key: 'P_KEY', bomb: 'P_BOMB', heart: 'P_FULLHEART', chest: 'P_CHEST', sack: 'P_SACK',
  battery: 'P_BATTERY', card: 'P_CARD', pill: 'P_PILL', rune: 'P_RUNE', trinket: 'P_TRINKET', collectible: 'P_ITEM',
};

export interface TrackableMarker {
  id: MinimapIconId;
  label: string;
  category: 'pickup' | 'structure';
  kind: PickupKind;
  mapIcon?: MinimapIconId;
}

export const TRACKABLE_MARKERS: TrackableMarker[] = [
  { id: 'P_ADAPTIVEHEART', label: 'Blended Heart', category: 'pickup', kind: 'heart' },
  { id: 'P_BATTERY', label: "Lil' Battery", category: 'pickup', kind: 'battery' },
  { id: 'P_BIGCHEST', label: 'Mega Chest', category: 'pickup', kind: 'chest' },
  { id: 'P_BLACKSACK', label: 'Black Sack', category: 'pickup', kind: 'sack' },
  { id: 'P_BOMB', label: 'Bomb', category: 'pickup', kind: 'bomb' },
  { id: 'P_BONEHEART', label: 'Bone Heart', category: 'pickup', kind: 'heart' },
  { id: 'P_CARD', label: 'Card', category: 'pickup', kind: 'card' },
  { id: 'P_CHARGEDKEY', label: 'Charged Key', category: 'pickup', kind: 'key' },
  { id: 'P_CHEST', label: 'Chest', category: 'pickup', kind: 'chest', mapIcon: 'P_CHESTALT' },
  { id: 'P_DIME', label: 'Dime', category: 'pickup', kind: 'coin' },
  { id: 'P_ETERNALHEART', label: 'Eternal Heart', category: 'pickup', kind: 'heart' },
  { id: 'P_FULLDEVILHEART', label: 'Black Heart', category: 'pickup', kind: 'heart' },
  { id: 'P_FULLHEART', label: 'Red Heart', category: 'pickup', kind: 'heart' },
  { id: 'P_FULLSOULHEART', label: 'Soul Heart', category: 'pickup', kind: 'heart' },
  { id: 'P_GOLDCHEST', label: 'Locked Chest', category: 'pickup', kind: 'chest', mapIcon: 'P_GOLDCHESTALT' },
  { id: 'P_GOLDENBATTERY', label: 'Golden Battery', category: 'pickup', kind: 'battery' },
  { id: 'P_GOLDENBOMB', label: 'Golden Bomb', category: 'pickup', kind: 'bomb' },
  { id: 'P_GOLDENHEART', label: 'Golden Heart', category: 'pickup', kind: 'heart' },
  { id: 'P_GOLDENKEY', label: 'Golden Key', category: 'pickup', kind: 'key' },
  { id: 'P_GOLDENPILL', label: 'Golden Pill', category: 'pickup', kind: 'pill' },
  { id: 'P_HALFHEART', label: 'Half Red Heart', category: 'pickup', kind: 'heart' },
  { id: 'P_HALFSOULHEART', label: 'Half Soul Heart', category: 'pickup', kind: 'heart' },
  { id: 'P_ITEM', label: 'Collectible / pedestal', category: 'pickup', kind: 'collectible' },
  { id: 'P_KEY', label: 'Key', category: 'pickup', kind: 'key' },
  { id: 'P_MOMCHEST', label: "Mom's Chest", category: 'pickup', kind: 'chest' },
  { id: 'P_NICKEL', label: 'Nickel', category: 'pickup', kind: 'coin' },
  { id: 'P_PENNY', label: 'Penny', category: 'pickup', kind: 'coin' },
  { id: 'P_PILL', label: 'Pill', category: 'pickup', kind: 'pill' },
  { id: 'P_POCKERCHIP', label: 'Poker Chip', category: 'pickup', kind: 'trinket' },
  { id: 'P_REDCHEST', label: 'Red Chest', category: 'pickup', kind: 'chest', mapIcon: 'P_REDCHESTALT' },
  { id: 'P_ROTTENHEART', label: 'Rotten Heart', category: 'pickup', kind: 'heart' },
  { id: 'P_RUNE', label: 'Rune', category: 'pickup', kind: 'rune' },
  { id: 'P_SACK', label: 'Sack', category: 'pickup', kind: 'sack' },
  { id: 'P_SILVERCHEST', label: 'Eternal Chest', category: 'pickup', kind: 'chest' },
  { id: 'P_SPIKECHEST', label: 'Spiked Chest', category: 'pickup', kind: 'chest' },
  { id: 'P_STONECHEST', label: 'Stone Chest', category: 'pickup', kind: 'chest' },
  { id: 'P_TRINKET', label: 'Trinket', category: 'pickup', kind: 'trinket' },
  { id: 'P_WOODCHEST', label: 'Wooden Chest', category: 'pickup', kind: 'chest', mapIcon: 'P_WOODCHESTALT' },
  { id: 'S_GOLDENCOIN', label: 'Golden Penny', category: 'pickup', kind: 'coin' },
  { id: 'S_BEGGAR', label: 'Beggar', category: 'structure', kind: 'other' },
  { id: 'S_BLOODDONATION', label: 'Blood Donation Machine', category: 'structure', kind: 'other' },
  { id: 'S_BOMBBEGGAR', label: 'Bomb Bum', category: 'structure', kind: 'other' },
  { id: 'S_CHARGEBEGGAR', label: 'Battery Bum', category: 'structure', kind: 'other' },
  { id: 'S_CONFESIONARY', label: 'Confessional', category: 'structure', kind: 'other' },
  { id: 'S_CRANE', label: 'Crane Game', category: 'structure', kind: 'other' },
  { id: 'S_DONATION', label: 'Donation Machine', category: 'structure', kind: 'other' },
  { id: 'S_DRESSER', label: "Mom's Dressing Table", category: 'structure', kind: 'other' },
  { id: 'S_EVILBEGGAR', label: 'Devil Beggar', category: 'structure', kind: 'other' },
  { id: 'S_FORTUNETELLER', label: 'Fortune Telling Machine', category: 'structure', kind: 'other' },
  { id: 'S_KEYBEGGAR', label: 'Key Master', category: 'structure', kind: 'other' },
  { id: 'S_POOP', label: 'Poop', category: 'structure', kind: 'other' },
  { id: 'S_REROLL', label: 'Reroll Machine', category: 'structure', kind: 'other' },
  { id: 'S_ROTTENBEGGAR', label: 'Rotten Beggar', category: 'structure', kind: 'other' },
  { id: 'S_SLOT', label: 'Slot Machine', category: 'structure', kind: 'other' },
];

export const TRACKABLE_MARKER_BY_ID = Object.fromEntries(TRACKABLE_MARKERS.map((marker) => [marker.id, marker])) as Partial<Record<MinimapIconId, TrackableMarker>>;
