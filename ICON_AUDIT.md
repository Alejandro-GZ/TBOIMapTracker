# Extracted minimap icon audit

The uploaded set contains **88** 1:1 pixel-art PNGs: **42 `P_`**, **30 `R_`**, and **16 `S_`**. Associations were checked against the Binding of Isaac wiki/RoomType naming and MiniMAPI's own icon data.

Summary:

- **83 direct semantic associations** to a room, pickup, trinket, machine/structure, or other named game concept.
- **4 aliases** (`*ALT`) that are alternate map drawings of the same chest entity, not separate wiki entities.
- **1 placeholder** (`R_UNKNOWN`) that represents an unknown/unrevealed room rather than a distinct room type.
- **All 88 icon IDs are currently reachable in the tracker runtime** as room icons, exact contents markers, chest map alternates, or the generic Other/unknown room marker.

Primary references:

- Binding of Isaac room icon index: https://bindingofisaacrebirth.wiki.gg/wiki/Category:Room_icons
- Binding of Isaac wiki: https://bindingofisaacrebirth.wiki.gg/
- IsaacDocs `RoomType`: https://wofsauge.github.io/IsaacDocs/rep/enums/RoomType.html
- MiniMAPI source sheet: https://github.com/TazTxUK/MinimapAPI/blob/ca7ecb5a256887963129fa6314e8babb6a3d3cb6/resources/gfx/ui/minimapapi/minimapapi_icons.png
- MiniMAPI icon data: https://github.com/TazTxUK/MinimapAPI/blob/ca7ecb5a256887963129fa6314e8babb6a3d3cb6/scripts/minimapapi/data.lua

`Runtime` means the icon ID is currently reachable in the app either as a room icon, an exact contents marker, an on-map alternate, or the generic Other room marker.

## Pickups

| File | Association | Status | Runtime |
|---|---|---|---|
| `P_ADAPTIVEHEART` | Blended Heart | direct | yes |
| `P_BATTERY` | Lil' Battery | direct | yes |
| `P_BIGCHEST` | Mega Chest | direct | yes |
| `P_BLACKSACK` | Black Sack | direct | yes |
| `P_BOMB` | Bomb | direct | yes |
| `P_BONEHEART` | Bone Heart | direct | yes |
| `P_CARD` | Card | direct | yes |
| `P_CHARGEDKEY` | Charged Key | direct | yes |
| `P_CHEST` | Chest | direct | yes |
| `P_CHESTALT` | Chest — alternate map drawing | alias | yes |
| `P_DIME` | Dime | direct | yes |
| `P_ETERNALHEART` | Eternal Heart | direct | yes |
| `P_FULLDEVILHEART` | Black Heart | direct | yes |
| `P_FULLHEART` | Red Heart | direct | yes |
| `P_FULLSOULHEART` | Soul Heart | direct | yes |
| `P_GOLDCHEST` | Locked Chest / Golden Chest | direct | yes |
| `P_GOLDCHESTALT` | Locked Chest — alternate map drawing | alias | yes |
| `P_GOLDENBATTERY` | Golden Battery | direct | yes |
| `P_GOLDENBOMB` | Golden Bomb | direct | yes |
| `P_GOLDENHEART` | Golden Heart | direct | yes |
| `P_GOLDENKEY` | Golden Key | direct | yes |
| `P_GOLDENPILL` | Golden Pill | direct | yes |
| `P_HALFHEART` | Half Red Heart | direct | yes |
| `P_HALFSOULHEART` | Half Soul Heart | direct | yes |
| `P_ITEM` | Collectible pedestal/item | direct | yes |
| `P_KEY` | Key | direct | yes |
| `P_MOMCHEST` | Mom's Chest | direct | yes |
| `P_NICKEL` | Nickel | direct | yes |
| `P_PENNY` | Penny | direct | yes |
| `P_PILL` | Pill | direct | yes |
| `P_POCKERCHIP` | Poker Chip trinket | direct; filename typo upstream/extraction | yes |
| `P_REDCHEST` | Red Chest | direct | yes |
| `P_REDCHESTALT` | Red Chest — alternate map drawing | alias | yes |
| `P_ROTTENHEART` | Rotten Heart | direct | yes |
| `P_RUNE` | Rune | direct | yes |
| `P_SACK` | Sack | direct | yes |
| `P_SILVERCHEST` | Eternal Chest | direct | yes |
| `P_SPIKECHEST` | Spiked Chest | direct | yes |
| `P_STONECHEST` | Stone Chest | direct | yes |
| `P_TRINKET` | Trinket | direct | yes |
| `P_WOODCHEST` | Wooden Chest | direct | yes |
| `P_WOODCHESTALT` | Wooden Chest — alternate map drawing | alias | yes |

## Rooms

| File | Association | Status | Runtime |
|---|---|---|---|
| `R_ANGEL` | Angel Room | direct | yes |
| `R_ARCADE` | Arcade | direct | yes |
| `R_BARREN` | Dirty Bedroom / `ROOM_BARREN` | direct | yes (`Dirty bedroom`) |
| `R_BCHALLENGE` | Boss Challenge Room | direct | yes |
| `R_BOSS` | Boss Room | direct | yes |
| `R_CHEST` | Chest Room / `ROOM_CHEST` | direct | yes (`Chest room`) |
| `R_CRAWLSPACE` | Crawl Space / `ROOM_DUNGEON` | direct | yes (`Secret exit`) |
| `R_CURSE` | Curse Room | direct | yes |
| `R_DEVIL` | Devil Room | direct | yes |
| `R_DICE` | Dice Room | direct | yes |
| `R_ERROR` | I AM ERROR Room / `ROOM_ERROR` | direct | yes |
| `R_ISAACS` | Clean Bedroom / `ROOM_ISAACS` | direct | yes (`Bedroom`) |
| `R_LIBRARY` | Library | direct | yes |
| `R_MINIBOSS` | Miniboss Room | direct | yes |
| `R_MIRROR` | Mirror Room | direct | yes (`Mirror room`) |
| `R_NCHALLENGE` | Challenge Room | direct | yes |
| `R_NORMAL` | Normal/default room / `ROOM_DEFAULT` | direct | yes; also source for Blue/Red recolours |
| `R_PLANETARIUM` | Planetarium | direct | yes |
| `R_RAILS` | Mine Cart / rails room | direct | yes (`Rails room`) |
| `R_RTREASURE` | Devil/Red Treasure Room | direct | yes (`Red treasure`) |
| `R_SACRIFICE` | Sacrifice Room | direct | yes |
| `R_SECRET` | Secret Room | direct | yes |
| `R_SHOP` | Shop | direct | yes; also source for Black Market recolour |
| `R_START` | Starting Room | direct | yes |
| `R_STREASURE` | Silver Treasure Room | direct | yes (`Silver treasure`) |
| `R_SUPERSECRET` | Super Secret Room | direct | yes |
| `R_TELEPORTER` | Teleporter Room / `ROOM_TELEPORTER` | direct | yes (`Teleporter room`) |
| `R_TREASURE` | Treasure Room | direct | yes |
| `R_ULTRASECRET` | Ultra Secret Room | direct | yes |
| `R_UNKNOWN` | Unknown/unrevealed room marker | placeholder, not a distinct wiki room | yes (`Other`) |

Blue and Red rooms deliberately reuse `R_NORMAL` and are recoloured in CSS. Black Market deliberately reuses `R_SHOP` with the existing black/red treatment, because the uploaded set does not include a dedicated Black Market sprite.

## Structures and machines

| File | Association | Status | Runtime |
|---|---|---|---|
| `S_BEGGAR` | Beggar | direct | yes |
| `S_BLOODDONATION` | Blood Donation Machine | direct | yes |
| `S_BOMBBEGGAR` | Bomb Bum | direct | yes |
| `S_CHARGEBEGGAR` | Battery Bum | direct | yes |
| `S_CONFESIONARY` | Confessional | direct; filename typo | yes |
| `S_CRANE` | Crane Game | direct | yes |
| `S_DONATION` | Donation Machine | direct | yes |
| `S_DRESSER` | Mom's Dressing Table | direct | yes |
| `S_EVILBEGGAR` | Devil Beggar | direct | yes |
| `S_FORTUNETELLER` | Fortune Telling Machine | direct | yes |
| `S_GOLDENCOIN` | Golden Penny / MiniMAPI `GoldenCoin` | direct; semantically a pickup despite `S_` prefix | yes |
| `S_KEYBEGGAR` | Key Master | direct | yes |
| `S_POOP` | Poop | direct | yes |
| `S_REROLL` | Reroll Machine | direct | yes |
| `S_ROTTENBEGGAR` | Rotten Beggar | direct | yes |
| `S_SLOT` | Slot Machine | direct | yes |

## Runtime policy

The atlas preserves every uploaded PNG at its original pixel dimensions and centres it in a `12×12` cell. Rendering uses integer multiples only. Exact pickup/structure choices are persisted as `Pickup.iconId`; old tracker JSON files without `iconId` remain valid and fall back to the generic icon for their `PickupKind`.
