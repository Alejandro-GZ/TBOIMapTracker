import { PICKUP_META } from '../domain/catalog';
import type { Pickup } from '../domain/types';
import { PickupSprite } from './IsaacSprite';

interface RoomPickupLayerProps {
  pickups: Pickup[];
  layout: 'row' | 'column';
  compact?: boolean;
}

/**
 * The floor map is a memory aid, not a second inventory panel. Keep the room
 * readable by showing one representative pickup/structure and collapsing every
 * additional recorded unit into +N. Narrow/vertical rooms stack that summary;
 * horizontal rooms have enough width to keep it on one line.
 */
export function RoomPickupLayer({ pickups, layout, compact = false }: RoomPickupLayerProps) {
  if (pickups.length === 0) return null;

  const first = pickups[0];
  const totalQuantity = pickups.reduce((sum, pickup) => sum + pickup.quantity, 0);
  const hiddenQuantity = Math.max(0, totalQuantity - 1);
  const fitSize = compact ? 14 : 18;

  return (
    <span
      className={`room-pickup-layer pickup-layout-${layout} ${compact ? 'compact-map-pickups' : ''}`}
      aria-hidden="true"
      data-testid="room-pickup-layer"
      data-pickup-layout={layout}
      data-pickup-fit-size={fitSize}
    >
      <span className="room-pickup-token" title={first.label}>
        <PickupSprite
          kind={first.kind}
          iconId={first.iconId}
          fallback={PICKUP_META[first.kind].icon}
          fitSize={fitSize}
          className="map-pickup-sprite"
          map
        />
      </span>
      {hiddenQuantity > 0 && <span className="room-pickup-overflow">+{hiddenQuantity}</span>}
    </span>
  );
}
