import type { CSSProperties } from 'react';
import type { PickupKind, RoomShapeId, RoomTypeId } from '../domain/types';

const MINIMAP_API_REVISION = 'ca7ecb5a256887963129fa6314e8babb6a3d3cb6';
const MINIMAP_API_RAW = `https://raw.githubusercontent.com/TazTxUK/MinimapAPI/${MINIMAP_API_REVISION}/resources/gfx/ui/minimapapi`;

/**
 * MiniMAPI assets are pinned to a known upstream commit so visual changes
 * upstream cannot silently alter this app. They are loaded at runtime rather
 * than redistributed in this repository.
 */
export const MINIMAP_ICON_SHEET = `${MINIMAP_API_RAW}/minimapapi_icons.png`;
export const MINIMAP_ROOM_SHEET = `${MINIMAP_API_RAW}/custom_minimap2.png`;

const ICON_SHEET_WIDTH = 128;
const ICON_SHEET_HEIGHT = 160;
const ICON_FRAME_SIZE = 16;
const ROOM_SHEET_WIDTH = 144;
const ROOM_SHEET_HEIGHT = 64;

type SpriteFrame = Readonly<{ x: number; y: number }>;
type RoomShapeFrame = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

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

/** Frame order follows Isaac's RoomShape enum, as described by custom_minimap2.anm2. */
const ROOM_SHAPE_FRAMES: Record<RoomShapeId, RoomShapeFrame> = {
  '1x1': { x: 0, y: 48, width: 18, height: 16 },
  IH: { x: 18, y: 48, width: 18, height: 16 },
  IV: { x: 36, y: 48, width: 18, height: 16 },
  '1x2': { x: 0, y: 0, width: 18, height: 32 },
  IIV: { x: 18, y: 0, width: 18, height: 32 },
  '2x1': { x: 0, y: 32, width: 36, height: 16 },
  IIH: { x: 36, y: 32, width: 36, height: 16 },
  '2x2': { x: 36, y: 0, width: 36, height: 32 },
  LTL: { x: 72, y: 0, width: 36, height: 32 },
  LTR: { x: 108, y: 0, width: 36, height: 32 },
  LBL: { x: 72, y: 32, width: 36, height: 32 },
  LBR: { x: 108, y: 32, width: 36, height: 32 },
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
    width: ICON_FRAME_SIZE * scale,
    height: ICON_FRAME_SIZE * scale,
    backgroundImage: `url("${MINIMAP_ICON_SHEET}")`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${ICON_SHEET_WIDTH * scale}px ${ICON_SHEET_HEIGHT * scale}px`,
    backgroundPosition: `${-frame.x * scale}px ${-frame.y * scale}px`,
    imageRendering: 'pixelated',
  };

  return <span className={`isaac-sprite ${className}`.trim()} style={style} aria-hidden="true" />;
}

export function RoomShapeSprite({ shape }: { shape: RoomShapeId }) {
  const frame = ROOM_SHAPE_FRAMES[shape];

  return (
    <svg
      className={`isaac-room-shape isaac-room-shape-${shape}`}
      viewBox={`${frame.x} ${frame.y} ${frame.width} ${frame.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <image
        href={MINIMAP_ROOM_SHEET}
        x="0"
        y="0"
        width={ROOM_SHEET_WIDTH}
        height={ROOM_SHEET_HEIGHT}
        preserveAspectRatio="none"
      />
    </svg>
  );
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
