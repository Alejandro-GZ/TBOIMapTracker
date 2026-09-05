import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { getRoomTypeMeta } from '../domain/catalog';
import {
  buildOccupancy,
  coordinateKey,
  getDragRoomPlacement,
} from '../domain/geometry';
import { GRID_SIZE, type GridPoint } from '../domain/types';
import { useTrackerStore } from '../store/useTrackerStore';
import { MapDoorLayer } from './MapDoorLayer';
import { MapRoomVisual } from './MapRoomVisual';

interface DragSelection {
  start: GridPoint;
  end: GridPoint;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function MapGrid() {
  const document = useTrackerStore((state) => state.document);
  const activeDimension = useTrackerStore((state) => state.activeDimension);
  const selectedRoomId = useTrackerStore((state) => state.selectedRoomId);
  const showIndices = useTrackerStore((state) => state.showIndices);
  const addRoom = useTrackerStore((state) => state.addRoom);
  const moveRoom = useTrackerStore((state) => state.moveRoom);
  const selectRoom = useTrackerStore((state) => state.selectRoom);
  const [notice, setNotice] = useState('Click for 1×1. Drag across cells for larger rooms.');
  const [dragSelection, setDragSelection] = useState<DragSelection | null>(null);
  const [zoom, setZoom] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const viewportRef = useRef<HTMLDivElement>(null);

  const rooms = document.dimensions[activeDimension];
  const occupancy = useMemo(() => buildOccupancy(rooms), [rooms]);

  const dragPreview = useMemo(() => {
    if (!dragSelection) return null;

    const minX = Math.min(dragSelection.start.x, dragSelection.end.x);
    const maxX = Math.max(dragSelection.start.x, dragSelection.end.x);
    const minY = Math.min(dragSelection.start.y, dragSelection.end.y);
    const maxY = Math.max(dragSelection.start.y, dragSelection.end.y);
    const keys = new Set<string>();

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) keys.add(coordinateKey({ x, y }));
    }

    const placement = getDragRoomPlacement(dragSelection.start, dragSelection.end);
    const blocked = [...keys].some((key) => occupancy.has(key));

    return {
      keys,
      placement,
      invalid: !placement || blocked,
    };
  }, [dragSelection, occupancy]);

  useEffect(() => {
    const clearDanglingSelection = () => setDragSelection(null);
    window.addEventListener('pointerup', clearDanglingSelection);
    window.addEventListener('pointercancel', clearDanglingSelection);
    window.addEventListener('blur', clearDanglingSelection);
    return () => {
      window.removeEventListener('pointerup', clearDanglingSelection);
      window.removeEventListener('pointercancel', clearDanglingSelection);
      window.removeEventListener('blur', clearDanglingSelection);
    };
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      setZoomOrigin({
        x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
        y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
      });
      const factor = event.deltaY < 0 ? 1.1 : 0.9;
      setZoom((current) => clamp(current * factor, 0.65, 2.2));
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, []);

  const finishRoomGesture = (point: GridPoint) => {
    if (!dragSelection) return;

    const placement = getDragRoomPlacement(dragSelection.start, point);
    setDragSelection(null);

    if (!placement) {
      setNotice('Isaac rooms created by drag are at most 2×2 cells.');
      return;
    }

    const placed = addRoom(placement.anchor, placement.shape);
    setNotice(
      placed
        ? `${placement.shape} room placed at (${placement.anchor.x}, ${placement.anchor.y}).`
        : 'That room overlaps another room or leaves the 13×13 map.',
    );
  };

  const changeZoom = (next: number) => {
    setZoom(clamp(next, 0.65, 2.2));
  };

  const cells = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const point = { x, y };
      const key = coordinateKey(point);
      const room = occupancy.get(key);
      const meta = room ? getRoomTypeMeta(room.type) : null;
      const inDragPreview = Boolean(dragPreview?.keys.has(key));

      cells.push(
        <button
          type="button"
          key={`${x}-${y}`}
          data-testid={`map-cell-${x}-${y}`}
          data-grid-x={x}
          data-grid-y={y}
          className={[
            'grid-cell',
            room ? 'occupied' : 'empty',
            room?.id === selectedRoomId ? 'selected' : '',
            inDragPreview ? 'drag-preview' : '',
            inDragPreview && dragPreview?.invalid ? 'drag-invalid' : '',
          ].join(' ')}
          draggable={Boolean(room) && !dragSelection}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            if (room) {
              selectRoom(room.id);
              return;
            }
            event.preventDefault();
            setDragSelection({ start: point, end: point });
          }}
          onPointerEnter={(event) => {
            if (!dragSelection || (event.buttons & 1) === 0) return;
            setDragSelection((current) => current ? { ...current, end: point } : current);
          }}
          onPointerUp={(event) => {
            if (!dragSelection || event.button !== 0) return;
            event.preventDefault();
            finishRoomGesture(point);
          }}
          onDragStart={(event) => {
            if (!room) return;
            event.dataTransfer.setData('text/tboi-room', room.id);
            event.dataTransfer.effectAllowed = 'move';
            selectRoom(room.id);
          }}
          onDragOver={(event) => {
            if (event.dataTransfer.types.includes('text/tboi-room')) event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            const roomId = event.dataTransfer.getData('text/tboi-room');
            if (!roomId) return;
            const moved = moveRoom(roomId, point);
            setNotice(moved ? `Room moved to (${point.x}, ${point.y}).` : 'That move is not possible here.');
          }}
          onClick={() => {
            if (!room) return;
            selectRoom(room.id);
            setNotice(`${meta?.label ?? 'Room'} selected at (${point.x}, ${point.y}).`);
          }}
          aria-label={room ? `${meta?.label ?? 'Room'} at ${x}, ${y}` : `Empty cell ${x}, ${y}`}
        >
          {y === 0 && <span className="matrix-coordinate matrix-coordinate-x" aria-hidden="true">{x}</span>}
          {x === 0 && <span className="matrix-coordinate matrix-coordinate-y" aria-hidden="true">{y}</span>}
        </button>,
      );
    }
  }

  const zoomStyle = {
    transform: `scale(${zoom})`,
    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
  } as CSSProperties;

  return (
    <section className="map-stage" aria-label="Isaac level grid">
      <div className="map-stage-header">
        <div>
          <span className="eyebrow">Floor map</span>
          <h2>{document.floor || 'Unnamed floor'}</h2>
        </div>
        <div className="map-zoom-controls" aria-label="Map zoom controls">
          <button type="button" onClick={() => changeZoom(zoom - 0.15)} aria-label="Zoom out">−</button>
          <button type="button" className="zoom-value" onClick={() => changeZoom(1)} title="Reset zoom">
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" onClick={() => changeZoom(zoom + 0.15)} aria-label="Zoom in">+</button>
        </div>
      </div>

      <div className="map-viewport" ref={viewportRef} data-testid="map-viewport">
        <div className="map-zoom-surface" style={zoomStyle}>
          <div className="map-matrix">
            <div className={`map-grid-stack ${showIndices ? 'show-guides' : ''}`}>
              <div
                className="map-render-layer"
                style={{ gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}
                aria-hidden="true"
              >
                {rooms.map((room) => (
                  <MapRoomVisual key={room.id} room={room} selected={room.id === selectedRoomId} />
                ))}
              </div>
              <MapDoorLayer rooms={rooms} />
              <div className="level-grid interaction-grid">{cells}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="map-status" role="status">
        <span>{notice}</span>
        <span className="map-status-hint">Wheel: zoom · Click: 1×1 · Drag: 1×2 / 2×1 / 2×2</span>
      </div>
    </section>
  );
}
