# TBOI Map Tracker

A fast visual floor-layout and dropped-pickup tracker for **The Binding of Isaac: Repentance+**.

> Live site: `https://alejandro-gz.github.io/TBOIMapTracker/`

## Why this exists

Isaac runs often leave useful resources behind: hearts, bombs, keys, chests, cards, pills, trinkets, pedestals and reroll opportunities. TBOI Map Tracker lets you reconstruct a floor quickly and attach that information directly to each room instead of keeping it in your head.

## Isaac-aware map model

- The on-grid floor is **13 × 13 cells**.
- Main, secondary and Death Certificate dimensions are represented as separate 13 × 13 grids.
- Supports `1x1`, `IH`, `IV`, `1x2`, `IIV`, `2x1`, `IIH`, `2x2` and all four L variants.
- Placement is rejected if a shape overlaps another room or leaves the grid.
- Devil, Angel, Black Market and I AM ERROR can be represented visually but are flagged as off-grid internally.
- A new map starts with the Starting Room at `(6,6)` / grid index `84`.

References:

- https://wofsauge.github.io/IsaacDocs/rep/RoomDescriptor.html
- https://wofsauge.github.io/IsaacDocs/rep/Level.html
- https://wofsauge.github.io/IsaacDocs/rep/enums/RoomShape.html
- https://wofsauge.github.io/IsaacDocs/rep/enums/RoomType.html

## Features

- 13 × 13 room editor with coordinate axes outside the matrix.
- Click an empty cell for a `1x1`; drag across cells for `1x2`, `2x1` and `2x2`.
- Drag existing rooms to reposition them.
- Wheel zoom focused around the pointer, plus `− / reset / +` controls.
- Browser-height workspace: the page itself never scrolls; dense side panels scroll internally.
- **Canonical RoomShape preview images from IsaacDocs** for all 12 shapes.
- **Canonical RoomType icons from IsaacDocs** wherever the enum docs expose one.
- Dedicated minimap door layer between adjacent rooms.
- Dropped pickups rendered directly inside rooms as well as editable in the inspector.
- Visual shape picker for corridor and L variants.
- Room type, visited state, notes and pickup tracking.
- Main / secondary / Death Certificate dimensions.
- Optional edit guides without per-cell numeric labels.
- Local autosave through `localStorage`.
- Import/export of portable `.tboimap.json` files.
- PF Tempesta Seven Condensed for HUD-like UI and Upheaval for title treatment.
- CI with TypeScript, unit tests, production build and Playwright browser UI checks.
- GitHub Pages deployment workflow.

## Rendering architecture

The editor deliberately does **not** use Canvas, PixiJS or Konva. A 169-cell deterministic map is cleaner with native browser primitives:

```text
MapViewport
├── InteractionGrid        React DOM, 13×13 invisible hit targets
└── Minimap visual layers
    ├── Room layer         CSS Grid; one element per room
    │   ├── RoomShape      canonical IsaacDocs preview PNG
    │   ├── RoomType       canonical IsaacDocs RoomType icon
    │   └── Pickup layer   dropped resources visible in-room
    └── Door layer         explicit visual connections
```

- **React DOM** owns controls, accessibility and pointer interactions.
- **CSS Grid** gives interaction, room and door layers the same 13 × 13 coordinate system.
- Every room is rendered once instead of duplicating art in every occupied cell.
- Room shape/type art uses the pinned IsaacDocs images directly; it is not reconstructed with CSS and no blur/brightness/contrast filter is applied.
- Multi-cell and L-room type icons use the centroid of the occupied cells.
- Pickups are a separate skin, so room rendering is no longer coupled to MiniMAPI.

See [`ASSETS.md`](./ASSETS.md) for pinned revisions and provenance.

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

Browser/UI checks:

```bash
npx playwright install chromium
npm run test:visual
```

The Playwright suite uses the real UI to place rooms, drag large footprints, change an L shape through the inspector, add pickups and zoom the map. It also captures a representative map screenshot as a CI artifact (`map-visual-check`) so visual changes can be reviewed instead of inferred only from DOM tests.

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

## Visual assets

Room silhouettes and RoomType icons come from the same preview/icon images used by the pinned IsaacDocs revision. MiniMAPI is retained only as a secondary source for pickup icons not covered by those enum tables. No upstream PNG or font file is committed to this repository.

See [`ASSETS.md`](./ASSETS.md) for exact mappings and attribution.

## GitHub Pages

`vite.config.ts` sets the project-site base path to `/TBOIMapTracker/`. Every push to `main` builds `dist/` and deploys it with the official GitHub Pages Actions flow.

## Roadmap

- Optional self-contained skin using user-extracted Repentance+ resources.
- Multiple floors grouped into a complete run.
- Undo / redo and keyboard room-type shortcuts.
- Optional secret-room candidate helpers, clearly marked as heuristics.
- Shareable compressed map URLs.
- Item database integration for collectible names/icons without coupling the editor core to one provider.
