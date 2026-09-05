import { GRID_SIZE, type GridPoint, type Room, type RoomShapeId } from './types';

const SHAPE_OFFSETS: Record<RoomShapeId, GridPoint[]> = {
  '1x1': [{ x: 0, y: 0 }],
  IH: [{ x: 0, y: 0 }],
  IV: [{ x: 0, y: 0 }],
  '1x2': [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
  ],
  IIV: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
  ],
  '2x1': [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ],
  IIH: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ],
  '2x2': [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  LTL: [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  LTR: [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  LBL: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ],
  LBR: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ],
};

export const coordinateKey = ({ x, y }: GridPoint) => `${x}:${y}`;

export const getShapeOffsets = (shape: RoomShapeId) => SHAPE_OFFSETS[shape];

export const getRoomCells = (room: Pick<Room, 'anchor' | 'shape'>): GridPoint[] =>
  SHAPE_OFFSETS[room.shape].map(({ x, y }) => ({
    x: room.anchor.x + x,
    y: room.anchor.y + y,
  }));

export const isInsideGrid = ({ x, y }: GridPoint) =>
  x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE;

export const gridIndex = ({ x, y }: GridPoint) => y * GRID_SIZE + x;

export const buildOccupancy = (rooms: Room[]) => {
  const result = new Map<string, Room>();
  for (const room of rooms) {
    for (const point of getRoomCells(room)) {
      result.set(coordinateKey(point), room);
    }
  }
  return result;
};

export const canPlaceRoom = (rooms: Room[], candidate: Room, ignoreRoomId?: string) => {
  const occupied = new Set<string>();
  for (const room of rooms) {
    if (room.id === ignoreRoomId) continue;
    for (const cell of getRoomCells(room)) occupied.add(coordinateKey(cell));
  }

  return getRoomCells(candidate).every(
    (cell) => isInsideGrid(cell) && !occupied.has(coordinateKey(cell)),
  );
};

export const countUniqueAdjacencies = (room: Room, rooms: Room[]) => {
  const occupancy = buildOccupancy(rooms);
  const neighbors = new Set<string>();
  const directions = [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
  ];

  for (const cell of getRoomCells(room)) {
    for (const direction of directions) {
      const other = occupancy.get(
        coordinateKey({ x: cell.x + direction.x, y: cell.y + direction.y }),
      );
      if (other && other.id !== room.id) neighbors.add(other.id);
    }
  }
  return neighbors.size;
};
