import { useEffect, useState, type CSSProperties } from 'react';
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

const COLUMN_PICKUP_SHAPES: readonly RoomShapeId[] = ['1x1', 'IV', '1x2', 'IIV'];
const PORTRAIT_PHONE_QUERY = '(orientation: portrait) and (max-width: 699px)';

function usePortraitPhone() {
  const [isPortraitPhone, setIsPortraitPhone] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(PORTRAIT_PHONE_QUERY).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(PORTRAIT_PHONE_QUERY);
    const update = () => setIsPortraitPhone(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return isPortraitPhone;
}

export function MapRoomVisual({ room, selected }: MapRoomVisualProps) {
  const bounds = getShapeBounds(room.shape);
  const center = getShapeVisualCenter(room.shape);
  const hasRoomIcon = !ROOM_TYPES_WITHOUT_MAP_ICON.includes(room.type);
  const hasPickups = room.pickups.length > 0;
  const splitContent = hasRoomIcon && hasPickups;
  const pickupLayout = COLUMN_PICKUP_SHAPES.includes(room.shape) ? 'column' : 'row';
  const portraitPhone = usePortraitPhone();

  /* Desktop/landscape retain the established 36/24 px targets. Portrait uses
   * smaller targets so MiniMAPI frames top out at an integer ×2 scale instead
   * of growing wider/taller than a phone grid cell. */
  const roomIconFitSize = portraitPhone
    ? (splitContent ? 18 : 22)
    : (splitContent ? 24 : 36);

  const style = {
    gridColumn: `${room.anchor.x + 1} / span ${bounds.width}`,
    gridRow: `${room.anchor.y + 1} / span ${bounds.height}`,
    '--room-icon-x': `${(center.x / bounds.width) * 100}%`,
    '--room-icon-y': `${(center.y / bounds.height) * 100}%`,
    '--room-content-width': `${92 / bounds.width}%`,
    '--room-content-height': `${88 / bounds.height}%`,
    '--room-art-scale': ROOM_ART_SCALE[room.shape],
  } as CSSProperties;

  const contentClass = splitContent
    ? 'split-content'
    : hasRoomIcon
      ? 'icon-only'
      : 'pickup-only';

  return (
    <div
      className={`map-room-visual ${selected ? 'selected' : ''} ${room.marked ? 'marked' : ''}`}
      style={style}
      data-testid={`map-room-${room.id}`}
      data-room-shape={room.shape}
      data-room-type={room.type}
      data-room-marked={room.marked ? 'true' : 'false'}
      data-map-sprite-profile={portraitPhone ? 'portrait-phone' : 'default'}
      aria-hidden="true"
    >
      <RoomShapeSprite shape={room.shape} />
      {(hasRoomIcon || hasPickups) && (
        <span className={`map-room-content-row ${contentClass}`}>
          {hasRoomIcon && (
            <span className="map-room-type-icon">
              <RoomTypeSprite type={room.type} fitSize={roomIconFitSize} />
            </span>
          )}
          {hasPickups && <RoomPickupLayer pickups={room.pickups} layout={pickupLayout} compact={portraitPhone} />}
        </span>
      )}
    </div>
  );
}
