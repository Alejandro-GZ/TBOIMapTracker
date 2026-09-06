# TBOI Map Tracker

A fast visual floor-layout and left-behind-content tracker for **The Binding of Isaac: Repentance+**.

> Live site: `https://alejandro-gz.github.io/TBOIMapTracker/`

## Why this exists

Isaac runs often leave useful resources behind: hearts, bombs, keys, chests, cards, pills, trinkets, pedestals, machines and reroll opportunities. TBOI Map Tracker lets you reconstruct a floor quickly and attach that information directly to each room instead of keeping it in your head.

## Isaac-aware map model

- The editable floor is **13 × 13 cells**.
- The current UI tracks the **main floor map only**.
- Supports `1x1`, `IH`, `IV`, `1x2`, `IIV`, `2x1`, `IIH`, `2x2` and all four L variants.
- Placement is rejected if a shape overlaps another room or leaves the grid.
- Room types expose only shapes that are valid for that tracker type.
- All **30 MiniMAPI room icons** in the local atlas are exposed by tracker room types, including Dirty Bedroom, Chest Room, Mirror Room, Rails Room, Red/Silver Treasure Rooms and Teleporter Room.
- Devil, Angel, Black Market and I AM ERROR can be represented visually even though they have special/off-grid engine semantics.
- A new map starts with the Starting Room at `(6,6)` / grid index `84`.

References:

- https://wofsauge.github.io/IsaacDocs/rep/RoomDescriptor.html
- https://wofsauge.github.io/IsaacDocs/rep/Level.html
- https://wofsauge.github.io/IsaacDocs/rep/enums/RoomShape.html
- https://wofsauge.github.io/IsaacDocs/rep/enums/RoomType.html

## Features

- 13 × 13 room editor with explicit **Move**, **Paint rooms** and **Erase rooms** modes.
- Choosing a room type automatically switches the map to **Paint** mode.
- In Paint mode, click/tap an empty cell for a `1x1`; drag a path for horizontal/vertical doubles, `2x2` and L footprints. Painting over an existing room is a no-op.
- In Move mode, select and drag existing rooms to reposition them.
- In Erase mode, click/tap any occupied cell to remove the whole room immediately; the inspector delete button also deletes without a confirmation dialog.
- Unified **Pointer Events** interaction engine for mouse, touch and stylus; room movement no longer depends on HTML Drag & Drop.
- Desktop mouse-wheel zoom plus `− / reset / +` controls and middle-button panning.
- Phone pinch-to-zoom/two-finger pan with editing gestures cancelled when a second finger appears.
- Browser-height workspace with local autosave through `localStorage`.
- Canonical **RoomShape** preview images from IsaacDocs for all 12 shapes.
- Local 1:1 **MiniMAPI room icons** from the project atlas, scaled only by integer factors.
- Blue/Red rooms reuse and recolour `R_NORMAL`; Black Market reuses and recolours `R_SHOP`.
- Exact pickup variants and structures/machines can be recorded per room.
- Left-behind contents are rendered directly inside rooms as well as editable in the inspector.
- Visual shape picker for corridor and L variants.
- Room type, visited state, notes and contents tracking.
- Optional dashed edit guides without per-cell numeric labels.
- Import/export of portable `.tboimap.json` files.
- PF Tempesta Seven Condensed for HUD-like UI and Upheaval for title treatment.
- CI with TypeScript, unit tests, production build and Playwright desktop/mobile browser checks.
- GitHub Pages deployment workflow.

## Mobile UX

Phones use a **map-first** layout instead of shrinking the desktop three-column interface:

- The map takes almost the entire available screen.
- A safe-area-aware bottom toolbar exposes **Move / Paint / Erase / Rooms** with large touch targets.
- The room palette opens as a bottom sheet and closes automatically after choosing a room type.
- Tapping a room in Move mode opens its inspector as a bottom sheet.
- Run/floor/seed editing is available from the compact header.
- Grid, Fit Map, import, export and new-map actions live in the overflow menu instead of consuming permanent map space.
- Portrait phones and low-height landscape phones use dedicated responsive layouts.

Touch contract:

| Mode | One finger | Two fingers |
| --- | --- | --- |
| Move | drag empty map to pan; tap room to inspect; drag room to move | pinch zoom / pan |
| Paint | tap/drag empty cells to create rooms; occupied rooms are a no-op | pinch zoom / pan |
| Erase | tap room to delete; drag empty map to pan | pinch zoom / pan |

When the second finger appears, any direct Paint/Move gesture is cancelled so zooming cannot accidentally edit the map.

## Rendering architecture

The editor deliberately does **not** use Canvas, PixiJS or Konva. A 169-cell deterministic map is cleaner with native browser primitives:

```text
MapViewport
├── InteractionGrid        React DOM, 13×13 hit targets
└── Minimap visual layers
    └── Room layer         CSS Grid; one element per room
        ├── RoomShape      canonical IsaacDocs preview PNG
        ├── RoomType       local MiniMAPI atlas sprite
        └── Contents       local pickup/structure atlas sprites
```

- **React DOM** owns controls, accessibility and Pointer Events.
- **CSS Grid** gives interaction and room layers the same 13 × 13 coordinate system.
- Every room is rendered once instead of duplicating art in every occupied cell.
- Room silhouettes use the pinned IsaacDocs RoomShape images directly.
- Room/pickup/structure icons use `src/assets/minimap-icons.png`, generated from the supplied 1:1 extractions of MiniMAPI's icon sheet.
- The atlas renderer uses integer scaling and `image-rendering: pixelated`; it never stretches width and height independently.
- Multi-cell and L-room type icons use the centroid of the occupied cells.
- Visible artificial door/neck connectors are not rendered.
- Desktop and mobile share the same store, geometry rules, palette and inspector components; only their containers/navigation differ.

See [`ASSETS.md`](./ASSETS.md) for runtime provenance and [`ICON_AUDIT.md`](./ICON_AUDIT.md) for the complete 88-icon semantic audit.

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

The Playwright suite exercises the real desktop UI and an actual mobile/touch browser context. Mobile checks cover the map-first shell, touch targets, Rooms sheet, Paint/Move/Erase workflow, Inspector sheet, overflow actions and phone landscape overflow constraints.

## Data format

The serialized format remains at version `1` for backwards compatibility. Its historical `dimensions` object is retained internally/import-export wise, but the current UI reads and edits `main` only.

Contents can optionally include an exact `iconId`; older documents without it still import and fall back to the generic icon for their `kind`.

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
        "pickups": [
          {
            "kind": "heart",
            "iconId": "P_FULLHEART",
            "label": "Red Heart",
            "quantity": 1
          }
        ]
      }
    ],
    "secondary": [],
    "death-certificate": []
  }
}
```

The tracker uses a top-left **tracker anchor** for its shape geometry. For some engine-level L-room details (notably the special `GridIndex` semantics of `ROOMSHAPE_LTL`), do not treat the exported anchor as a byte-for-byte replacement for `RoomDescriptor.GridIndex`.

## Visual assets

Runtime visual sources are intentionally small and explicit:

- **IsaacDocs** pinned RoomShape previews for room silhouettes.
- **Local MiniMAPI-derived atlas** for room, pickup and structure icons. All 88 audited icons are reachable at runtime.
- The three **local paper-menu PNGs** supplied for this tracker.
- Web-loaded PF Tempesta Seven and Upheaval fonts.

See [`ASSETS.md`](./ASSETS.md) for exact runtime provenance. `ICON_AUDIT.md` records how every uploaded icon was interpreted and where it is surfaced.

## GitHub Pages

`vite.config.ts` sets the project-site base path to `/TBOIMapTracker/`. Every push to `main` builds `dist/` and deploys it with the official GitHub Pages Actions flow.

## Roadmap

- Multiple floors grouped into a complete run.
- Undo / redo and keyboard room-type shortcuts.
- Optional secret-room candidate helpers, clearly marked as heuristics.
- Shareable compressed map URLs.
- Installable/offline PWA packaging with dedicated high-resolution app icons.
- Item database integration for collectible names/icons without coupling the editor core to one provider.
