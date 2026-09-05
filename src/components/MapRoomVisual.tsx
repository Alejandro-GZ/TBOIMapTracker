import type { CSSProperties } from 'react';
import { getShapeBounds, getShapeVisualCenter } from '../domain/geometry';
import { ROOM_TYPES_WITHOUT_MAP_ICON } from '../domain/minimapIcons';
import type { Room, RoomShapeId } from '../domain/types';
import { RoomShapeSprite, RoomTypeSprite } from './IsaacSprite';
import { RoomPickupLayer } from './RoomPickupLayer';

interface MapRoomVisualProps {
  room: Room;
  selected: boolean;
}

/**
 * IsaacDocs RoomShape previews use a fixed 34×30 canvas. The useful pixels are
 * smaller for 1-cell and double rooms (1×1 is 18×16, vertical doubles are
 * 18×30 and horizontal doubles are 34×16). Compensate for that transparent
 * canvas padding without changing the source image aspect ratio.
 */
const ROOM_ART_SCALE: Record<RoomShapeId, number> = {
  '1x1': 1.88,
  IH: 1.88,
  IV: 1.88,
  '1x2': 1.89,
  IIV: 1.89,
  '2x1': 1.875,
  IIH: 1.875,
  '2x2': 1,
  LTL: 1,
  LTR: 1,
  LBL: 1,
  LBR: 1,
};

export function MapRoomVisual({ room, selected }: MapRoomVisualProps) {
  const bounds = getShapeBounds(room.shape);
  const center = getShapeVisualCenter(room.shape);
  const hasRoomIcon = !ROOM_TYPES_WITHOUT_MAP_ICON.includes(room.type);
  const hasPickups = room.pickups.length > 0;

  const style = {
    gridColumn: `${room.anchor.x + 1} / span ${bounds.width}`,
    gridRow: `${room.anchor.y + 1} / span ${bounds.height}`,
    '--room-icon-x': `${(center.x / bounds.width) * 100}%`,
    '--room-icon-y': `${(center.y / bounds.height) * 100}%`,
    '--room-content-width': `${92 / bounds.width}%`,
    '--room-content-height': `${88 / bounds.height}%`,
    '--room-art-scale': ROOM_ART_SCALE[room.shape],
  } as CSSProperties;

  return (
    <div
      className={`map-room-visual ${selected ? 'selected' : ''} ${room.marked ? 'marked' : ''}`}
      style={style}
      data-testid={`map-room-${room.id}`}
      data-room-shape={room.shape}
      data-room-type={room.type}
      data-room-marked={room.marked ? 'true' : 'false'}
      aria-hidden="true"
    >
      <RoomShapeSprite shape={room.shape} />
      {(hasRoomIcon || hasPickups) && (
        <span className={`map-room-content-row ${hasRoomIcon ? 'has-room-icon' : 'pickup-only'}`}>
          {hasRoomIcon && (
            <span className="map-room-type-icon">
              <RoomTypeSprite type={room.type} fitSize={hasPickups ? 24 : 36} />
            </span>
          )}
          {hasPickups && <RoomPickupLayer pickups={room.pickups} />}
        </span>
      )}
    </div>
  );
}
