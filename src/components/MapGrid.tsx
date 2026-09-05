import { useMemo, useState } from 'react';
import { getRoomTypeMeta } from '../domain/catalog';
import { buildOccupancy, coordinateKey, gridIndex } from '../domain/geometry';
import { GRID_SIZE } from '../domain/types';
import { useTrackerStore } from '../store/useTrackerStore';
import { MapRoomVisual } from './MapRoomVisual';

export function MapGrid() {
  const document = useTrackerStore((state) => state.document);
  const activeDimension = useTrackerStore((state) => state.activeDimension);
  const selectedRoomId = useTrackerStore((state) => state.selectedRoomId);
  const showIndices = useTrackerStore((state) => state.showIndices);
  const addRoom = useTrackerStore((state) => state.addRoom);
  const moveRoom = useTrackerStore((state) => state.moveRoom);
  const selectRoom = useTrackerStore((state) => state.selectRoom);
  const [notice, setNotice] = useState('Choose a room type and click the map.');

  const rooms = document.dimensions[activeDimension];
  const occupancy = useMemo(() => buildOccupancy(rooms), [rooms]);

  const cells = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const point = { x, y };
      const room = occupancy.get(coordinateKey(point));
      const meta = room ? getRoomTypeMeta(room.type) : null;
      const right = occupancy.get(coordinateKey({ x: x + 1, y }));
      const down = occupancy.get(coordinateKey({ x, y: y + 1 }));
      const connectedRight = Boolean(room && right && right.id !== room.id);
      const connectedDown = Boolean(room && down && down.id !== room.id);

      cells.push(
        <button
          type="button"
          key={`${x}-${y}`}
          className={[
            'grid-cell',
            room ? 'occupied' : 'empty',
            room?.id === selectedRoomId ? 'selected' : '',
          ].join(' ')}
          draggable={Boolean(room)}
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
            setNotice(moved ? `Room moved to grid index ${gridIndex(point)}.` : 'That move is not possible here.');
          }}
          onClick={() => {
            if (room) {
              selectRoom(room.id);
              setNotice(`${meta?.label ?? 'Room'} selected.`);
              return;
            }
            const placed = addRoom(point);
            setNotice(placed ? `Room placed at grid index ${gridIndex(point)}.` : 'That room shape does not fit here.');
          }}
          aria-label={room ? `${meta?.label ?? 'Room'} at ${x}, ${y}` : `Empty cell ${x}, ${y}`}
        >
          {showIndices && <span className="cell-index">{gridIndex(point)}</span>}
          {connectedRight && <span className="connector connector-right" aria-hidden="true" />}
          {connectedDown && <span className="connector connector-down" aria-hidden="true" />}
        </button>,
      );
    }
  }

  return (
    <section className="map-stage" aria-label="Isaac level grid">
      <div className="map-stage-header">
        <div>
          <span className="eyebrow">Floor map</span>
          <h2>{document.floor || 'Unnamed floor'}</h2>
        </div>
        <div className="map-legend">
          <span><i className="legend-dot current" /> selected</span>
          <span><i className="legend-dot pickup" /> pickups left</span>
        </div>
      </div>

      <div className="grid-frame">
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

      <div className="map-status" role="status">{notice}</div>
    </section>
  );
}
