import { PICKUP_META } from '../domain/catalog';
import type { Pickup } from '../domain/types';
import { PickupSprite } from './IsaacSprite';

const MAX_VISIBLE_PICKUP_GROUPS = 4;

export function RoomPickupLayer({ pickups }: { pickups: Pickup[] }) {
  if (pickups.length === 0) return null;

  const visible = pickups.slice(0, MAX_VISIBLE_PICKUP_GROUPS);
  const hidden = pickups.slice(MAX_VISIBLE_PICKUP_GROUPS).reduce(
    (sum, pickup) => sum + pickup.quantity,
    0,
  );

  return (
    <span className="room-pickup-layer" aria-hidden="true" data-testid="room-pickup-layer">
      {visible.map((pickup) => (
        <span className="room-pickup-token" key={pickup.id} title={pickup.label}>
          <PickupSprite
            kind={pickup.kind}
            fallback={PICKUP_META[pickup.kind].icon}
            scale={1}
            className="map-pickup-sprite"
          />
          {pickup.quantity > 1 && <b>×{pickup.quantity}</b>}
        </span>
      ))}
      {hidden > 0 && <span className="room-pickup-overflow">+{hidden}</span>}
    </span>
  );
}
