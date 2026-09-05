# Visual asset provenance

TBOI Map Tracker keeps its map/domain model independent from game artwork. The current visual skin renders room silhouettes, room-type icons and pickup icons from MiniMAPI assets at runtime.

## MiniMAPI sprite sheets

- Project: **MiniMAPI / MinimapAPI**
- Upstream repository: https://github.com/TazTxUK/MinimapAPI
- Pinned revision: `ca7ecb5a256887963129fa6314e8babb6a3d3cb6`

### Room and pickup icons

- Runtime sheet: `resources/gfx/ui/minimapapi/minimapapi_icons.png`
- Frame metadata: `resources/gfx/ui/minimapapi_icons.anm2`
- Frame size used by the tracker: `16 × 16`

### Room silhouettes

- Runtime sheet: `resources/gfx/ui/minimapapi/custom_minimap2.png`
- Frame metadata: `resources/gfx/ui/minimapapi/custom_minimap2.anm2`
- The 12 animation frames map in RoomShape enum order to `1x1`, `IH`, `IV`, `1x2`, `IIV`, `2x1`, `IIH`, `2x2`, `LTL`, `LTR`, `LBL`, and `LBR`.

The PNGs are **not copied into this repository**. `src/components/IsaacSprite.tsx` points at immutable raw files for the pinned revision and crops the appropriate frames using coordinates from the matching `.anm2` files. Room silhouettes are rendered through a cropped SVG view so they can scale cleanly with the responsive 13 × 13 editor while preserving the pixel-art source.

This prevents upstream changes from silently changing the UI. Room/pickup type sprites keep text-symbol fallbacks where no reliable frame is mapped.

## Rights / attribution

MiniMAPI is a community project by TazTxUK and contributors. The Binding of Isaac names, imagery and related game assets remain the property of their respective rights holders. This repository does not claim ownership over upstream or game artwork.

If a fully self-contained/offline skin is desired, users who own the game can extract their local Repentance+ resources with the official `ResourceExtractor` and replace the sprite-sheet URLs in the adapter with their own locally hosted assets.
