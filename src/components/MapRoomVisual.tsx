import type { CSSProperties } from 'react';
import { getShapeBounds, getShapeVisualCenter } from '../domain/geometry';
import type { Room } from '../domain/types';
import { RoomShapeSprite, RoomTypeSprite } from './IsaacSprite';
import { RoomPickupLayer } from './RoomPickupLayer';

interface MapRoomVisualProps {
  room: Room;
  selected: boolean;
}

const roomArtScale = (width: number, height: number) => {
  if (width === 1 && height === 1) return 1.16;
  if (width === 1 || height === 1) return 1.08;
  return 1.02;
};

export function MapRoomVisual({ room, selected }: MapRoomVisualProps) {
  const bounds = getShapeBounds(room.shape);
  const center = getShapeVisualCenter(room.shape);

  const style = {
    gridColumn: `${room.anchor.x + 1} / span ${bounds.width}`,
    gridRow: `${room.anchor.y + 1} / span ${bounds.height}`,
    '--room-icon-x': `${(center.x / bounds.width) * 100}%`,
    '--room-icon-y': `${(center.y / bounds.height) * 100}%`,
    '--room-art-scale': roomArtScale(bounds.width, bounds.height),
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
        <RoomTypeSprite type={room.type} scale={2} />
      </span>
      <RoomPickupLayer pickups={room.pickups} />
    </div>
  );
}
