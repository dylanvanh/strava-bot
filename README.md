# Strava Duplicate Cleaner

Automatically hides duplicate indoor bike activities on Strava.

## What it does

When you use both a fitness watch and Zwift/MyWhoosh, you get duplicate activities:

- **Trainer activity** from your watch (unwanted)
- **Virtual ride** from Zwift (full workout data)

This bot finds matching activities within 1 hour and hides the trainer activity, keeping the virtual ride public.

## Setup

```bash
pnpm install
pnpm start
```

Set environment variables:

```
PORT=3000
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_ACCESS_TOKEN=
STRAVA_INITIAL_REFRESH_TOKEN=
```

## API

- `GET /` - Manually trigger cleanup
- Runs automatically every minute

