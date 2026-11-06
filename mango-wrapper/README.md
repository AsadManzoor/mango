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
