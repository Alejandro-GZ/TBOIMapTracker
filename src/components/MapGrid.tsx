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

interface MapGridProps {
  onImport: () => void;
  onExport: () => void;
  onNew: () => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const appendPathPoint = (path: GridPoint[], point: GridPoint) =>
  path.some((candidate) => candidate.x === point.x && candidate.y === point.y)
    ? path
    : [...path, point];

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

export function MapGrid({ onImport, onExport, onNew }: MapGridProps) {
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
  const [zoom, setZoom] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const panGestureRef = useRef<PanGesture | null>(null);

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
  }, [mapTool]);

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

  const finishPan = (pointerId: number) => {
    const gesture = panGestureRef.current;
    if (!gesture || gesture.pointerId !== pointerId) return;

    const viewport = viewportRef.current;
    if (viewport?.hasPointerCapture(pointerId)) viewport.releasePointerCapture(pointerId);
    panGestureRef.current = null;
    setIsPanning(false);
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
            `tool-${mapTool}`,
            room ? 'occupied' : 'empty',
            room?.id === selectedRoomId ? 'selected' : '',
            inDragPreview ? 'drag-preview' : '',
            inDragPreview && dragPreview?.invalid ? 'drag-invalid' : '',
          ].join(' ')}
          draggable={Boolean(room) && mapTool === 'move' && !dragSelection}
          onPointerDown={(event) => {
            if (event.button !== 0) return;

            if (room) {
              if (mapTool === 'erase') {
                event.preventDefault();
                deleteRoom(room.id);
              } else if (mapTool === 'move') {
                selectRoom(room.id);
              } else {
                event.preventDefault();
              }
              return;
            }

            if (mapTool !== 'paint') {
              if (mapTool === 'move') selectRoom(null);
              return;
            }

            event.preventDefault();
            setDragSelection({ path: [point] });
          }}
          onPointerEnter={(event) => {
            if (mapTool !== 'paint' || !dragSelection || (event.buttons & 1) === 0) return;
            setDragSelection((current) => current
              ? { path: appendPathPoint(current.path, point) }
              : current);
          }}
          onPointerUp={(event) => {
            if (mapTool !== 'paint' || !dragSelection || event.button !== 0) return;
            event.preventDefault();
            finishRoomGesture(point);
          }}
          onDragStart={(event) => {
            if (!room || mapTool !== 'move') {
              event.preventDefault();
              return;
            }
            event.dataTransfer.setData('text/tboi-room', room.id);
            event.dataTransfer.effectAllowed = 'move';
            selectRoom(room.id);
          }}
          onDragOver={(event) => {
            if (mapTool === 'move' && event.dataTransfer.types.includes('text/tboi-room')) event.preventDefault();
          }}
          onDrop={(event) => {
            if (mapTool !== 'move') return;
            event.preventDefault();
            const roomId = event.dataTransfer.getData('text/tboi-room');
            if (!roomId) return;
            moveRoom(roomId, point);
          }}
          onClick={() => {
            if (mapTool === 'move' && room) selectRoom(room.id);
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
          if (event.button !== 1) return;
          event.preventDefault();
          event.stopPropagation();
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
          const gesture = panGestureRef.current;
          if (!gesture || gesture.pointerId !== event.pointerId) return;
          event.preventDefault();
          setPan({
            x: gesture.originX + event.clientX - gesture.startX,
            y: gesture.originY + event.clientY - gesture.startY,
          });
        }}
        onPointerUp={(event) => finishPan(event.pointerId)}
        onPointerCancel={(event) => finishPan(event.pointerId)}
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
