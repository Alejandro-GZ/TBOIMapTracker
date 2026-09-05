import type { DimensionId, Room, TrackerDocument } from './types';

const DIMENSION_IDS: DimensionId[] = ['main', 'secondary', 'death-certificate'];

const looksLikeRoom = (value: unknown): value is Room => {
  if (!value || typeof value !== 'object') return false;
  const room = value as Partial<Room>;
  return (
    typeof room.id === 'string' &&
    typeof room.type === 'string' &&
    typeof room.shape === 'string' &&
    typeof room.anchor?.x === 'number' &&
    typeof room.anchor?.y === 'number' &&
    Array.isArray(room.pickups)
  );
};

export const parseTrackerDocument = (raw: string): TrackerDocument => {
  const value = JSON.parse(raw) as Partial<TrackerDocument>;
  if (!value || value.version !== 1 || typeof value.id !== 'string') {
    throw new Error('Unsupported or invalid tracker file.');
  }
  if (!value.dimensions || typeof value.dimensions !== 'object') {
    throw new Error('The tracker file has no dimensions.');
  }

  for (const dimension of DIMENSION_IDS) {
    const rooms = value.dimensions[dimension];
    if (!Array.isArray(rooms) || !rooms.every(looksLikeRoom)) {
      throw new Error(`Invalid room data in dimension ${dimension}.`);
    }
  }

  return value as TrackerDocument;
};
