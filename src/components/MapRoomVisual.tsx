import type { CSSProperties } from 'react';
import { getRoomTypeMeta } from '../domain/catalog';
import { getShapeBounds, getShapeVisualCenter } from '../domain/geometry';
import type { Room } from '../domain/types';
import { RoomShapeSprite, RoomTypeSprite } from './IsaacSprite';

interface MapRoomVisualProps {
  room: Room;
  selected: boolean;
}

export function MapRoomVisual({ room, selected }: MapRoomVisualProps) {
  const meta = getRoomTypeMeta(room.type);
  const bounds = getShapeBounds(room.shape);
  const center = getShapeVisualCenter(room.shape);
  const pickupCount = room.pickups.reduce((sum, pickup) => sum + pickup.quantity, 0);

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
      aria-hidden="true"
    >
      <RoomShapeSprite shape={room.shape} />
      <span className="map-room-type-icon">
        <RoomTypeSprite type={room.type} fallback={meta.icon} scale={2} />
      </span>
      {pickupCount > 0 && <span className="pickup-badge map-pickup-badge">{pickupCount}</span>}
    </div>
  );
}
