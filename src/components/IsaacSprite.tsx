import type { CSSProperties } from 'react';
import type { PickupKind, RoomTypeId } from '../domain/types';

/**
 * MiniMAPI's extended minimap icon sheet, pinned to a known upstream commit so
 * visual changes upstream cannot silently alter this app.
 *
 * The sheet is loaded at runtime rather than redistributed in this repository.
 */
export const MINIMAP_ICON_SHEET =
  'https://raw.githubusercontent.com/TazTxUK/MinimapAPI/ca7ecb5a256887963129fa6314e8babb6a3d3cb6/resources/gfx/ui/minimapapi/minimapapi_icons.png';

const SHEET_WIDTH = 128;
const SHEET_HEIGHT = 160;
const FRAME_SIZE = 16;

type SpriteFrame = Readonly<{ x: number; y: number }>;

const ROOM_FRAMES: Partial<Record<RoomTypeId, SpriteFrame>> = {
  shop: { x: 0, y: 0 },
  secret: { x: 16, y: 0 },
  'super-secret': { x: 32, y: 0 },
  library: { x: 48, y: 0 },
  treasure: { x: 64, y: 0 },
  angel: { x: 80, y: 0 },
  devil: { x: 96, y: 0 },
  dice: { x: 112, y: 0 },
  miniboss: { x: 0, y: 16 },
  boss: { x: 16, y: 16 },
  challenge: { x: 32, y: 16 },
  'boss-challenge': { x: 48, y: 16 },
  curse: { x: 64, y: 16 },
  sacrifice: { x: 80, y: 16 },
  arcade: { x: 96, y: 16 },
  bedroom: { x: 0, y: 32 },
  planetarium: { x: 64, y: 32 },
  'ultra-secret': { x: 112, y: 32 },
};

const PICKUP_FRAMES: Partial<Record<PickupKind, SpriteFrame>> = {
  heart: { x: 64, y: 48 },
  coin: { x: 80, y: 48 },
  key: { x: 96, y: 48 },
  bomb: { x: 112, y: 48 },
  collectible: { x: 0, y: 64 },
  trinket: { x: 16, y: 64 },
  battery: { x: 32, y: 64 },
  card: { x: 48, y: 64 },
  pill: { x: 64, y: 64 },
  rune: { x: 80, y: 64 },
  chest: { x: 80, y: 80 },
};

interface IsaacSpriteProps {
  frame?: SpriteFrame;
  fallback: string;
  scale?: number;
  className?: string;
}

export function IsaacSprite({ frame, fallback, scale = 1, className = '' }: IsaacSpriteProps) {
  if (!frame) {
    return (
      <span className={`isaac-sprite isaac-sprite-fallback ${className}`.trim()} aria-hidden="true">
        {fallback}
      </span>
    );
  }

  const style: CSSProperties = {
    width: FRAME_SIZE * scale,
    height: FRAME_SIZE * scale,
    backgroundImage: `url("${MINIMAP_ICON_SHEET}")`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${SHEET_WIDTH * scale}px ${SHEET_HEIGHT * scale}px`,
    backgroundPosition: `${-frame.x * scale}px ${-frame.y * scale}px`,
    imageRendering: 'pixelated',
  };

  return <span className={`isaac-sprite ${className}`.trim()} style={style} aria-hidden="true" />;
}

export function RoomTypeSprite({
  type,
  fallback,
  scale,
  className,
}: {
  type: RoomTypeId;
  fallback: string;
  scale?: number;
  className?: string;
}) {
  return (
    <IsaacSprite
      frame={ROOM_FRAMES[type]}
      fallback={fallback}
      scale={scale}
      className={className}
    />
  );
}

export function PickupSprite({
  kind,
  fallback,
  scale,
  className,
}: {
  kind: PickupKind;
  fallback: string;
  scale?: number;
  className?: string;
}) {
  return (
    <IsaacSprite
      frame={PICKUP_FRAMES[kind]}
      fallback={fallback}
      scale={scale}
      className={className}
    />
  );
}
