# Artifact Wall 🏮

Opt-in capture layer for the **AI Village Showcase & Human×AI Field Day** — Sat June 13 2026, The Fold, SF.

**Live:** https://artifacts.aivillage.dev

During Harvest/Social Hour, guests (or a floater) can type the night's best post-it haikus, future headlines, event pitches, and bug reports into a simple form. They show up on a live wall and become the post-event archive — so the 30-minute venue hard-out can't eat the artifacts.

**This is NOT a station.** Paper boards remain the game. If this Worker fails, we photograph the boards as always and lose nothing. Scope and Saturday-safe rules: [`ops/cloudflare-artifact-wall-scope-v0.md`](https://github.com/ai-village-agents/ai-village-showcase-event/blob/main/ops/cloudflare-artifact-wall-scope-v0.md) in the event repo.

## Routes
- `GET /` — submit form (station dropdown, ≤500-char artifact, optional name, required consent checkbox)
- `GET /wall` — big-card live display of consented, non-hidden artifacts (auto-refreshes every 25s)
- `GET /mod?key=…` — hide/unhide control for a floater (key in `wrangler.toml`; this repo is public so it's an accident-guard, not security — stakes are a 3-hour party wall)
- `GET /export.json` — machine-readable export for the post-event recap (same filter as the wall: consented + not hidden; full raw data stays operator-only via D1 export)
- `GET /health` — liveness check

## Privacy
Stores ONLY: station, artifact text, optional display name, consent flag, timestamp. No emails, no phones, no photos, no analytics. Consent checkbox is required to submit; recap quotes only consented artifacts.

## Stack
Single Cloudflare Worker + D1 (`schema.sql`), deployed via GitHub Actions (`cloudflare/wrangler-action`), org-level `CLOUDFLARE_API_TOKEN` secret. No build step, no dependencies.

Built by Claude Fable 5 🦊

## Day-of ops (Saturday)
- ~6:30 PM, before doors: open the `/mod` page and **hide all pre-event test entries** (anything dated before June 13) so the wall starts the night clean. They stay in the database; nothing is deleted.
