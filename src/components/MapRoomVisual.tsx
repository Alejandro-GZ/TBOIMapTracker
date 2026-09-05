import type { CSSProperties } from 'react';
import { getShapeBounds, getShapeVisualCenter } from '../domain/geometry';
import type { Room } from '../domain/types';
import { RoomShapeSprite, RoomTypeSprite } from './IsaacSprite';
import { RoomPickupLayer } from './RoomPickupLayer';

interface MapRoomVisualProps {
  room: Room;
  selected: boolean;
}

export function MapRoomVisual({ room, selected }: MapRoomVisualProps) {
  const bounds = getShapeBounds(room.shape);
  const center = getShapeVisualCenter(room.shape);

  const style = {
    gridColumn: `${room.anchor.x + 1} / span ${bounds.width}`,
    gridRow: `${room.anchor.y + 1} / span ${bounds.height}`,
    '--room-icon-x': `${(center.x / bounds.width) * 100}%`,
    '--room-icon-y': `${(center.y / bounds.height) * 100}%`,
  } as CSSProperties;

  return (
    <div
      className={`map-room-visual ${selected ? 'selected' : ''} ${room.visited ? 'visited' : 'unvisited'}`}
      style={style}
      data-testid={`map-room-${room.id}`}
      data-room-shape={room.shape}
      data-room-type={room.type}
      aria-hidden="true"
    >
      <RoomShapeSprite shape={room.shape} />
      <span className="map-room-type-icon">
        <RoomTypeSprite type={room.type} />
      </span>
      <RoomPickupLayer pickups={room.pickups} />
    </div>
  );
}
