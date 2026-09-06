import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { getRoomTypeMeta } from '../domain/catalog';
import {
  buildOccupancy,
  coordinateKey,
  getDragRoomPlacementFromPath,
  getRoomCells,
} from '../domain/geometry';
import { isRoomShapeAllowed } from '../domain/roomRules';
import { GRID_SIZE, type GridPoint, type MapTool } from '../domain/types';
import { useTrackerStore } from '../store/useTrackerStore';
import { MapRoomVisual } from './MapRoomVisual';

interface DragSelection {
  path: GridPoint[];
}

interface PanGesture {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

interface PaintGesture {
  pointerId: number;
  lastPoint: GridPoint;
}

interface MoveGesture {
  pointerId: number;
  roomId: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  lastAnchor: GridPoint;
  moved: boolean;
}

interface PointerPosition {
  x: number;
  y: number;
}

interface PinchGesture {
  pointerIds: [number, number];
  startDistance: number;
  startMidpoint: PointerPosition;
  startZoom: number;
  startPan: PointerPosition;
}

interface MapGridProps {
  onImport: () => void;
  onExport: () => void;
  onNew: () => void;
  onRoomActivate?: (roomId: string) => void;
  resetViewSignal?: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const appendPathPoint = (path: GridPoint[], point: GridPoint) =>
  path.some((candidate) => candidate.x === point.x && candidate.y === point.y)
    ? path
    : [...path, point];

const distance = (a: PointerPosition, b: PointerPosition) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const midpoint = (a: PointerPosition, b: PointerPosition): PointerPosition => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

function ToolIcon({ children }: { children: ReactNode }) {
  return (
    <svg className="map-toolbar-icon" viewBox="0 0 24 24" aria-hidden="true" shapeRendering="geometricPrecision">
      {children}
    </svg>
  );
}

const TOOL_ICONS: Record<MapTool, ReactNode> = {
  move: (
    <ToolIcon>
      <path d="M12 2v20M2 12h20M12 2l-3 3m3-3 3 3M12 22l-3-3m3 3 3-3M2 12l3-3m-3 3 3 3M22 12l-3-3m3 3-3 3" />
    </ToolIcon>
  ),
  paint: (
    <ToolIcon>
      <path d="m4 17 1 3 3-1L19 8l-3-3L5 16l-1 1Zm10-10 3 3M4 20h6" />
    </ToolIcon>
  ),
  erase: (
    <ToolIcon>
      <path d="M4 15 14 5l6 6-8 8H8l-4-4Zm5 4-4-4M12 19h8" />
    </ToolIcon>
  ),
};

const GRID_ICON = (
  <ToolIcon>
    <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" />
  </ToolIcon>
);

const IMPORT_ICON = (
  <ToolIcon>
    <path d="M12 3v11m0 0-4-4m4 4 4-4M5 17v3h14v-3" />
  </ToolIcon>
);

const EXPORT_ICON = (
  <ToolIcon>
    <path d="M12 15V4m0 0-4 4m4-4 4 4M5 17v3h14v-3" />
  </ToolIcon>
);

const NEW_ICON = (
  <ToolIcon>
    <path d="M6 3h9l3 3v15H6V3Zm9 0v4h4M12 10v7m-3-3.5h6" />
  </ToolIcon>
);

export function MapGrid({
  onImport,
  onExport,
  onNew,
  onRoomActivate,
  resetViewSignal = 0,
}: MapGridProps) {
  const document = useTrackerStore((state) => state.document);
  const activeDimension = useTrackerStore((state) => state.activeDimension);
  const selectedRoomId = useTrackerStore((state) => state.selectedRoomId);
  const placementType = useTrackerStore((state) => state.placementType);
  const mapTool = useTrackerStore((state) => state.mapTool);
  const showIndices = useTrackerStore((state) => state.showIndices);
  const addRoom = useTrackerStore((state) => state.addRoom);
  const moveRoom = useTrackerStore((state) => state.moveRoom);
  const deleteRoom = useTrackerStore((state) => state.deleteRoom);
  const selectRoom = useTrackerStore((state) => state.selectRoom);
  const setMapTool = useTrackerStore((state) => state.setMapTool);
  const setShowIndices = useTrackerStore((state) => state.setShowIndices);
  const [dragSelection, setDragSelection] = useState<DragSelection | null>(null);
  const [movePreview, setMovePreview] = useState<GridPoint | null>(null);
  const [zoom, setZoom] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const panGestureRef = useRef<PanGesture | null>(null);
  const paintGestureRef = useRef<PaintGesture | null>(null);
  const moveGestureRef = useRef<MoveGesture | null>(null);
  const pinchGestureRef = useRef<PinchGesture | null>(null);
  const activeTouchPointersRef = useRef(new Map<number, PointerPosition>());
  const consumedPointersRef = useRef(new Set<number>());

  const rooms = document.dimensions[activeDimension];
  const occupancy = useMemo(() => buildOccupancy(rooms), [rooms]);

  const dragPreview = useMemo(() => {
    if (!dragSelection || mapTool !== 'paint') return null;

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
  }, [dragSelection, mapTool, occupancy, placementType]);

  useEffect(() => {
    setDragSelection(null);
    setMovePreview(null);
    paintGestureRef.current = null;
    moveGestureRef.current = null;
  }, [mapTool]);

  useEffect(() => {
    setZoom(1);
    setZoomOrigin({ x: 50, y: 50 });
    setPan({ x: 0, y: 0 });
  }, [resetViewSignal]);

  useEffect(() => {
    const clearDanglingGestures = () => {
      setDragSelection(null);
      setMovePreview(null);
      paintGestureRef.current = null;
      moveGestureRef.current = null;
      panGestureRef.current = null;
      pinchGestureRef.current = null;
      activeTouchPointersRef.current.clear();
      consumedPointersRef.current.clear();
      setIsPanning(false);
    };
    window.addEventListener('blur', clearDanglingGestures);
    return () => window.removeEventListener('blur', clearDanglingGestures);
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

  const gridPointAt = (clientX: number, clientY: number): GridPoint | null => {
    const element = window.document.elementFromPoint(clientX, clientY);
    const cell = element?.closest('[data-grid-x][data-grid-y]') as HTMLElement | null;
    if (!cell) return null;
    const x = Number(cell.dataset.gridX);
    const y = Number(cell.dataset.gridY);
    if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
    return { x, y };
  };

  const finishRoomGesture = (point: GridPoint) => {
    if (!dragSelection || mapTool !== 'paint') return;

    const path = appendPathPoint(dragSelection.path, point);
    const placement = getDragRoomPlacementFromPath(path);
    setDragSelection(null);

    if (!placement || !isRoomShapeAllowed(placementType, placement.shape)) return;
    addRoom(placement.anchor, placement.shape);
  };

  const changeZoom = (next: number) => {
    setZoom(clamp(next, 0.65, 2.2));
  };

  const releasePointer = (pointerId: number) => {
    const viewport = viewportRef.current;
    if (viewport?.hasPointerCapture(pointerId)) viewport.releasePointerCapture(pointerId);
  };

  const cancelDirectGestures = () => {
    paintGestureRef.current = null;
    moveGestureRef.current = null;
    panGestureRef.current = null;
    setDragSelection(null);
    setMovePreview(null);
  };

  const beginPinch = () => {
    const entries = [...activeTouchPointersRef.current.entries()];
    if (entries.length < 2) return;
    const [[firstId, first], [secondId, second]] = entries;
    const viewport = viewportRef.current;
    const center = midpoint(first, second);
    if (viewport) {
      const rect = viewport.getBoundingClientRect();
      setZoomOrigin({
        x: clamp(((center.x - rect.left) / rect.width) * 100, 0, 100),
        y: clamp(((center.y - rect.top) / rect.height) * 100, 0, 100),
      });
    }
    cancelDirectGestures();
    pinchGestureRef.current = {
      pointerIds: [firstId, secondId],
      startDistance: Math.max(1, distance(first, second)),
      startMidpoint: center,
      startZoom: zoom,
      startPan: pan,
    };
    setIsPanning(true);
  };

  const finishPointer = (pointerId: number, clientX: number, clientY: number, cancelled = false) => {
    activeTouchPointersRef.current.delete(pointerId);

    const pinch = pinchGestureRef.current;
    if (pinch?.pointerIds.includes(pointerId)) {
      pinchGestureRef.current = null;
      setIsPanning(false);
      releasePointer(pointerId);
      consumedPointersRef.current.delete(pointerId);
      return;
    }

    const paint = paintGestureRef.current;
    if (paint?.pointerId === pointerId) {
      paintGestureRef.current = null;
      if (!cancelled) finishRoomGesture(gridPointAt(clientX, clientY) ?? paint.lastPoint);
      else setDragSelection(null);
      releasePointer(pointerId);
      consumedPointersRef.current.delete(pointerId);
      return;
    }

    const moving = moveGestureRef.current;
    if (moving?.pointerId === pointerId) {
      moveGestureRef.current = null;
      setMovePreview(null);
      if (!cancelled) {
        if (moving.moved) moveRoom(moving.roomId, moving.lastAnchor);
        else {
          selectRoom(moving.roomId);
          onRoomActivate?.(moving.roomId);
        }
      }
      releasePointer(pointerId);
      consumedPointersRef.current.delete(pointerId);
      return;
    }

    const panning = panGestureRef.current;
    if (panning?.pointerId === pointerId) {
      panGestureRef.current = null;
      setIsPanning(false);
      releasePointer(pointerId);
    }
    consumedPointersRef.current.delete(pointerId);
  };

  const cells = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const point = { x, y };
      const key = coordinateKey(point);
      const room = occupancy.get(key);
      const meta = room ? getRoomTypeMeta(room.type) : null;
      const inDragPreview = Boolean(dragPreview?.keys.has(key));
      const isMoveTarget = movePreview?.x === x && movePreview?.y === y;

      cells.push(
        <button
          type="button"
          key={`${x}-${y}`}
          data-testid={`map-cell-${x}-${y}`}
          data-grid-x={x}
          data-grid-y={y}
          className={[
            'grid-cell',
            `tool-${mapTool}`,
            room ? 'occupied' : 'empty',
            room?.id === selectedRoomId ? 'selected' : '',
            inDragPreview ? 'drag-preview' : '',
            inDragPreview && dragPreview?.invalid ? 'drag-invalid' : '',
            isMoveTarget ? 'move-target' : '',
          ].join(' ')}
          onPointerDown={(event) => {
            if (event.button !== 0) return;

            if (room) {
              consumedPointersRef.current.add(event.pointerId);
              if (mapTool === 'erase') {
                event.preventDefault();
                deleteRoom(room.id);
              } else if (mapTool === 'move') {
                event.preventDefault();
                selectRoom(room.id);
                moveGestureRef.current = {
                  pointerId: event.pointerId,
                  roomId: room.id,
                  startX: event.clientX,
                  startY: event.clientY,
                  offsetX: point.x - room.anchor.x,
                  offsetY: point.y - room.anchor.y,
                  lastAnchor: room.anchor,
                  moved: false,
                };
                setMovePreview(room.anchor);
              } else {
                event.preventDefault();
              }
              return;
            }

            if (mapTool === 'paint') {
              consumedPointersRef.current.add(event.pointerId);
              event.preventDefault();
              paintGestureRef.current = { pointerId: event.pointerId, lastPoint: point };
              setDragSelection({ path: [point] });
              return;
            }

            if (mapTool === 'move') selectRoom(null);
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
    transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
  } as CSSProperties;

  return (
    <section className="map-stage" aria-label="Isaac level grid">
      <div className="map-stage-header">
        <div>
          <span className="eyebrow">Floor map</span>
          <h2>{document.floor || 'Unnamed floor'}</h2>
        </div>
        <div className="map-control-cluster">
          <div className="map-zoom-controls" aria-label="Map zoom controls">
            <button type="button" onClick={() => changeZoom(zoom - 0.15)} aria-label="Zoom out">−</button>
            <button type="button" className="zoom-value" onClick={() => changeZoom(1)} title="Reset zoom">
              {Math.round(zoom * 100)}%
            </button>
            <button type="button" onClick={() => changeZoom(zoom + 0.15)} aria-label="Zoom in">+</button>
          </div>

          <div className="map-tool-controls" aria-label="Map tools">
            {(['move', 'paint', 'erase'] as const).map((tool) => (
              <button
                type="button"
                key={tool}
                data-testid={`map-tool-${tool}`}
                className={mapTool === tool ? 'active-button' : ''}
                onClick={() => setMapTool(tool)}
                aria-label={`${tool === 'move' ? 'Move' : tool === 'paint' ? 'Paint' : 'Erase'} rooms`}
                title={`${tool === 'move' ? 'Move' : tool === 'paint' ? 'Paint' : 'Erase'} rooms`}
              >
                {TOOL_ICONS[tool]}
              </button>
            ))}
            <span className="map-tool-divider" aria-hidden="true" />
            <button
              type="button"
              data-testid="map-grid-toggle"
              className={showIndices ? 'active-button' : ''}
              onClick={() => setShowIndices(!showIndices)}
              aria-label="Toggle grid"
              title="Grid"
            >
              {GRID_ICON}
            </button>
            <button type="button" onClick={onImport} aria-label="Import map" title="Import">{IMPORT_ICON}</button>
            <button type="button" onClick={onExport} aria-label="Export map" title="Export">{EXPORT_ICON}</button>
            <button type="button" onClick={onNew} aria-label="New map" title="New">{NEW_ICON}</button>
          </div>
        </div>
      </div>

      <div
        className={`map-viewport tool-${mapTool} ${isPanning ? 'is-panning' : ''}`}
        ref={viewportRef}
        data-testid="map-viewport"
        onPointerDown={(event) => {
          if (event.pointerType === 'touch') {
            activeTouchPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
            if (activeTouchPointersRef.current.size >= 2) {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              beginPinch();
              return;
            }
          }

          if (consumedPointersRef.current.has(event.pointerId)) {
            event.currentTarget.setPointerCapture(event.pointerId);
            return;
          }

          const shouldPan = event.button === 1 || (
            event.pointerType === 'touch' && (mapTool === 'move' || mapTool === 'erase')
          );
          if (!shouldPan) return;

          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          panGestureRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originX: pan.x,
            originY: pan.y,
          };
          setIsPanning(true);
        }}
        onPointerMove={(event) => {
          if (event.pointerType === 'touch' && activeTouchPointersRef.current.has(event.pointerId)) {
            activeTouchPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          }

          const pinch = pinchGestureRef.current;
          if (pinch) {
            const first = activeTouchPointersRef.current.get(pinch.pointerIds[0]);
            const second = activeTouchPointersRef.current.get(pinch.pointerIds[1]);
            if (!first || !second) return;
            event.preventDefault();
            const center = midpoint(first, second);
            const ratio = distance(first, second) / pinch.startDistance;
            setZoom(clamp(pinch.startZoom * ratio, 0.65, 2.2));
            setPan({
              x: pinch.startPan.x + center.x - pinch.startMidpoint.x,
              y: pinch.startPan.y + center.y - pinch.startMidpoint.y,
            });
            return;
          }

          const paint = paintGestureRef.current;
          if (paint?.pointerId === event.pointerId) {
            event.preventDefault();
            const target = gridPointAt(event.clientX, event.clientY);
            if (!target) return;
            paint.lastPoint = target;
            setDragSelection((current) => current
              ? { path: appendPathPoint(current.path, target) }
              : current);
            return;
          }

          const moving = moveGestureRef.current;
          if (moving?.pointerId === event.pointerId) {
            event.preventDefault();
            const hovered = gridPointAt(event.clientX, event.clientY);
            if (!hovered) return;
            moving.moved = moving.moved || Math.hypot(event.clientX - moving.startX, event.clientY - moving.startY) > 7;
            moving.lastAnchor = {
              x: hovered.x - moving.offsetX,
              y: hovered.y - moving.offsetY,
            };
            setMovePreview(moving.lastAnchor);
            return;
          }

          const panning = panGestureRef.current;
          if (!panning || panning.pointerId !== event.pointerId) return;
          event.preventDefault();
          setPan({
            x: panning.originX + event.clientX - panning.startX,
            y: panning.originY + event.clientY - panning.startY,
          });
        }}
        onPointerUp={(event) => finishPointer(event.pointerId, event.clientX, event.clientY)}
        onPointerCancel={(event) => finishPointer(event.pointerId, event.clientX, event.clientY, true)}
        onAuxClick={(event) => {
          if (event.button === 1) event.preventDefault();
        }}
      >
        <div className="map-zoom-surface" style={zoomStyle} data-testid="map-pan-surface">
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
