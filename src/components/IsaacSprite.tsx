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
  MINIMAP_ICON_FRAMES,
  MINIMAP_ICON_ATLAS_SIZE,
} from '../domain/minimapIconFrames';
import type { PickupKind, RoomShapeId, RoomTypeId } from '../domain/types';

/**
 * Room silhouettes keep using the canonical RoomShape preview images from the
 * pinned IsaacDocs revision. Everything that sits on top of a room (room type,
 * pickups and structures) comes from the locally vendored MiniMAPI artwork.
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
  Object.prototype.hasOwnProperty.call(MINIMAP_ICON_FRAMES, value);

/**
 * These are the exact 1:1 PNGs re-supplied by the user. Render them directly
 * instead of sampling them back out of the combined atlas. Apart from being
 * simpler, this removes any possibility of neighbouring atlas pixels bleeding
 * into these tiny 7–9 px sprites when the browser scales the sheet.
 */
const DIRECT_MINIMAP_ICON_URLS: Partial<Record<MinimapIconId, string>> = {
  S_BEGGAR: new URL('../assets/minimap-icons/S_BEGGAR.png', import.meta.url).href,
  S_BLOODDONATION: new URL('../assets/minimap-icons/S_BLOODDONATION.png', import.meta.url).href,
  S_BOMBBEGGAR: new URL('../assets/minimap-icons/S_BOMBBEGGAR.png', import.meta.url).href,
  S_CHARGEBEGGAR: new URL('../assets/minimap-icons/S_CHARGEBEGGAR.png', import.meta.url).href,
  S_CONFESIONARY: new URL('../assets/minimap-icons/S_CONFESIONARY.png', import.meta.url).href,
  S_CRANE: new URL('../assets/minimap-icons/S_CRANE.png', import.meta.url).href,
  S_DONATION: new URL('../assets/minimap-icons/S_DONATION.png', import.meta.url).href,
  S_DRESSER: new URL('../assets/minimap-icons/S_DRESSER.png', import.meta.url).href,
};

function getTargetSize(requestedScale: number, fitSize?: number) {
  return Math.max(1, Math.round(fitSize ?? Math.max(1, requestedScale) * 12));
}

function getIntegerScale(frame: { w: number; h: number }, targetSize: number) {
  return Math.max(1, Math.floor(targetSize / Math.max(frame.w, frame.h)));
}

/**
 * Pixel-perfect icon renderer.
 *
 * Every icon is laid out inside a stable target box and scaled by one integer
 * multiplier on both axes. The eight re-supplied structure PNGs are rendered
 * directly from their own files; all remaining icons use exact atlas frames.
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
  const targetSize = getTargetSize(scale, fitSize);
  const integerScale = getIntegerScale(frame, targetSize);
  const renderedWidth = frame.w * integerScale;
  const renderedHeight = frame.h * integerScale;
  const directUrl = DIRECT_MINIMAP_ICON_URLS[id];

  const boxStyle: CSSProperties = {
    position: 'relative',
    display: 'grid',
    placeItems: 'center',
    width: targetSize,
    height: targetSize,
    overflow: 'hidden',
    lineHeight: 0,
    imageRendering: 'pixelated',
  };

  const cropStyle: CSSProperties = {
    position: 'relative',
    display: 'block',
    width: renderedWidth,
    height: renderedHeight,
    overflow: 'hidden',
    flex: '0 0 auto',
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

  const directStyle: CSSProperties = {
    display: 'block',
    width: renderedWidth,
    height: renderedHeight,
    maxWidth: 'none',
    maxHeight: 'none',
    objectFit: 'fill',
    imageRendering: 'pixelated',
    filter: 'none',
    opacity: 1,
    mixBlendMode: 'normal',
    pointerEvents: 'none',
  };

  return (
    <span
      className={`minimap-icon-sprite ${className}`.trim()}
      style={boxStyle}
      data-icon-id={id}
      data-source-width={frame.w}
      data-source-height={frame.h}
      data-pixel-scale={integerScale}
      data-render-width={renderedWidth}
      data-render-height={renderedHeight}
      data-render-source={directUrl ? 'direct' : 'atlas'}
      aria-hidden="true"
      {...dataAttribute}
    >
      {directUrl ? (
        <img
          src={directUrl}
          alt=""
          draggable={false}
          className="minimap-icon-direct-image"
          style={directStyle}
          aria-hidden="true"
        />
      ) : (
        <span className="minimap-icon-crop" style={cropStyle}>
          <img
            src={MINIMAP_ICON_ATLAS_URL}
            alt=""
            draggable={false}
            className="minimap-icon-atlas-image"
            style={atlasStyle}
            aria-hidden="true"
          />
        </span>
      )}
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
