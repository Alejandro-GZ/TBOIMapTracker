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
const ROOM_SHEET_WIDTH = 144;
const ROOM_SHEET_HEIGHT = 64;

type SpriteFrame = Readonly<{ x: number; y: number; width: number; height: number }>;
type IconFrame = Readonly<{ x: number; y: number }>;

const iconFrame = (x: number, y: number): SpriteFrame => ({ x, y, width: 16, height: 16 });

const ROOM_FRAMES: Partial<Record<RoomTypeId, IconFrame>> = {
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

const PICKUP_FRAMES: Partial<Record<PickupKind, IconFrame>> = {
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
const ROOM_SHAPE_FRAMES: Record<RoomShapeId, SpriteFrame> = {
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

interface SpriteSheetFrameProps {
  sheet: string;
  sheetWidth: number;
  sheetHeight: number;
  frame: SpriteFrame;
  scale?: number;
  className?: string;
}

/**
 * Render one sprite frame using an SVG viewport local to the frame.
 *
 * Moving the sheet by -frame.x/-frame.y and clipping to a 0-based viewBox is
 * intentionally different from using a shifted viewBox over the whole sheet:
 * it guarantees pixels outside the selected frame can never bleed into the UI.
 */
function SpriteSheetFrame({
  sheet,
  sheetWidth,
  sheetHeight,
  frame,
  scale = 1,
  className = '',
}: SpriteSheetFrameProps) {
  return (
    <svg
      className={`isaac-sprite ${className}`.trim()}
      width={frame.width * scale}
      height={frame.height * scale}
      viewBox={`0 0 ${frame.width} ${frame.height}`}
      preserveAspectRatio="none"
      overflow="hidden"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <image
        href={sheet}
        x={-frame.x}
        y={-frame.y}
        width={sheetWidth}
        height={sheetHeight}
        preserveAspectRatio="none"
        style={{ imageRendering: 'pixelated' } as CSSProperties}
      />
    </svg>
  );
}

interface IsaacSpriteProps {
  frame?: IconFrame;
  fallback?: string;
  scale?: number;
  className?: string;
}

export function IsaacSprite({ frame, fallback = '', scale = 1, className = '' }: IsaacSpriteProps) {
  if (!frame) {
    if (!fallback) return null;
    return (
      <span
        className={`isaac-sprite-fallback ${className}`.trim()}
        style={{ width: 16 * scale, height: 16 * scale }}
        aria-hidden="true"
      >
        {fallback}
      </span>
    );
  }

  return (
    <SpriteSheetFrame
      sheet={MINIMAP_ICON_SHEET}
      sheetWidth={ICON_SHEET_WIDTH}
      sheetHeight={ICON_SHEET_HEIGHT}
      frame={iconFrame(frame.x, frame.y)}
      scale={scale}
      className={className}
    />
  );
}

export function RoomShapeSprite({ shape }: { shape: RoomShapeId }) {
  return (
    <SpriteSheetFrame
      sheet={MINIMAP_ROOM_SHEET}
      sheetWidth={ROOM_SHEET_WIDTH}
      sheetHeight={ROOM_SHEET_HEIGHT}
      frame={ROOM_SHAPE_FRAMES[shape]}
      className={`isaac-room-shape isaac-room-shape-${shape}`}
    />
  );
}

export function RoomTypeSprite({
  type,
  fallback,
  scale,
  className,
}: {
  type: RoomTypeId;
  fallback?: string;
  scale?: number;
  className?: string;
}) {
  // Vanilla normal/start rooms do not need an extra glyph in the minimap.
  const effectiveFallback = type === 'normal' || type === 'start' ? '' : fallback;
  return (
    <IsaacSprite
      frame={ROOM_FRAMES[type]}
      fallback={effectiveFallback}
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
  fallback?: string;
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
