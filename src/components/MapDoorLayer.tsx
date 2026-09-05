import type { CSSProperties } from 'react';
import { getRoomConnections } from '../domain/geometry';
import type { Room } from '../domain/types';

export function MapDoorLayer({ rooms }: { rooms: Room[] }) {
  const connections = getRoomConnections(rooms);

  return (
    <div className="map-door-layer" aria-hidden="true" data-testid="map-door-layer">
      {connections.map((connection, index) => {
        const style = {
          gridColumn: connection.point.x + 1,
          gridRow: connection.point.y + 1,
        } as CSSProperties;

        return (
          <span
            key={`${connection.point.x}-${connection.point.y}-${connection.direction}-${index}`}
            className={`map-door map-door-${connection.direction}`}
            style={style}
          />
        );
      })}
    </div>
  );
}
