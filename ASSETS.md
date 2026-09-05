# Visual asset provenance

This file documents **only artwork that the current app loads at runtime**. The semantic audit of the 88 extracted minimap icons is kept separately in [`ICON_AUDIT.md`](./ICON_AUDIT.md).

## Room silhouettes — IsaacDocs

The twelve room **shapes** remain the canonical previews used by IsaacDocs.

- Upstream: https://github.com/wofsauge/IsaacDocs
- Pinned revision: `646e1761addcc236081ad291fee20f3d04bbbf52`
- Source: `docs/images/roomshapes/{1..12}.png`
- Runtime adapter: `src/components/IsaacSprite.tsx`

They cover `1x1`, `IH`, `IV`, `1x2`, `IIV`, `2x1`, `IIH`, `2x2`, `LTL`, `LTR`, `LBL`, and `LBR`. RoomType icons are **not** loaded from IsaacDocs anymore.

## Room, pickup and structure icons — MiniMAPI

The app uses the 1:1 PNGs supplied for this project. Those PNGs were extracted from MiniMAPI's icon sheet:

- Upstream: https://github.com/TazTxUK/MinimapAPI
- Pinned upstream revision: `ca7ecb5a256887963129fa6314e8babb6a3d3cb6`
- Original sheet: `resources/gfx/ui/minimapapi/minimapapi_icons.png`
- Vendored atlas: `src/assets/minimap-icons.png`
- Atlas metadata/mappings: `src/domain/minimapIcons.ts`
- Runtime renderer: `src/components/IsaacSprite.tsx`

The local atlas is `120×108` and stores each source icon unmodified inside a `12×12` cell. Runtime rendering only uses **integer scaling** with `image-rendering: pixelated`; icons are never stretched independently on X/Y, blurred, or resampled to a different aspect ratio.

All **88 audited icons are reachable at runtime**: 42 pickup/chest sprites, 30 room sprites and 16 structure/machine sprites. The room palette now exposes every room drawing present in the atlas, including Dirty Bedroom (`R_BARREN`), Chest Room (`R_CHEST`), Mirror Room (`R_MIRROR`), Rails Room (`R_RAILS`), Red Treasure (`R_RTREASURE`), Silver Treasure (`R_STREASURE`) and Teleporter Room (`R_TELEPORTER`). `R_CRAWLSPACE` is used for Secret Exit and `R_UNKNOWN` for Other.

To avoid any possible atlas-edge sampling on the tiniest structure sprites, the following re-supplied source PNGs are also vendored individually and rendered directly:

```text
src/assets/minimap-icons/S_BEGGAR.png
src/assets/minimap-icons/S_BLOODDONATION.png
src/assets/minimap-icons/S_BOMBBEGGAR.png
src/assets/minimap-icons/S_CHARGEBEGGAR.png
src/assets/minimap-icons/S_CONFESIONARY.png
src/assets/minimap-icons/S_CRANE.png
src/assets/minimap-icons/S_DONATION.png
src/assets/minimap-icons/S_DRESSER.png
```

These direct files are still scaled only by integer nearest-neighbour factors. No runtime tint, hue rotation, opacity change or blend mode is applied to them.

Blue and Red rooms deliberately reuse `R_NORMAL` with the existing colour treatment; Black Market reuses `R_SHOP` with its dark red/black treatment. The contents selector exposes the associated pickup and structure sprites from the uploaded set. Chest `*ALT` images are used as the small on-map representation of their corresponding chest while the primary image is used in controls/list rows.

## Tracker app icon

`public/app-icon.png` is the Blue Map icon supplied for this project. It is used only by the TBOIMapTracker page as the header mark and favicon; it does not modify the favicon of the root `alejandro-gz.github.io` site.

## Paper menu chrome — local project assets

The current paper UI uses only the three local images supplied specifically for this tracker:

```text
src/assets/ui/menu-top.png
src/assets/ui/menu-left.png
src/assets/ui/menu-right.png
```

No external paper/menu image mirror is loaded by the current UI.

## Fonts

The CSS imports the web versions of:

- **PF Tempesta Seven / Condensed** — primary HUD/UI text.
- **Upheaval** — prominent headings/branding.

Font files are not redistributed by this repository.

## Rights / attribution

MiniMAPI and IsaacDocs are community projects. The Binding of Isaac names, imagery and related game assets remain the property of their respective rights holders. The tracker does not claim ownership of those assets.
