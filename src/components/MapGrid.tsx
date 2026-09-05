import { useMemo, useState } from 'react';
import { getRoomTypeMeta } from '../domain/catalog';
import {
  buildOccupancy,
  coordinateKey,
  getRoomCells,
  gridIndex,
} from '../domain/geometry';
import { GRID_SIZE } from '../domain/types';
import { useTrackerStore } from '../store/useTrackerStore';

export function MapGrid() {
  const document = useTrackerStore((state) => state.document);
  const activeDimension = useTrackerStore((state) => state.activeDimension);
  const selectedRoomId = useTrackerStore((state) => state.selectedRoomId);
  const showIndices = useTrackerStore((state) => state.showIndices);
  const addRoom = useTrackerStore((state) => state.addRoom);
  const moveRoom = useTrackerStore((state) => state.moveRoom);
  const selectRoom = useTrackerStore((state) => state.selectRoom);
  const [notice, setNotice] = useState('Click an empty cell to place a room.');

  const rooms = document.dimensions[activeDimension];
  const occupancy = useMemo(() => buildOccupancy(rooms), [rooms]);

  const cells = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const point = { x, y };
      const room = occupancy.get(coordinateKey(point));
      const meta = room ? getRoomTypeMeta(room.type) : null;
      const roomCells = room ? getRoomCells(room) : [];
      const primary = room ? roomCells[0] : null;
      const isPrimary = Boolean(primary && primary.x === x && primary.y === y);
      const right = occupancy.get(coordinateKey({ x: x + 1, y }));
      const down = occupancy.get(coordinateKey({ x, y: y + 1 }));
      const sameRight = Boolean(room && right?.id === room.id);
      const sameDown = Boolean(room && down?.id === room.id);
      const connectedRight = Boolean(room && right && right.id !== room.id);
      const connectedDown = Boolean(room && down && down.id !== room.id);

      cells.push(
        <button
          type="button"
          key={`${x}-${y}`}
          className={[
            'grid-cell',
            room ? `occupied tone-${meta?.tone}` : 'empty',
            room?.id === selectedRoomId ? 'selected' : '',
            sameRight ? 'same-right' : '',
            sameDown ? 'same-down' : '',
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
            setNotice(moved ? `Room moved to ${gridIndex(point)}.` : 'That move would overlap or leave the 13×13 grid.');
          }}
          onClick={() => {
            if (room) {
              selectRoom(room.id);
              setNotice(`${meta?.label ?? 'Room'} selected.`);
              return;
            }
            const placed = addRoom(point);
            setNotice(placed ? `Room placed at grid index ${gridIndex(point)}.` : 'That shape does not fit here.');
          }}
          aria-label={room ? `${meta?.label ?? 'Room'} at ${x}, ${y}` : `Empty cell ${x}, ${y}`}
        >
          {showIndices && <span className="cell-index">{gridIndex(point)}</span>}
          {room && isPrimary && (
            <span className="room-mark">
              <strong>{meta?.icon}</strong>
              <small>{room.shape}</small>
            </span>
          )}
          {room && room.pickups.length > 0 && isPrimary && (
            <span className="pickup-badge">{room.pickups.reduce((sum, pickup) => sum + pickup.quantity, 0)}</span>
          )}
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
          <span className="eyebrow">13 × 13 level grid</span>
          <h2>{document.floor || 'Unnamed floor'}</h2>
        </div>
        <div className="map-legend">
          <span><i className="legend-dot current" /> selected</span>
          <span><i className="legend-dot pickup" /> pickups left</span>
        </div>
      </div>
      <div className="grid-frame">
        <div className="level-grid">{cells}</div>
      </div>
      <div className="map-status" role="status">{notice}</div>
    </section>
  );
}
