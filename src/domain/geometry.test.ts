import { describe, expect, it } from 'vitest';
import {
  canPlaceRoom,
  getDragRoomPlacement,
  getRoomCells,
  getShapeBounds,
  getShapeVisualCenter,
  gridIndex,
} from './geometry';
import type { Room } from './types';

const room = (overrides: Partial<Room> = {}): Room => ({
  id: 'room-a',
  anchor: { x: 6, y: 6 },
  shape: '1x1',
  type: 'normal',
  visited: false,
  notes: '',
  pickups: [],
  ...overrides,
});

describe('Isaac level geometry', () => {
  it('maps the centered 13x13 cell to grid index 84', () => {
    expect(gridIndex({ x: 6, y: 6 })).toBe(84);
  });

  it('uses three occupied cells for L rooms', () => {
    expect(getRoomCells(room({ shape: 'LTL' }))).toHaveLength(3);
  });

  it('reports the visual bounds of large and L rooms', () => {
    expect(getShapeBounds('1x1')).toEqual({ width: 1, height: 1 });
    expect(getShapeBounds('1x2')).toEqual({ width: 1, height: 2 });
    expect(getShapeBounds('2x1')).toEqual({ width: 2, height: 1 });
    expect(getShapeBounds('LTL')).toEqual({ width: 2, height: 2 });
  });

  it('centers an L-room icon over occupied cells rather than the missing corner', () => {
    const center = getShapeVisualCenter('LTL');
    expect(center.x).toBeGreaterThan(1);
    expect(center.y).toBeGreaterThan(1);
  });

  it('derives rectangular Isaac room shapes from pointer drags in either direction', () => {
    expect(getDragRoomPlacement({ x: 4, y: 4 }, { x: 4, y: 4 })).toMatchObject({
      anchor: { x: 4, y: 4 },
      shape: '1x1',
    });
    expect(getDragRoomPlacement({ x: 4, y: 4 }, { x: 5, y: 4 })).toMatchObject({
      anchor: { x: 4, y: 4 },
      shape: '2x1',
    });
    expect(getDragRoomPlacement({ x: 5, y: 5 }, { x: 5, y: 4 })).toMatchObject({
      anchor: { x: 5, y: 4 },
      shape: '1x2',
    });
    expect(getDragRoomPlacement({ x: 5, y: 5 }, { x: 4, y: 4 })).toMatchObject({
      anchor: { x: 4, y: 4 },
      shape: '2x2',
    });
  });

  it('rejects pointer selections larger than Isaac room footprints', () => {
    expect(getDragRoomPlacement({ x: 3, y: 3 }, { x: 5, y: 3 })).toBeNull();
    expect(getDragRoomPlacement({ x: 3, y: 3 }, { x: 4, y: 5 })).toBeNull();
  });

  it('rejects a 2x2 room that crosses the 13x13 boundary', () => {
    expect(canPlaceRoom([], room({ anchor: { x: 12, y: 12 }, shape: '2x2' }))).toBe(false);
  });

  it('rejects overlap with an existing room', () => {
    const existing = room({ id: 'existing', anchor: { x: 4, y: 4 }, shape: '2x1' });
    const candidate = room({ id: 'candidate', anchor: { x: 5, y: 4 } });
    expect(canPlaceRoom([existing], candidate)).toBe(false);
  });

  it('allows resizing a room when ignoring its own footprint', () => {
    const existing = room({ id: 'existing', anchor: { x: 4, y: 4 } });
    const resized = room({ id: 'existing', anchor: { x: 4, y: 4 }, shape: '2x1' });
    expect(canPlaceRoom([existing], resized, existing.id)).toBe(true);
  });
});
