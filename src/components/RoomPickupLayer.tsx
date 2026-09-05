import { PICKUP_META } from '../domain/catalog';
import type { Pickup } from '../domain/types';
import { PickupSprite } from './IsaacSprite';

/**
 * The floor map is a memory aid, not a second inventory panel. Keep the room
 * readable by showing one representative pickup/structure and collapsing every
 * additional recorded unit into +N.
 */
export function RoomPickupLayer({ pickups }: { pickups: Pickup[] }) {
  if (pickups.length === 0) return null;

  const first = pickups[0];
  const totalQuantity = pickups.reduce((sum, pickup) => sum + pickup.quantity, 0);
  const hiddenQuantity = Math.max(0, totalQuantity - 1);

  return (
    <span className="room-pickup-layer" aria-hidden="true" data-testid="room-pickup-layer">
      <span className="room-pickup-token" title={first.label}>
        <PickupSprite
          kind={first.kind}
          iconId={first.iconId}
          fallback={PICKUP_META[first.kind].icon}
          fitSize={18}
          className="map-pickup-sprite"
          map
        />
      </span>
      {hiddenQuantity > 0 && <span className="room-pickup-overflow">+{hiddenQuantity}</span>}
    </span>
  );
}
