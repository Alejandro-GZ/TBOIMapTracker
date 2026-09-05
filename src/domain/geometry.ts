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

export const getShapeBounds = (shape: RoomShapeId) => {
  const offsets = SHAPE_OFFSETS[shape];
  return {
    width: Math.max(...offsets.map((point) => point.x)) + 1,
    height: Math.max(...offsets.map((point) => point.y)) + 1,
  };
};

/**
 * Visual center in cell units. For L rooms this is the centroid of the three
 * occupied cells rather than the center of the 2×2 bounding box, so room icons
 * never sit in the missing quadrant.
 */
export const getShapeVisualCenter = (shape: RoomShapeId) => {
  const offsets = SHAPE_OFFSETS[shape];
  const count = offsets.length;
  return {
    x: offsets.reduce((sum, point) => sum + point.x + 0.5, 0) / count,
    y: offsets.reduce((sum, point) => sum + point.y + 0.5, 0) / count,
  };
};

export const getRoomCells = (room: Pick<Room, 'anchor' | 'shape'>): GridPoint[] =>
  SHAPE_OFFSETS[room.shape].map(({ x, y }) => ({
    x: room.anchor.x + x,
    y: room.anchor.y + y,
  }));

export const isInsideGrid = ({ x, y }: GridPoint) =>
  x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE;

export const gridIndex = ({ x, y }: GridPoint) => y * GRID_SIZE + x;

export type DragRoomShape = Extract<
  RoomShapeId,
  '1x1' | '1x2' | '2x1' | '2x2' | 'LTL' | 'LTR' | 'LBL' | 'LBR'
>;

export interface DragRoomPlacement {
  anchor: GridPoint;
  shape: DragRoomShape;
  width: number;
  height: number;
}

const uniqueDragPoints = (points: GridPoint[]) => {
  const seen = new Set<string>();
  const unique: GridPoint[] = [];
  for (const point of points) {
    const key = coordinateKey(point);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(point);
  }
  return unique;
};

/**
 * Infer an Isaac room footprint from the cells the pointer actually travelled
 * through. Three occupied cells in a 2×2 box become the matching L variant;
 * visiting all four cells becomes a 2×2. A direct diagonal from one corner to
 * the other also remains a convenient 2×2 gesture when no intermediate cell
 * was entered by the pointer.
 */
export const getDragRoomPlacementFromPath = (points: GridPoint[]): DragRoomPlacement | null => {
  const unique = uniqueDragPoints(points);
  if (unique.length === 0 || unique.length > 4) return null;

  const minX = Math.min(...unique.map((point) => point.x));
  const maxX = Math.max(...unique.map((point) => point.x));
  const minY = Math.min(...unique.map((point) => point.y));
  const maxY = Math.max(...unique.map((point) => point.y));
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  if (width > 2 || height > 2) return null;

  const anchor = { x: minX, y: minY };
  const keys = new Set(unique.map(coordinateKey));

  if (unique.length === 1) {
    return { anchor, shape: '1x1', width: 1, height: 1 };
  }

  if (unique.length === 2) {
    if (width === 2 && height === 1) return { anchor, shape: '2x1', width, height };
    if (width === 1 && height === 2) return { anchor, shape: '1x2', width, height };
    if (width === 2 && height === 2) return { anchor, shape: '2x2', width, height };
    return null;
  }

  if (unique.length === 3 && width === 2 && height === 2) {
    const topLeft = coordinateKey({ x: minX, y: minY });
    const topRight = coordinateKey({ x: maxX, y: minY });
    const bottomLeft = coordinateKey({ x: minX, y: maxY });
    const bottomRight = coordinateKey({ x: maxX, y: maxY });

    const shape: DragRoomShape | null = !keys.has(topLeft)
      ? 'LTL'
      : !keys.has(topRight)
        ? 'LTR'
        : !keys.has(bottomLeft)
          ? 'LBL'
          : !keys.has(bottomRight)
            ? 'LBR'
            : null;

    return shape ? { anchor, shape, width, height } : null;
  }

  if (unique.length === 4 && width === 2 && height === 2) {
    const coversWholeBox = [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: minX, y: maxY },
      { x: maxX, y: maxY },
    ].every((point) => keys.has(coordinateKey(point)));
    return coversWholeBox ? { anchor, shape: '2x2', width, height } : null;
  }

  return null;
};

/**
 * Backwards-compatible rectangular helper used by existing callers/tests.
 * New pointer UI uses `getDragRoomPlacementFromPath` so it can express L rooms.
 */
export const getDragRoomPlacement = (
  start: GridPoint,
  end: GridPoint,
): DragRoomPlacement | null => {
  const minX = Math.min(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x) + 1;
  const height = Math.abs(end.y - start.y) + 1;

  if (width > 2 || height > 2) return null;

  const shape: DragRoomShape = width === 1 && height === 1
    ? '1x1'
    : width === 1
      ? '1x2'
      : height === 1
        ? '2x1'
        : '2x2';

  return {
    anchor: { x: minX, y: minY },
    shape,
    width,
    height,
  };
};

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

export interface RoomConnection {
  point: GridPoint;
  direction: 'right' | 'down';
  roomA: string;
  roomB: string;
}

/**
 * Every boundary where two distinct room footprints touch is a visual minimap
 * connection. Internal boundaries inside a multi-cell room are intentionally
 * ignored. Keeping this as geometry (instead of CSS generated from hit cells)
 * makes doors testable and lets the interaction grid stay completely invisible.
 */
export const getRoomConnections = (rooms: Room[]): RoomConnection[] => {
  const occupancy = buildOccupancy(rooms);
  const result: RoomConnection[] = [];

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const room = occupancy.get(coordinateKey({ x, y }));
      if (!room) continue;

      const right = occupancy.get(coordinateKey({ x: x + 1, y }));
      if (right && right.id !== room.id) {
        result.push({ point: { x, y }, direction: 'right', roomA: room.id, roomB: right.id });
      }

      const down = occupancy.get(coordinateKey({ x, y: y + 1 }));
      if (down && down.id !== room.id) {
        result.push({ point: { x, y }, direction: 'down', roomA: room.id, roomB: down.id });
      }
    }
  }

  return result;
};
