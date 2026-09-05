export const GRID_SIZE = 13;

export type DimensionId = 'main' | 'secondary' | 'death-certificate';

export type RoomShapeId =
  | '1x1'
  | 'IH'
  | 'IV'
  | '1x2'
  | 'IIV'
  | '2x1'
  | 'IIH'
  | '2x2'
  | 'LTL'
  | 'LTR'
  | 'LBL'
  | 'LBR';

export type RoomTypeId =
  | 'normal'
  | 'start'
  | 'shop'
  | 'treasure'
  | 'boss'
  | 'miniboss'
  | 'secret'
  | 'super-secret'
  | 'ultra-secret'
  | 'arcade'
  | 'curse'
  | 'challenge'
  | 'boss-challenge'
  | 'library'
  | 'sacrifice'
  | 'dice'
  | 'planetarium'
  | 'bedroom'
  | 'devil'
  | 'angel'
  | 'black-market'
  | 'error'
  | 'blue'
  | 'red'
  | 'secret-exit'
  | 'other';

export type PickupKind =
  | 'coin'
  | 'key'
  | 'bomb'
  | 'heart'
  | 'chest'
  | 'sack'
  | 'battery'
  | 'card'
  | 'pill'
  | 'rune'
  | 'trinket'
  | 'collectible'
  | 'other';

export interface GridPoint {
  x: number;
  y: number;
}

export interface Pickup {
  id: string;
  kind: PickupKind;
  label: string;
  quantity: number;
  notes?: string;
}

export interface Room {
  id: string;
  anchor: GridPoint;
  shape: RoomShapeId;
  type: RoomTypeId;
  visited: boolean;
  notes: string;
  pickups: Pickup[];
}

export interface TrackerDocument {
  version: 1;
  id: string;
  name: string;
  floor: string;
  seed: string;
  createdAt: string;
  updatedAt: string;
  dimensions: Record<DimensionId, Room[]>;
}
