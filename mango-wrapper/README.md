# Mango Shake × Boy Wonder — Notion wrapper

A read-only "shoujo manga volume" front end for your Notion page. Notion stays the single source of truth;
the site re-reads it every 60 seconds (and whenever you return to the tab).

```
index.html        the whole site (splash, chapters, sub-pages, Gaja guide)
assets/gaja.png   Gaja sprite (already cropped for web)
assets/cover.jpg  your Notion page cover (starting banner; the live cover replaces it)
api/notion.js     reads the six databases + the main page cover
api/thumbs.js     finds the first photo inside a date page (Memory Lane fallback thumbnail)
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
