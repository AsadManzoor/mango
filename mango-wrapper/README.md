# Mango Shake × Boy Wonder — Notion wrapper

A read-only "shoujo manga volume" front end for your Notion page. Notion stays the single source of truth;
the site re-reads it every 60 seconds (and whenever you return to the tab).

```
index.html        the whole site (splash, chapters, sub-pages, Gaja guide)
assets/gaja/      Gaja's nine layers (01 hair … 09 eyelids), cropped to one shared frame
assets/gaja.png   old flat sprite (no longer used)
assets/music/     the playlist (01-… to 07-…, played in number order)
assets/cover.jpg  your Notion page cover (starting banner; the live cover replaces it)
api/notion.js     reads the six databases + the main page cover
api/thumbs.js     finds the first photo inside a date page (Memory Lane fallback thumbnail)
api/_maps.js      turns Google Maps links into embeddable maps
api/page.js       reads one sub-page (photos, text, videos) when you open it
api/_notion.js    shared helpers (not a route)
DESIGN.md         colours, shapes and motion rules
```

## Setup (about 10 minutes, all free)

The Notion API and internal integrations are available on the free Notion plan, and Vercel's Hobby plan is free.

### 1. Create a Notion integration
1. Go to https://www.notion.so/profile/integrations and choose **New integration**.
2. Type: **Internal**. Name it e.g. "Mango Wrapper". Capabilities: **Read content** only.
3. Copy the **Internal Integration Secret**. Treat it like a password.

### 2. Give it access to your page
Open "Mango Shake | Boy Wonder" in Notion → **•••** (top right) → **Connections** → add "Mango Wrapper".
Access cascades to all six databases on the page.

### 3. Deploy on Vercel
1. Put this folder in a GitHub repo (or use the Vercel CLI: `npx vercel` inside the folder).
2. Import the repo at https://vercel.com/new (framework preset: **Other**).
3. Under **Environment Variables** add `NOTION_TOKEN` = your secret. Deploy.

Your site is now live and syncing. Never put the token in `index.html`.

### Optional
- If you ever rebuild a database, override its ID with `DB_DATES`, `DB_ACTIVITIES`, `DB_TRAVEL`, `DB_SHOWS`, `DB_MOVIES` or `DB_BOOKS`.
- Set a cover on any item's page in Notion ("Add cover") and it becomes that item's poster or thumbnail.
- Without the API (e.g. opening `index.html` directly) the site shows demo data and says "demo data" in the header.

## Notes
- Notion image URLs expire after about an hour; the page refreshes them on each sync.
- Gaja is a single flat image, so her animation is whole-body (follow, bob, tilt, wiggle). A layered file would unlock blinking and rat reactions.

## Update notes (Nov 2026)
- Thumbnails now come from each item's **Cover Image** (the Notion page cover). Notion-hosted covers expire after about an hour, so the page retries once with a fresh link and falls back to a colour block.
- Calendar days show the event names (multi-day trips span their days); stray HTML like `<b>` in titles is stripped.
- `/api/notion` also returns `banner` (the main page cover) and each item's Notion `url`, ready for the sub-page and banner work.
- Polish pass from the Vercel Web Interface Guidelines and Emil Kowalski's animation rules: visible focus rings, press feedback, hover only on devices that hover, skip link, real buttons for calendar days, `Intl` dates and currency, no layout reads in Gaja's animation loop.
**Redeploy:** replace `api/notion.js` and `index.html` in your repo and push; Vercel redeploys automatically.

## Midnight Matinee update
- New dark gothic-shoujo design (see DESIGN.md), a banner from your page cover, and a Memory Lane of past dates.
- Every date, activity, trip, show, movie and book opens its own Notion sub-page at `#/p/<id>`: photos (tap for a viewer), text, YouTube videos, map links. Fetched fresh each time, so expiring photo links stay valid.
- **Redeploy:** add/replace `index.html`, `api/notion.js`, `api/page.js`, `api/_notion.js`, `assets/cover.jpg` and push. Sub-pages need the integration connected to the main page (already done).

## Update (Memory Lane thumbs, mentions, debrief)
- Memory Lane thumbnails: the date's page cover, else the first photo inside the page (`/api/thumbs`).
- Short splash: Gaja pops in, petals fall and wipe the intro away. "Skip intro" is always there.
- Tap Gaja: she holds still for 10 seconds and the icons sit above her.
- The Back button stays pinned while you scroll a sub-page.
- Notion mentions (page links, link previews, dates, people) show as small pills. Mentions of pages in your databases open inside the wrapper.
- Activities: new "Debrief written" filter. The Gaja sticker under "Debrief" opens the matching Memory Lane page (uses the image's link, else the date with the same name).
- **Redeploy:** replace `index.html`, `api/page.js` and add `api/thumbs.js`; push.

## Update (music + maps)
- Music player pinned bottom-left: previous, play/pause, next, stop, volume. The playlist is `assets/music/01…07`, loops, fades in over ~4 seconds and keeps playing as you move between pages. It tries to autoplay the moment the page loads. Browsers (especially Safari/iOS and first-time Chrome visitors) refuse sound before any tap, so in that case a "Tap to enter" screen appears first and the tap starts the music, then the intro runs. If music was stopped last time, there is no gate. Stop/pause is remembered for next visit.
- To change the playlist, add files to `assets/music/` and edit the `TRACKS` list in `index.html`.
- Google Maps embeds/links on Notion pages now show as live maps (short `maps.app.goo.gl` links are expanded server-side). Directions links can't be embedded and stay as links.
- **Redeploy:** replace `index.html`, `api/page.js`; add `api/_maps.js` and the `assets/music/` folder (about 23 MB); push.

## Update (layered Gaja)
- Gaja is now built from your nine layers, stacked in one frame so each piece can move on its own pivot (`mountGaja()` in `index.html`).
- Splash (about 8 seconds, skippable): legs, body, hair, face, laptop and phone arrive piece by piece, the mouse drops onto her head with a squash and a pink flash, she waves, the title stamps in, then petals wipe the intro away.
- Everywhere she appears: breathing, blinking (layer 09 are the eyelids), hair sway, head follows the cursor, rat antics, waves and hops.
- Companion extras: legs walk when she chases the cursor, hair trails movement and scrolling, she nods while talking, bops to the music, and naps (eyes closed, floating z's) after about 50 seconds idle.
- **Redeploy:** replace `index.html` and add the `assets/gaja/` folder.

## Memory Lane, calendar photos, NSFW and VIP

- **Memory Lane** lists every calendar entry whose date has passed (oldest first). A "Debrief" is no longer required, and "Potential" entries show up too once their date is past. Thumbnails come from the page cover, or else the first photo in the page.
- **Calendar thumbnails**: tapping a day makes its cell a little taller and shows the entry's thumbnail (cover, else first photo in the page). The same image appears at the top of that entry in the side panel.
- **NSFW checkbox**: any entry (or sub-page) with the `NSFW` checkbox ticked is left out for guests. This happens on the server (`api/notion.js`, `api/page.js`), so the entry never reaches a guest's browser. Entries with the box unticked, or no such property, always show.
- **Guest / VIP**: the opening screen asks. Guest sees everything except NSFW. VIP asks for a password, checked by `api/vip.js`, and then sees everything. The password is `plounge`; to change it, set a `VIP_PASSWORD` environment variable in Vercel. The choice lasts for the browser session; the footer link "Switch Guest / VIP" asks again.
- Add the `NSFW` checkbox property to whichever databases need it; the integration needs no extra permissions.

## Activities grid

Activities are one even grid instead of status columns. Each card's thumbnail carries a status stamp (Must Do, Might Do, In progress, Done). Cards keep the order Notion returns them in. The thumbnail is the page's Cover; if there's none, the first image in the page body is used; if that's missing too, a coloured gradient.

## Slower avatar and NSFW tags

- Gaja now drifts after the cursor at a very gentle pace (`gx+=(tx-gx)*.0175` in `loop()`), which makes her easier to click.
- Any entry with the NSFW checkbox ticked (visible to VIPs only) shows a small red "NSFW" tag on the calendar, Memory Lane, Activities, Travel, Shows, Movies, Books, the "Next up" ticket and its own page.

## Movies (DVD cases) and Books (face-out shelves)

- **The Screening Room**: each movie is a DVD case, overlapping its neighbour slightly with a small random tilt. Hover: the case tilts toward the cursor with a glare, and the disc slides out and spins. The cover is the Notion cover, else the first image in the page, else a coloured placeholder showing the title (the title appears on hover when a real cover is used). Status stamp (Watched / Now / To watch) on the cover.
- **Book Club**: books stand face-out on shelves, leaning and overlapping. The shelves re-flow to fit the screen width. Hover pulls a book forward, straightens it and tilts it toward the cursor. Covers come the same way as movies (cover, else first image, else coloured placeholder with the title).
- Shows still use the poster look. NSFW tags sit on the cover for VIPs.

## Memory Lane (polaroids)

Every past date is a taped polaroid with a handwritten title and date (the Caveat font from Google Fonts, with each letter nudged slightly so it looks pen-written). Polaroids overlap and tilt slightly. Hover: the polaroid lifts, straightens and tilts toward the cursor with a glossy glare. The photo is the Notion cover, else the first image in the page, else a coloured placeholder. Dates show a two-digit year, e.g. "Oct 11 ’26". NSFW tags (VIP only) sit on the photo.

## Two avatars: Gaja & Asad
- Layers live in `assets/gaja/` and `assets/asad/` (nine webp layers each, one shared 800×1230 frame, so they line up when stacked). To swap art, export the same layers at the same canvas and crop, and replace the files.
- Gaja (with Yuki) and Asad (with Julie) both appear on the opening screen and at the top of the page. Click either one in the hero for their own line.
- The cursor companion swaps between them every 40–70 seconds (first swap about 25 s in). Asad has a cooler glow and a blue speech bubble.
- All dialogue is in the `LN` object in `index.html` (search for `what each of them says`). Gaja is the fiery one, Asad is the gentle one. Add or edit lines freely.
- Opening caption: "And tonight's feature: Gaja & Asad." (`.s-cap .c2`).

## NSFW sections inside pages
In Notion, wrap sensitive content in a **toggle titled `NSFW`** (or a callout with the 🔞 icon). Guests never receive those blocks, since `api/page.js` strips them and their children on the server, and `api/thumbs.js` never uses their images as thumbnails. VIPs see them in a red hatched box with an NSFW badge.

## Sorting and filtering (Activities, Shows, Movies, Books)
- **Sort:** Notion order (default), Status ↑ (not started first, done last) or Status ↓. The status order is set in `ORDER` in `index.html`. Ties keep Notion's order.
- **Show/hide chips:** one chip per status and per tag. Tap to hide that group (the chip goes dashed and struck through), tap again to show it. Mix freely. An entry is hidden if its status is hidden or any of its tags is hidden. "Show all" resets.
- Books have no Status in Notion, so they only get tag chips (they appear once you add tags). Activities also keeps the "Debrief written" only-filter.
- The settings last until the page is reloaded. The Done/progress meters always count everything.

## Food section
- Reads the Food database (`DB_FOOD` env var overrides the id). Fields used: Name, Status (Tried It / Want to Try It), Gaja's Rating and Asad's Rating (⭐ selects), Cost (CAD), cover image (or the first non-NSFW photo in the page) and the NSFW checkbox.
- Tried places are slightly tilted till receipts (grayscale photo, ratings, total, "PAID · TRIED IT" stamp). Want-to-try places are leather-bound menus with a round photo window.
- Same sort and show/hide chips as the other sections, plus sorting by Gaja's or Asad's stars (unrated last).
- Hover (mouse) over a receipt and its photo turns to colour. Hover over a leather menu and it opens like a book, with the cover photo running across both pages (it is nudged sideways so it stays on screen). On touch screens and narrow windows the menus stay closed and tapping opens the page.

## Shows and Movies visuals
- **Shows** use DVD cases (a disc slides out on hover), slightly overlapping and rotated.
- **Movies** use VHS sleeves (a cassette slides up out of the top on hover), also overlapping and rotated. Stickers: Watched = "BE KIND REWIND", Watching = "NOW PLAYING", Not Watched = "NEW RELEASE". Touch devices (no hover) keep the tape tucked in.
- Sort and status chips work on both sections.

## Travel
- Places not yet visited (Planning / Not Visited) are **passports**. The cover shows a large circle with the entry image as a preview, plus the name, type tags and a status seal (gold = Planning, outlined = Someday). On hover the cover opens and the cover image (or first non-NSFW image in the page) spans both pages, with an ink stamp for the status.
- **Visited** places are **postcards**: sepia/greyscale photo that turns to colour on hover, with the name, tags and a VISITED postmark always visible. On hover the card just lifts toward the viewer (no flip).
- Travel has the same sort and show/hide chips as Activities. Status ↑ puts passports first, Status ↓ puts postcards first.

## Ratings on Shows, Movies, Books and Travel
If an entry has "Gaja's Rating" and/or "Asad's Rating" (⭐ select properties, same as Food), a small dark badge ("G ★★★★☆ / A ★★★★★") appears on it: under the status sticker on DVD cases and VHS sleeves, near the top-left of a book, above the status seal on passports and under "GREETINGS FROM" on postcards. Unrated entries show no badge.
