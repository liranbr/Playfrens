# Self Hosting (advanced)

## Requirements

- [Node.js](https://nodejs.org/) version 20 or above.
- A [Supabase](https://supabase.com/) project (used as the Postgres database).
- OAuth app credentials for whichever login providers you want working locally: [Steam](https://steamcommunity.com/dev/apikey), [Google](https://console.cloud.google.com/), [Discord](https://discord.com/developers/applications).
- A [SteamGridDB](https://www.steamgriddb.com/) API key used for cover art lookups.

## Setup

1. Install dependencies:
    ```
     npm install
    ```
2. Copy [`.env.example`](.env.example) to `.env` and fill in real values. Each section in the file explains where to get that key.
3. `.env.public` already contains local defaults, you can adjust if needed but remember to restart the server to see its effects.
4. If deploying (not just local dev), override `DOMAIN`, `BACKEND_PORT`, `USE_HTTPS`, and `BASE_URL` in your host's environment variables — `BASE_URL` in particular must be your real public URL with no port, e.g. `https://playfrens.com`.

## Running the Project

- `npm run dev` - runs the Vite dev server and the Express backend together via Concurrently, both have hot reload.
- `npm run dev:vite` - frontend only.
- `npm run dev:backend` - backend only.

By default the app runs at `http://localhost:5174` (or `https://localhost:5174` if `USE_HTTPS=true`), with `/api` and `/auth` requests proxied to the Express backend on port 3000.

## Building for Production

- `npm run build` - builds the frontend into `backend/public`, which the Express server serves directly.
- `npm run production` - runs the built app the same way production does, a single Express server on port 3000 with no separate frontend.
- `npm run preview` - Vite's own static preview of the build, note: `/api` and `/auth` aren't proxied here, so login won't work through this one.

## Linting

We use eslint for linting, to run:

```
npm run lint
```
