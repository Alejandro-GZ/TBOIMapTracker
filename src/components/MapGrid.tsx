import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { getRoomTypeMeta } from '../domain/catalog';
import {
  buildOccupancy,
  coordinateKey,
  getDragRoomPlacementFromPath,
  getRoomCells,
} from '../domain/geometry';
import { isRoomShapeAllowed } from '../domain/roomRules';
import { GRID_SIZE, type GridPoint } from '../domain/types';
import { useTrackerStore } from '../store/useTrackerStore';
import { MapRoomVisual } from './MapRoomVisual';

interface DragSelection {
  path: GridPoint[];
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const appendPathPoint = (path: GridPoint[], point: GridPoint) =>
  path.some((candidate) => candidate.x === point.x && candidate.y === point.y)
    ? path
    : [...path, point];

export function MapGrid() {
  const document = useTrackerStore((state) => state.document);
  const activeDimension = useTrackerStore((state) => state.activeDimension);
  const selectedRoomId = useTrackerStore((state) => state.selectedRoomId);
  const placementType = useTrackerStore((state) => state.placementType);
  const showIndices = useTrackerStore((state) => state.showIndices);
  const addRoom = useTrackerStore((state) => state.addRoom);
  const moveRoom = useTrackerStore((state) => state.moveRoom);
  const selectRoom = useTrackerStore((state) => state.selectRoom);
  const [dragSelection, setDragSelection] = useState<DragSelection | null>(null);
  const [zoom, setZoom] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const viewportRef = useRef<HTMLDivElement>(null);

  const rooms = document.dimensions[activeDimension];
  const occupancy = useMemo(() => buildOccupancy(rooms), [rooms]);

  const dragPreview = useMemo(() => {
    if (!dragSelection) return null;

    const placement = getDragRoomPlacementFromPath(dragSelection.path);
    const previewCells = placement
      ? getRoomCells({ anchor: placement.anchor, shape: placement.shape })
      : dragSelection.path;
    const keys = new Set(previewCells.map(coordinateKey));
    const blocked = placement
      ? previewCells.some((point) => occupancy.has(coordinateKey(point)))
      : dragSelection.path.some((point) => occupancy.has(coordinateKey(point)));
    const disallowedShape = placement
      ? !isRoomShapeAllowed(placementType, placement.shape)
      : false;

    return {
      keys,
      placement,
      invalid: !placement || blocked || disallowedShape,
    };
  }, [dragSelection, occupancy, placementType]);

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

    const path = appendPathPoint(dragSelection.path, point);
    const placement = getDragRoomPlacementFromPath(path);
    setDragSelection(null);

    if (!placement || !isRoomShapeAllowed(placementType, placement.shape)) return;
    addRoom(placement.anchor, placement.shape);
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
            setDragSelection({ path: [point] });
          }}
          onPointerEnter={(event) => {
            if (!dragSelection || (event.buttons & 1) === 0) return;
            setDragSelection((current) => current
              ? { path: appendPathPoint(current.path, point) }
              : current);
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
            moveRoom(roomId, point);
          }}
          onClick={() => {
            if (room) selectRoom(room.id);
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
              <div className="level-grid interaction-grid">{cells}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
