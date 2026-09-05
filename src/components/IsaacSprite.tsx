import type { CSSProperties } from 'react';
import {
  DEFAULT_PICKUP_ICON_BY_KIND,
  MINIMAP_ICON_ATLAS_URL,
  ROOM_ICON_BY_TYPE,
  ROOM_ICON_VARIANT_CLASS,
  TRACKABLE_MARKER_BY_ID,
  type MinimapIconId,
} from '../domain/minimapIcons';
import {
  getMinimapIconFrame,
  MINIMAP_ICON_ATLAS_SIZE,
} from '../domain/minimapIconFrames';
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
  value.startsWith('P_') || value.startsWith('R_') || value.startsWith('S_');

function getIntegerScale(frame: { w: number; h: number }, requestedScale: number, fitSize?: number) {
  if (fitSize !== undefined) {
    return Math.max(1, Math.floor(fitSize / Math.max(frame.w, frame.h)));
  }
  return Math.max(1, Math.round(requestedScale));
}

/**
 * Pixel-perfect atlas renderer.
 *
 * The previous implementation rendered and scaled the whole 12×12 atlas cell.
 * The extracted sprites are only 4–9 px wide/high, so transparent padding made
 * small icons appear inconsistently tiny. We now clip to each sprite's exact
 * x/y/w/h bounds, then apply one integer scale to both axes. No distortion and
 * no interpolation are introduced by the icon renderer itself.
 */
export function MinimapIconSprite({
  id,
  scale = 2,
  fitSize,
  className = '',
  dataAttribute = {},
}: {
  id: MinimapIconId;
  scale?: number;
  fitSize?: number;
  className?: string;
  dataAttribute?: Record<string, string>;
}) {
  const frame = getMinimapIconFrame(id);
  const integerScale = getIntegerScale(frame, scale, fitSize);
  const width = frame.w * integerScale;
  const height = frame.h * integerScale;

  const frameStyle: CSSProperties = {
    position: 'relative',
    width,
    height,
    overflow: 'hidden',
    imageRendering: 'pixelated',
  };

  const atlasStyle: CSSProperties = {
    position: 'absolute',
    left: -frame.x * integerScale,
    top: -frame.y * integerScale,
    width: MINIMAP_ICON_ATLAS_SIZE.width * integerScale,
    height: MINIMAP_ICON_ATLAS_SIZE.height * integerScale,
    maxWidth: 'none',
    maxHeight: 'none',
    imageRendering: 'pixelated',
    pointerEvents: 'none',
  };

  return (
    <span
      className={`minimap-icon-sprite ${className}`.trim()}
      style={frameStyle}
      data-icon-id={id}
      data-source-width={frame.w}
      data-source-height={frame.h}
      data-pixel-scale={integerScale}
      aria-hidden="true"
      {...dataAttribute}
    >
      <img
        src={MINIMAP_ICON_ATLAS_URL}
        alt=""
        draggable={false}
        className="minimap-icon-atlas-image"
        style={atlasStyle}
        aria-hidden="true"
      />
    </span>
  );
}

export function RoomTypeSprite({
  type,
  fallback,
  scale = 2,
  fitSize,
  className,
}: {
  type: RoomTypeId;
  fallback?: string;
  scale?: number;
  fitSize?: number;
  className?: string;
}) {
  const iconId = ROOM_ICON_BY_TYPE[type];
  if (iconId) {
    return (
      <span className={`isaac-room-type-frame ${className ?? ''}`.trim()}>
        <MinimapIconSprite
          id={iconId}
          scale={scale}
          fitSize={fitSize}
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
  fitSize,
  className = '',
  map = false,
}: {
  kind: PickupKind;
  iconId?: string;
  fallback?: string;
  scale?: number;
  fitSize?: number;
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
      fitSize={fitSize}
      className={`pickup-sprite ${className}`.trim()}
      dataAttribute={{ 'data-minimap-marker': resolved }}
    />
  );
}
