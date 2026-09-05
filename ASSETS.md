# Visual asset provenance

TBOI Map Tracker keeps its map/domain model independent from artwork. The actual floor map uses the same **RoomShape previews** and **RoomType icons** shown by IsaacDocs, pinned to one documentation revision. Pickup icons remain a separate secondary skin because the RoomShape/RoomType tables do not cover pickups.

## Canonical room visuals — IsaacDocs

- Project: **BoI Lua API Docs / IsaacDocs**
- Upstream repository: https://github.com/wofsauge/IsaacDocs
- Pinned revision: `646e1761addcc236081ad291fee20f3d04bbbf52`
- RoomShape enum source: `docs/enums/RoomShape.md`
- RoomType enum source: `docs/enums/RoomType.md`

### RoomShape previews

Runtime assets are loaded from:

```text
docs/images/roomshapes/1.png  -> ROOMSHAPE_1x1
docs/images/roomshapes/2.png  -> ROOMSHAPE_IH
docs/images/roomshapes/3.png  -> ROOMSHAPE_IV
docs/images/roomshapes/4.png  -> ROOMSHAPE_1x2
docs/images/roomshapes/5.png  -> ROOMSHAPE_IIV
docs/images/roomshapes/6.png  -> ROOMSHAPE_2x1
docs/images/roomshapes/7.png  -> ROOMSHAPE_IIH
docs/images/roomshapes/8.png  -> ROOMSHAPE_2x2
docs/images/roomshapes/9.png  -> ROOMSHAPE_LTL
docs/images/roomshapes/10.png -> ROOMSHAPE_LTR
docs/images/roomshapes/11.png -> ROOMSHAPE_LBL
docs/images/roomshapes/12.png -> ROOMSHAPE_LBR
```

### RoomType icons

The adapter maps tracker room types to the corresponding IsaacDocs `roomtypes/<value>.png` image where the docs expose one. Examples include Shop `2`, Treasure `4`, Boss `5`, Secret `7`, Super Secret `8`, Curse `10`, Library `12`, Sacrifice `13`, Devil `14`, Angel `15`, Dice `21`, Planetarium `24`, and Ultra Secret `29`. Boss Challenge uses the dedicated challenge icon `17` documented in the RoomType table.

Normal and Starting rooms intentionally render no additional type glyph. Tracker-only/off-grid types without a canonical RoomType icon keep a text fallback in controls, but the map itself does not invent a fake game icon.

The PNGs are **not copied into this repository**. `src/components/IsaacSprite.tsx` references immutable raw URLs for the pinned IsaacDocs commit.

## Isaac paper/menu chrome

The web UI uses the game's parchment-style menu art as visual chrome instead of recreating the paper edges from generic CSS. The files are loaded from the public `clorc/gmaes` asset mirror and are pinned to an immutable revision so the site cannot change when that mirror's `main` branch changes.

- Upstream mirror: https://github.com/clorc/gmaes
- Pinned revision: `68228383cc8e4c0f25b73bd163cd4e4828dde0f8`
- Source directory: `isaac/assets/sprites/main_menu/AB+/`
- `emptyscreen.png` — large blank parchment used by side panels
- `endingsmenupaper.png` — smaller paper sheet used for compact HUD strips
- `menuoverlay.png` — subtle menu texture/doodles mixed into the paper
- `menushadow.png` — documented as part of the source set and retained as the canonical menu-shadow reference

The CSS implementation lives in `src/isaac-paper-ui.css`. Runtime URLs include the pinned commit SHA rather than `main`.

The same asset names are also listed by The Spriters Resource's Rebirth main-menu asset index and by Steam depot listings, which is useful for cross-checking the extracted-resource names.

## Pickup skin — MiniMAPI

Pickups are a separate layer and currently use MiniMAPI's minimap icon sheet because the two IsaacDocs enum tables used for canonical room rendering do not define pickup art.

- Upstream repository: https://github.com/TazTxUK/MinimapAPI
- Pinned revision: `ca7ecb5a256887963129fa6314e8babb6a3d3cb6`
- Runtime sheet: `resources/gfx/ui/minimapapi/minimapapi_icons.png`

MiniMAPI is **not** used for RoomShape silhouettes or RoomType icons.

## Fonts

The UI uses fonts that IsaacDocs documents as game fonts:

- **PF Tempesta Seven (Condensed)** — HUD elements such as coin/key counters; used as the default tracker UI font.
- **Upheaval** — streak/title treatment; used only for prominent headings and the brand.

The app loads web-font CSS at runtime and does not redistribute font files in the repository.

## Rights / attribution

IsaacDocs, MiniMAPI, and the public asset mirror are community projects. The Binding of Isaac names, imagery and related game assets remain the property of their respective rights holders. This repository does not claim ownership over upstream or game artwork.

Users who want a fully self-contained/offline skin can extract their own Repentance+ resources with the game's `ResourceExtractor` and point the visual adapter at their locally hosted copies.
