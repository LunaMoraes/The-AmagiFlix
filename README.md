# The AmagiFlix

The AmagiFlix is a fan-made, Netflix-inspired discovery interface for The Amagi's feature-length YouTube videos. It is a static React application: playback always happens on the canonical YouTube watch page.

V2 adds two local-only watch-state tools:

- A manual Google/YouTube activity import for movies watched before V2.
- An optional Chrome Manifest V3 companion that measures future playback on normal YouTube pages.

There is no AmagiFlix account, backend, OAuth flow, embedded player, or analytics service.

## Local development

Requirements: Node.js 22 or newer. GitHub Actions uses Node 24.

```bash
npm install
npm run dev
```

The checked-in `public/data/catalog.json` is a synthetic, non-secret fixture with valid-shaped YouTube IDs. It lets the complete interface run without a Google Cloud credential. A live catalog generation replaces this file.

Useful checks:

```bash
npm test
npm run build
npm run assert:no-secrets
npm run test:e2e
```

`npm run build` creates the web application in `dist`, builds the unpacked companion in `extension-dist`, generates original AmagiFlix extension icons, and packages `dist/downloads/amagiflix-companion.zip`.

## Live YouTube catalog setup

1. Create or select a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **YouTube Data API v3**.
3. Create an API key under **APIs & Services → Credentials**.
4. Set **API restrictions** to **Restrict key**, selecting only **YouTube Data API v3**. The build runs on GitHub-hosted runners, so a browser referrer restriction is not appropriate for this server-side credential.
5. For a local one-time generation, set `YOUTUBE_API_KEY` in the shell and run `npm run catalog`. Never name it `VITE_YOUTUBE_API_KEY` and never commit it.

The generator resolves `@TheAmagiYT`, walks the uploads playlist, fetches videos in batches, filters titles containing `Full Movie`, applies configured category rules, reports uncategorized titles, and atomically writes `public/data/catalog.json`. API or transformation failures stop the build rather than deploying a partial catalog.

## GitHub Pages deployment

1. Link the checkout to the intended GitHub repository.
2. Open **Settings → Secrets and variables → Actions** and add `YOUTUBE_API_KEY`.
3. Under **Settings → Pages**, choose **GitHub Actions**.
4. Push to `main` or manually run **Build catalog and deploy AmagiFlix**.

The workflow also runs daily at 06:00 UTC. Assets and the extension download use relative URLs, so the web build remains portable between `/theamagiflix/` and `/The-AmagiFlix/`. The companion bridge recognizes both deployed path variants.

## Importing YouTube history

Export Google/YouTube activity through [Google Takeout](https://takeout.google.com/) or another Google activity export flow, then choose the resulting JSON, HTML, or Takeout ZIP in AmagiFlix.

- Parsing happens entirely in the current browser.
- English `Watched` and Portuguese `Assistiu` activity are recognized.
- Non-Amagi activity is discarded immediately and is never stored or uploaded.
- Matching records become Watched, but never receive a fabricated progress percentage.
- Re-import and Clear Imported History remain available under **Account → Settings**.
- Clearing imported markers preserves manual watched decisions, companion progress, and My List.

Do not commit or share real Takeout files. Test fixtures in this repository contain synthetic activity only.

## Installing the temporary Chrome companion

Until the companion is published in the Chrome Web Store:

1. Open **Account → Browser Extension** in AmagiFlix.
2. Download and extract `amagiflix-companion.zip`.
3. Open `chrome://extensions` in desktop Google Chrome.
4. Enable **Developer mode**.
5. Choose **Load unpacked** and select the extracted folder containing `manifest.json`.
6. Return to AmagiFlix and choose **Check connection**.

Chrome does not allow ordinary users on Windows or macOS to directly install a self-hosted extension. The ZIP is therefore a temporary load-unpacked package, not a one-click installer. To update it, download the current stable ZIP again, replace the extracted folder, and click **Reload** on `chrome://extensions`.

The companion:

- Uses only `storage` and `webNavigation` plus host access to YouTube and the AmagiFlix Pages host.
- Checks the current YouTube video ID against the public AmagiFlix catalog.
- Stores playback only after 30 seconds of real, non-ad playback.
- Checkpoints every 15 seconds and marks completion at 90% or the native ended event.
- Ignores and does not store IDs, titles, channels, or playback for unrelated YouTube videos.
- Uses `chrome.storage.local`; removing the extension removes its authoritative extension store, while the website retains its last local cache.

The extension cannot observe watches in mobile apps, TVs, consoles, Chromecast sessions, incognito sessions without explicit browser permission, or browsers where it is not installed. A later history re-import can reconcile Watched state from those devices, but cannot reconstruct playback percentage.

## State, privacy, and security

- V2 web state uses `amagiflix:library:v2`. Existing `amagiflix:library:v1` data is migrated idempotently and left untouched after V2 persistence succeeds.
- Import completion metadata uses `amagiflix.v2.historyImportCompleted`.
- The YouTube Data API key exists only during trusted catalog generation and build leakage checks.
- The browser and extension receive only normalized catalog data; neither contains OAuth data, tags, raw API responses, or the secret API key.
- The extension bridge validates versioned messages and the complete AmagiFlix sender path. It exposes only AmagiFlix state operations—never arbitrary storage, browser history, or page DOM access.
- The build rejects forbidden extension permissions, runtime YouTube Data API endpoints, leaked credentials, and remote executable-code references.

The AmagiFlix is not affiliated with Netflix or The Amagi. Video content is hosted and played by YouTube.
