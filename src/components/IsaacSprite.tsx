import type { CSSProperties } from 'react';
import type { PickupKind, RoomShapeId, RoomTypeId } from '../domain/types';

/**
 * Room shapes and room-type icons come from the same preview assets used by
 * IsaacDocs. Pinning the docs revision keeps the map deterministic while still
 * avoiding redistribution of the PNGs in this repository.
 */
export const ISAAC_DOCS_REVISION = '646e1761addcc236081ad291fee20f3d04bbbf52';
const ISAAC_DOCS_IMAGES = `https://raw.githubusercontent.com/wofsauge/IsaacDocs/${ISAAC_DOCS_REVISION}/docs/images`;

const ROOM_SHAPE_VALUES: Record<RoomShapeId, number> = {
  '1x1': 1,
  IH: 2,
  IV: 3,
  '1x2': 4,
  IIV: 5,
  '2x1': 6,
  IIH: 7,
  '2x2': 8,
  LTL: 9,
  LTR: 10,
  LBL: 11,
  LBR: 12,
};

/** Values follow RoomType in IsaacDocs. Boss challenge uses the dedicated icon 17. */
const ROOM_TYPE_VALUES: Partial<Record<RoomTypeId, number>> = {
  shop: 2,
  treasure: 4,
  boss: 5,
  miniboss: 6,
  secret: 7,
  'super-secret': 8,
  arcade: 9,
  curse: 10,
  challenge: 11,
  library: 12,
  sacrifice: 13,
  devil: 14,
  angel: 15,
  'boss-challenge': 17,
  bedroom: 18,
  dice: 21,
  planetarium: 24,
  'ultra-secret': 29,
};

export const getCanonicalRoomShapeUrl = (shape: RoomShapeId) =>
  `${ISAAC_DOCS_IMAGES}/roomshapes/${ROOM_SHAPE_VALUES[shape]}.png`;

export const getCanonicalRoomTypeUrl = (type: RoomTypeId) => {
  const value = ROOM_TYPE_VALUES[type];
  return value ? `${ISAAC_DOCS_IMAGES}/roomtypes/${value}.png` : null;
};

interface CanonicalImageProps {
  src: string;
  className?: string;
  dataAttribute?: Record<string, string>;
}

function CanonicalImage({ src, className = '', dataAttribute = {} }: CanonicalImageProps) {
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className={`isaac-canonical-image ${className}`.trim()}
      style={{ imageRendering: 'pixelated' }}
      aria-hidden="true"
      {...dataAttribute}
    />
  );
}

export function RoomShapeSprite({ shape, className = '' }: { shape: RoomShapeId; className?: string }) {
  return (
    <CanonicalImage
      src={getCanonicalRoomShapeUrl(shape)}
      className={`isaac-room-shape isaac-room-shape-${shape} ${className}`.trim()}
      dataAttribute={{ 'data-isaac-shape': shape }}
    />
  );
}

export function RoomTypeSprite({
  type,
  fallback,
  scale = 1,
  className,
}: {
  type: RoomTypeId;
  fallback?: string;
  scale?: number;
  className?: string;
}) {
  const src = getCanonicalRoomTypeUrl(type);
  if (src) {
    return (
      <span
        className={`isaac-room-type-frame ${className ?? ''}`.trim()}
        style={{ '--isaac-icon-scale': scale } as CSSProperties}
      >
        <CanonicalImage
          src={src}
          className="isaac-room-type-image"
          dataAttribute={{ 'data-isaac-room-type': type }}
        />
      </span>
    );
  }

  if (type === 'normal' || type === 'start' || !fallback) return null;
  return (
    <span className={`isaac-sprite-fallback ${className ?? ''}`.trim()} aria-hidden="true">
      {fallback}
    </span>
  );
}

/* Pickups are not covered by the RoomShape/RoomType docs tables. Keep them on
 * a separate secondary skin so canonical room rendering is never coupled to
 * MiniMAPI. */
const MINIMAP_API_REVISION = 'ca7ecb5a256887963129fa6314e8babb6a3d3cb6';
const MINIMAP_API_RAW = `https://raw.githubusercontent.com/TazTxUK/MinimapAPI/${MINIMAP_API_REVISION}/resources/gfx/ui/minimapapi`;
const MINIMAP_PICKUP_SHEET = `${MINIMAP_API_RAW}/minimapapi_icons.png`;
const ICON_SHEET_WIDTH = 128;
const ICON_SHEET_HEIGHT = 160;
const ICON_FRAME_SIZE = 16;

type IconFrame = Readonly<{ x: number; y: number }>;

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

export function PickupSprite({
  kind,
  fallback,
  scale = 1,
  className = '',
}: {
  kind: PickupKind;
  fallback?: string;
  scale?: number;
  className?: string;
}) {
  const frame = PICKUP_FRAMES[kind];
  if (!frame) {
    if (!fallback) return null;
    return <span className={`isaac-sprite-fallback ${className}`.trim()} aria-hidden="true">{fallback}</span>;
  }

  const style: CSSProperties = {
    width: ICON_FRAME_SIZE * scale,
    height: ICON_FRAME_SIZE * scale,
    backgroundImage: `url("${MINIMAP_PICKUP_SHEET}")`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${ICON_SHEET_WIDTH * scale}px ${ICON_SHEET_HEIGHT * scale}px`,
    backgroundPosition: `${-frame.x * scale}px ${-frame.y * scale}px`,
    imageRendering: 'pixelated',
  };

  return <span className={`isaac-sprite pickup-sprite ${className}`.trim()} style={style} aria-hidden="true" />;
}
