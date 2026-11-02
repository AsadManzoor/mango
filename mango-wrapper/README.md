# Mango Shake × Boy Wonder — Notion wrapper

A read-only "shoujo manga volume" front end for your Notion page. Notion stays the single source of truth;
the site re-reads it every 60 seconds (and whenever you return to the tab).

```
index.html        the whole site (splash, chapters, Gaja guide)
assets/gaja.png   Gaja sprite (already cropped for web)
api/notion.js     tiny server function that reads Notion with your secret token
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
- Add images to the Shows "Files & media" property and they become that show's poster.
- Without the API (e.g. opening `index.html` directly) the site shows demo data and says "demo data" in the header.

## Notes
- Notion image URLs expire after about an hour; the page refreshes them on each sync.
- Gaja is a single flat image, so her animation is whole-body (follow, bob, tilt, wiggle). A layered file would unlock blinking and rat reactions.
