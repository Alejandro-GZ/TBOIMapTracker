# Visual asset provenance

TBOI Map Tracker keeps its map/domain model independent from game artwork. The current optional visual skin renders frames from MiniMAPI's extended minimap icon sheet at runtime.

## MiniMAPI sprite sheet

- Project: **MiniMAPI / MinimapAPI**
- Upstream repository: https://github.com/TazTxUK/MinimapAPI
- Pinned revision: `ca7ecb5a256887963129fa6314e8babb6a3d3cb6`
- Runtime sheet: `resources/gfx/ui/minimapapi/minimapapi_icons.png`
- Frame metadata source: `resources/gfx/ui/minimapapi_icons.anm2`

The PNG is **not copied into this repository**. `src/components/IsaacSprite.tsx` points at the immutable raw file for the revision above and crops individual 16×16 frames using the coordinates described by the matching `.anm2` file.

This prevents upstream changes from silently changing the UI and keeps the tracker functional when the sprite source is unavailable: every sprite has a text-symbol fallback.

## Rights / attribution

MiniMAPI is a community project by TazTxUK and contributors. The Binding of Isaac names, imagery and related game assets remain the property of their respective rights holders. This repository does not claim ownership over upstream or game artwork.

If a fully self-contained/offline skin is desired, users who own the game can extract their local Repentance+ resources with the official `ResourceExtractor` and replace the sprite-sheet URL in the adapter with their own locally hosted asset.
