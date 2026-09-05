# TBOI Map Tracker

A fast visual floor-layout and dropped-pickup tracker for **The Binding of Isaac: Repentance+**.

> Live site: `https://alejandro-gz.github.io/TBOIMapTracker/`

## Why this exists

Isaac runs often leave useful resources behind: hearts, bombs, keys, chests, cards, pills, trinkets, pedestals and reroll opportunities. TBOI Map Tracker lets you reconstruct a floor quickly and attach that information directly to each room instead of keeping it in your head.

## Isaac-aware map model

- The on-grid floor is **13 × 13 cells** (169 grid indices, `0..168`).
- Main, secondary and Death Certificate dimensions are represented as **separate 13 × 13 grids**, matching the game's dimension model instead of pretending the map is larger.
- Supports the room shapes exposed by the Repentance API: `1x1`, `IH`, `IV`, `1x2`, `IIV`, `2x1`, `IIH`, `2x2` and the four L variants.
- Placement is rejected if a shape would overlap another room or leave the grid.
- Devil, Angel, Black Market and I AM ERROR can be represented visually, but are flagged in the UI as **off-grid internally**.
- The default map starts with a Starting Room at the center cell (`6,6`, grid index `84`) for fast manual reconstruction.

References used for the level model:

- https://wofsauge.github.io/IsaacDocs/rep/RoomDescriptor.html
- https://wofsauge.github.io/IsaacDocs/rep/Level.html
- https://wofsauge.github.io/IsaacDocs/rep/enums/RoomShape.html
- https://wofsauge.github.io/IsaacDocs/rep/enums/GridRooms.html

## Features

- 13 × 13 room editor.
- Click-to-place rooms using a room-type palette.
- Isaac-style minimap sprites for supported special room types and pickups.
- Drag rooms to reposition them.
- Arrow nudges in the inspector for precise movement.
- Real multi-cell room footprints and L rooms.
- Room type, visited state and notes.
- Dropped pickup tracking per room.
- Quick `+1` actions for coins, keys, bombs, hearts, chests and batteries.
- Generic support for cards, pills, runes, trinkets and collectibles/pedestals.
- Main / secondary / Death Certificate dimension tabs.
- Optional raw grid indices / edit guides.
- Local autosave through `localStorage`.
- Import/export of portable `.tboimap.json` files.
- Responsive desktop/tablet UI.
- CI with typecheck, tests and production build.
- GitHub Pages deployment workflow.

## Rendering architecture

The editor deliberately does **not** use Canvas, PixiJS or Konva. The map is small and deterministic enough that native browser primitives are cleaner:

- **React DOM** owns controls, accessibility and the 169 grid hit targets.
- **CSS Grid** gives both the interaction grid and the visual room layer the same 13 × 13 coordinate system.
- Every room is rendered **once** in a dedicated visual layer, rather than duplicating artwork inside each occupied cell.
- **SVG** performs exact spritesheet cropping for room silhouettes and icons. Each sprite uses a local zero-based viewport with the sheet translated underneath it, so pixels outside the selected frame cannot bleed into the map.
- Multi-cell and L-room icons use the centroid of the actually occupied cells, avoiding the missing quadrant of L shapes.

This keeps room/domain logic independent from rendering and avoids a game-engine dependency for a board with only 169 possible positions.

## Development

```bash
npm install
npm run dev
```

Validation:

```bash
npm run typecheck
npm test
npm run build
```

## Data format

The app stores a versioned document with independent room arrays per dimension:

```json
{
  "version": 1,
  "name": "Run 1",
  "floor": "Basement II",
  "seed": "ABCD EFGH",
  "dimensions": {
    "main": [
      {
        "anchor": { "x": 6, "y": 6 },
        "shape": "1x1",
        "type": "start",
        "visited": true,
        "pickups": []
      }
    ],
    "secondary": [],
    "death-certificate": []
  }
}
```

The tracker uses a top-left **tracker anchor** for its shape geometry. For some engine-level L-room details (notably the special `GridIndex` semantics of `ROOMSHAPE_LTL`), do not treat the exported anchor as a byte-for-byte replacement for `RoomDescriptor.GridIndex`.

## Minimap sprites / game assets

The UI has a sprite adapter in `src/components/IsaacSprite.tsx`. It renders 16×16 frames from MiniMAPI's extended minimap icon sheet for supported room types and pickups, while preserving lightweight text-symbol fallbacks for types without a reliable frame.

The upstream sprite sheet is pinned to a specific MiniMAPI revision and loaded at runtime; the PNG itself is **not committed to this repository**. That keeps the editor logic independent from the art layer and prevents an upstream update from silently changing the UI.

See [`ASSETS.md`](./ASSETS.md) for the exact revision, source paths, attribution and replacement instructions.

Users who want a fully self-contained/offline skin can extract their own Repentance+ resources with the game's `ResourceExtractor` and point the adapter at their local copy.

## GitHub Pages

`vite.config.ts` sets the project-site base path to `/TBOIMapTracker/`. Every push to `main` builds `dist/` and deploys it with the official GitHub Pages Actions flow.

If Pages has never been enabled for the repository, enable **Settings → Pages → Build and deployment → Source: GitHub Actions** once. After that, pushes to `main` deploy automatically.

## Roadmap

- Optional self-contained skin using user-extracted Repentance+ resources.
- Multiple floors grouped into a complete run.
- Undo / redo and keyboard room-type shortcuts.
- Optional secret-room candidate helpers (clearly marked as heuristics, not guarantees).
- Shareable compressed map URLs.
- Item database integration for collectible names/icons without coupling the editor core to one provider.
