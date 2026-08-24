# CinéPlanner

Pathé showtime planner: pick your nearby cinemas, the films you want to see, your pacing and
travel preferences — the app generates several day plans that maximize the number of films seen,
timing and travel included.

100% front-end: no database, no account. Everything is stored in the browser's `localStorage`
(preferences, seen films, planning history).

## Features

- Geolocation → list of nearby Pathé cinemas (manual search also possible)
- Multi-cinema and multi-film selection, with real posters and info
- Reusable preferences: session pacing (relaxed / standard / tight), tolerance to travel,
  transport mode
- Planning algorithm (exact search via bitmask) that generates several possible combinations,
  ranked by number of films then by comfort
- History of closed plannings + tracking of already-seen films

## Getting started

```bash
npm install
npm run dev
```

The API relay (see below) **must be configured** in `.env` for the app to work: without it, no
data is fabricated — the app shows explicit API errors instead.

## Data sources — and their limits

Pathé has no official public API. This app relies on the undocumented JSON endpoints used by
pathe.fr itself:

| Endpoint | Content | Used for |
| --- | --- | --- |
| `/api/cinemas` | List of the 68 Pathé cinemas (name, address, GPS) | Proximity selection (frozen in `src/data/cinemas.json`, a snapshot is enough — the cinema list rarely changes) |
| `/api/shows` | Film catalog (title, poster, synopsis, duration, genres…) | Film sheets, live via the relay |
| `/api/cinema/{slug}/shows` | For each film, the days it's actually scheduled at that cinema | Real per-cinema/day availability, live via the relay |
| `/api/show/{filmSlug}/showtimes/{cinemaSlug}/{date}` | Exact sessions (start time `time`, end time `endTime`, version) | Real showtimes displayed in plannings, live via the relay |

Everything — catalog, per-cinema programme, exact showtimes — comes live from Pathé via the relay.
If a request fails (relay not configured, unreachable, or Pathé doesn't cover a given
film/cinema/date combination), the app shows an explicit error message instead of fabricating
fallback data.

### CORS

These endpoints don't send an `Access-Control-Allow-Origin` header: a browser can't call them
directly from another domain. To stay "just a front-end" with no database or server-side business
logic, this repo includes a **minimal CORS relay** (`worker/`, free Cloudflare Worker) that only
forwards requests to pathe.fr while adding CORS headers.

Deploy the relay:

```bash
cd worker
npm install
npx wrangler login   # free Cloudflare account
npm run deploy
```

Then set the URL it prints in `.env` (`VITE_API_PROXY_URL=...`).

## Planning algorithm

For a given date and pacing:

- **Relaxed**: you arrive at the announced time (trailers included), ≥20 min of buffer is required after a session at the same cinema before the next one.
- **Standard**: same but ≥10 min of buffer.
- **Tight**: you arrive 15 min after the announced time (end of trailers), which allows back-to-back sessions where one ends exactly when the next starts, at the same cinema.

Travel between cinemas is estimated as the crow flies (× 1.3 to approximate road distance) with an
effective speed per transport mode (bike/transit/car) — no routing API is used, so it's an
approximation, presented as such in the UI.

The algorithm does an exact bitmask search over the selected films (≤ 14) to find the best
combination of compatible sessions, then returns the best distinct options (descending film count,
then comfort).

## Stack

Vite + React + TypeScript + Tailwind CSS v4 + React Router (`HashRouter`, for a static deployment
with no server configuration). No heavy runtime dependency.

## Deployment

Any static file host (Cloudflare Pages, Netlify, Vercel, GitHub Pages with a public repo…):

```bash
npm run build   # -> dist/
```
