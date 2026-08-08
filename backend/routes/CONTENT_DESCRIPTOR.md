# Steam `content_descriptorids` Findings

Valve rolled out content-descriptor tagging around 2018. Labels below are purely guessing against an official source, **except ID 3**, which is confirmed empirically: every game whose main focus is explicit sexual content carries it, and every mature-but-not-porn game tested doesn't. The line isn't thin, it's easy to see which games are nudity/sex-focused vs. which merely include it.

Also worth knowing:

- All of this is ancedots.
- These are self-reported by the developers on Steam.
- Can be inconsistent (see GTA V, Fallout 1/2 below), if the developer never filled out or never had to fill out Valve's survey.

## Descriptor labels

| ID  | Label                             |
| --- | --------------------------------- |
| 1   | SOME_NUDITY_OR_SEXUAL_CONTENT     |
| 2   | FREQUENT_VIOLENCE_OR_GORE         |
| 3   | ADULT_ONLY_SEXUAL_CONTENT         |
| 4   | FREQUENT_NUDITY_OR_SEXUAL_CONTENT |
| 5   | GENERAL_MATURE_CONTENT            |

## Games tested

| Game                                          | AppID                                  | Descriptors        | Notes                                                                                                                                                   |
| --------------------------------------------- | -------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baldur's Gate 3                               | 1086940                                | `[1, 2, 5]`        |                                                                                                                                                         |
| Cyberpunk 2077                                | 1091500                                | `[1, 2, 5]`        |                                                                                                                                                         |
| Skyrim                                        | 72850                                  | `[1, 5]`           |                                                                                                                                                         |
| Skyrim Special Edition                        | 489830                                 | `[1, 5]`           |                                                                                                                                                         |
| Fallout 1                                     | 38400                                  | _(none)_           | Unclear why, game is highly mature and explores violent themes.                                                                                         |
| Fallout 2                                     | 38410                                  | _(none)_           | Ditto, no restraint on themes like slavery and sexual violence, even in text form.                                                                      |
| Fallout 4                                     | 377160                                 | `[2, 5]`           |                                                                                                                                                         |
| GTA V                                         | 271590                                 | `[5]`              | Game is well known for violence and sexual content, even if its not the main focus, but lacks the flagging, is this only done based developer's report? |
| Five Nights at Freddy's 1-4 + Sister Location | 319510, 332800, 354140, 388090, 506610 | _(none, all five)_ | Games were released before 2018, I'm guessing they never were in need to flag games if they have some mature themes.                                    |
| Overwatch                                     | 2357570                                | _(none)_           |                                                                                                                                                         |
| DOOM (2016)                                   | 379720                                 | `[2, 5]`           |                                                                                                                                                         |
| DOOM Eternal                                  | 782330                                 | `[2, 5]`           |                                                                                                                                                         |
| Corpse Party (2011)                           | 251270                                 | `[2, 5]`           |                                                                                                                                                         |
| Corpse Party (2021)                           | 1273260                                | `[1, 2, 5]`        | Remaster of the 2011 version, almost no difference.                                                                                                     |
| The Forest                                    | 242760                                 | `[1, 2, 5]`        |                                                                                                                                                         |
| HuniePop                                      | 339800                                 | `[1, 3, 4, 5]`     |                                                                                                                                                         |
| HuniePop 2: Double Date                       | 930210                                 | `[1, 3, 4, 5]`     |                                                                                                                                                         |
| Hentai Demon                                  | 1097520                                | `[1, 3, 4, 5]`     |                                                                                                                                                         |
| HENTAI EXOTICA                                | 1099530                                | `[1, 3, 4, 5]`     |                                                                                                                                                         |
| Hentai X                                      | 1650020                                | `[1, 3, 4, 5]`     |                                                                                                                                                         |
| Hentai hentai                                 | 1236400                                | `[1, 3, 4, 5]`     |                                                                                                                                                         |

## Sample: 50 games with "sex" in the name

Pulled live from the local catalog + Steam's GetItems.

| Descriptor               | Hits / 50 |
| ------------------------ | --------- |
| 1 (some nudity)          | 47        |
| 2 (violence and/or gore) | 2         |
| 3 (adult only sexual)    | 46        |
| 4 (frequent nudity)      | 46        |
| 5 (general mature)       | 47        |
| _(none)_                 | 3         |

92% carried both 3 and 4 together. The 3 with no descriptors at all:

- "Furry Shakespeare: Dashing Dinosaurs & Sexy Centaurs: Winter's Tale" (1152210)
- "Sexy Anime girls for Super Minesweeper
  attACK" (1165130)
- "3D lover - Sexy Costumes" (2082550)

Likely low-effort/asset-flip titles that never went through Valve's content review.

## Conclusion

`3` (and `4`, which never appeared without `3` in any test) is the only reliable signal for "this game's whole purpose is porn." `1`, `2`, and `5` show up inconsistently across both mature and non-mature games and don't reliably indicate anything on their own. The RPC on supabase `search_steam_apps` filters on `3` alone for exactly this reason.

