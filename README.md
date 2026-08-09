# AmagiFlix

AmagiFlix is a fan-made, Netflix-inspired discovery interface for The Amagi's feature-length YouTube videos. It is a static React application: playback always happens on the canonical YouTube watch page, while started, watched, and My List state remain in the current browser.

## Local development

Requirements: Node.js 22 or newer (Node 24 is used in CI).

```bash
npm install
npm run dev
```

The checked-in `public/data/catalog.json` is a synthetic, non-secret development fixture. It lets the complete interface run without a Google Cloud credential. A live catalog generation replaces this file.

Useful checks:

```bash
npm test
npm run build
npm run assert:no-secrets
npm run test:e2e
```

## Live YouTube catalog setup

1. Create or select a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **YouTube Data API v3** for the project.
3. Create an API key under **APIs & Services → Credentials**.
4. Edit the key and set **API restrictions** to **Restrict key**, selecting only **YouTube Data API v3**. The build runs on GitHub-hosted runners, so a referrer restriction is not appropriate for this server-side credential.
5. For a local one-time generation, set `YOUTUBE_API_KEY` in the shell and run `npm run catalog`. Never name it `VITE_YOUTUBE_API_KEY` and never commit it to a file.

The generator resolves `@TheAmagiYT`, walks the uploads playlist, fetches videos in batches, filters titles containing `Full Movie`, applies configured category rules, reports unmatched titles, and atomically writes `public/data/catalog.json`. API or transformation failures stop the build rather than deploying a partial catalog.

## GitHub Pages deployment

1. Link this checkout to the GitHub repository intended to host the project.
2. In the repository, open **Settings → Secrets and variables → Actions** and add a repository secret named `YOUTUBE_API_KEY`.
3. Under **Settings → Pages**, choose **GitHub Actions** as the source.
4. Push to `main` or run **Build catalog and deploy AmagiFlix** manually from Actions.

The workflow also runs every day at 06:00 UTC. Production assets use relative URLs, so the project works under both `/theamagiflix/` and `/The-AmagiFlix/` and does not need a rebuild if only the repository-path casing changes.

Only the newest Pages workflow remains active when deployments overlap, and once the deployment job starts it has a 10-minute timeout.

## Architecture and privacy

- The browser fetches only the generated `data/catalog.json`, thumbnails, and ordinary YouTube watch links.
- The YouTube Data API key is available only to catalog generation and the post-build leakage assertion in GitHub Actions.
- State is stored under `amagiflix:library:v1`; storage failures degrade to in-memory state.
- No accounts, analytics, embedded players, watch-history access, or playback progress exist in V1.
- Generated public catalog data contains normalized movie metadata only—never credentials, tags, OAuth data, or raw API responses.

AmagiFlix is not affiliated with Netflix or The Amagi. Video content is hosted and played by YouTube.
