import type { CSSProperties } from 'react';
import {
  DEFAULT_PICKUP_ICON_BY_KIND,
  getMinimapIconIndex,
  MINIMAP_ICON_ATLAS_COLUMNS,
  MINIMAP_ICON_ATLAS_HEIGHT,
  MINIMAP_ICON_ATLAS_URL,
  MINIMAP_ICON_ATLAS_WIDTH,
  MINIMAP_ICON_CELL,
  MINIMAP_ICON_ORDER,
  ROOM_ICON_BY_TYPE,
  ROOM_ICON_VARIANT_CLASS,
  TRACKABLE_MARKER_BY_ID,
  type MinimapIconId,
} from '../domain/minimapIcons';
import type { PickupKind, RoomShapeId, RoomTypeId } from '../domain/types';

/**
 * Room silhouettes keep using the canonical RoomShape preview images from the
 * pinned IsaacDocs revision. Everything that sits on top of a room (room type,
 * pickups and structures) comes from the locally vendored MiniMAPI icon atlas.
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

export const getCanonicalRoomShapeUrl = (shape: RoomShapeId) =>
  `${ISAAC_DOCS_IMAGES}/roomshapes/${ROOM_SHAPE_VALUES[shape]}.png`;

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

const isMinimapIconId = (value: string): value is MinimapIconId =>
  MINIMAP_ICON_ORDER.includes(value as MinimapIconId);

export function MinimapIconSprite({
  id,
  scale = 2,
  className = '',
  dataAttribute = {},
}: {
  id: MinimapIconId;
  scale?: number;
  className?: string;
  dataAttribute?: Record<string, string>;
}) {
  const integerScale = Math.max(1, Math.round(scale));
  const index = getMinimapIconIndex(id);
  const x = (index % MINIMAP_ICON_ATLAS_COLUMNS) * MINIMAP_ICON_CELL;
  const y = Math.floor(index / MINIMAP_ICON_ATLAS_COLUMNS) * MINIMAP_ICON_CELL;

  const style: CSSProperties = {
    width: MINIMAP_ICON_CELL * integerScale,
    height: MINIMAP_ICON_CELL * integerScale,
    backgroundImage: `url("${MINIMAP_ICON_ATLAS_URL}")`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${MINIMAP_ICON_ATLAS_WIDTH * integerScale}px ${MINIMAP_ICON_ATLAS_HEIGHT * integerScale}px`,
    backgroundPosition: `${-x * integerScale}px ${-y * integerScale}px`,
    imageRendering: 'pixelated',
  };

  return (
    <span
      className={`minimap-icon-sprite ${className}`.trim()}
      style={style}
      data-icon-id={id}
      aria-hidden="true"
      {...dataAttribute}
    />
  );
}

export function RoomTypeSprite({
  type,
  fallback,
  scale = 2,
  className,
}: {
  type: RoomTypeId;
  fallback?: string;
  scale?: number;
  className?: string;
}) {
  const iconId = ROOM_ICON_BY_TYPE[type];
  if (iconId) {
    return (
      <span className={`isaac-room-type-frame ${className ?? ''}`.trim()}>
        <MinimapIconSprite
          id={iconId}
          scale={scale}
          className={`isaac-room-type-image ${ROOM_ICON_VARIANT_CLASS[type] ?? ''}`.trim()}
          dataAttribute={{ 'data-isaac-room-type': type }}
        />
      </span>
    );
  }

  if (!fallback) return null;
  return <span className={`isaac-sprite-fallback ${className ?? ''}`.trim()} aria-hidden="true">{fallback}</span>;
}

export function PickupSprite({
  kind,
  iconId,
  fallback,
  scale = 2,
  className = '',
  map = false,
}: {
  kind: PickupKind;
  iconId?: string;
  fallback?: string;
  scale?: number;
  className?: string;
  map?: boolean;
}) {
  const exact = iconId && isMinimapIconId(iconId) ? iconId : undefined;
  const mapVariant = exact && map ? TRACKABLE_MARKER_BY_ID[exact]?.mapIcon : undefined;
  const resolved = mapVariant ?? exact ?? DEFAULT_PICKUP_ICON_BY_KIND[kind];

  if (!resolved) {
    if (!fallback) return null;
    return <span className={`isaac-sprite-fallback ${className}`.trim()} aria-hidden="true">{fallback}</span>;
  }

  return (
    <MinimapIconSprite
      id={resolved}
      scale={scale}
      className={`pickup-sprite ${className}`.trim()}
      dataAttribute={{ 'data-minimap-marker': resolved }}
    />
  );
}
