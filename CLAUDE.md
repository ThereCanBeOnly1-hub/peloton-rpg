# Peloton Quest Board

A personal workout planning web app that pulls real classes from a Peloton account and presents the weekly schedule as a D&D-style quest board. The game layer exists to reduce decision fatigue and increase engagement — the balance engine does the real work, the RPG skin makes it worth looking at.

---

## Design Philosophy — Low Friction Above All

The user has ADHD; the smallest barrier can derail use. **Every setting is a barrier.** The app must make the decisions *for* the user. Guiding rules:

- **Zero required input on a normal day.** Open app → a balanced week is already there → one tap to start → immediate reward (XP/checkmark).
- **One-tap primary action: "New Week"** generates a balanced week from saved settings, no filter screen in the way.
- **Settings are set *once* and forgotten** (favorite instructors, difficulty, preferred week template, max length) — persisted in `localStorage`, applied to every week automatically, never asked at generation time.
- **Tweaks are escape hatches, not requirements** — per-day Re-roll / Make-it-easier / Skip→Rest let the user redirect a derail into something doable.
- **Resist adding filters/knobs.** New customization = new management burden = new barrier. When in doubt, leave it out.

---

## Stack

- **Frontend:** React (Vite)
- **Styling:** Inline styles + Tailwind utility classes (no component library)
- **Backend:** Vercel Serverless Functions (`/api` directory) — handles Peloton auth and API proxying so credentials never touch the client
- **Hosting:** Vercel (same setup as existing projects)
- **Fonts:** Google Fonts — Uncial Antiqua (display), Cinzel (headings), IM Fell English (body), system monospace (labels/data)
- **Icons:** Custom hand-drawn SVG components (do NOT use Lucide or any modern icon library for class-type icons — they look too clean/modern for the aesthetic)

---

## Project Structure

```
/
├── api/                        # Vercel serverless functions (Node.js)
│   ├── auth.js                 # POST /api/auth — exchanges credentials for session cookie
│   ├── classes.js              # GET /api/classes — fetches + filters class library
│   └── instructors.js          # GET /api/instructors — returns instructor list with IDs
├── public/
│   ├── manifest.json           # PWA manifest
│   └── icons/                  # PWA icons (192x192, 512x512)
├── src/
│   ├── api/
│   │   └── peloton.js          # Client-side fetch wrapper that calls /api/* endpoints
│   ├── components/
│   │   ├── QuestBoard.jsx      # Main board view — winding path, "New Week" + Settings
│   │   ├── DayTile.jsx         # Individual tile (seal/shield shape, icon, status badges)
│   │   ├── DayModal.jsx        # Tap-a-day popup — class info, Peloton link, escape hatches
│   │   ├── SettingsModal.jsx   # Set-once preferences (week template, difficulty, instructors)
│   │   ├── InstructorPicker.jsx# Searchable multi-select for favorite instructors
│   │   ├── Modal.jsx           # Shared scroll-style modal shell
│   │   ├── Stepper.jsx         # Shared +/- stepper
│   │   ├── LoginModal.jsx      # Peloton credentials entry (Auth0 login)
│   │   ├── PortraitModal.jsx   # Full-size character portrait popup
│   │   └── icons/              # Custom single-stroke SVG class-type icons
│   ├── engine/
│   │   └── balance.js          # Balance engine — turns the preferred week template into a valid week
│   ├── state/
│   │   ├── useSchedule.js      # Context: schedule, XP, settings, all actions
│   │   └── settings.js         # Set-once preferences load/save + defaults
│   ├── constants/
│   │   ├── colors.js           # COLORS palette object
│   │   ├── fonts.js            # Font stack constants
│   │   ├── questTitles.js      # Rotating flavor-text pools by class type
│   │   ├── classTypes.js       # TYPE_META / SUB_LABEL / discipline slugs
│   │   ├── difficulty.js       # Difficulty levels (soft preference)
│   │   └── tilts.js            # Per-day tile rotation angles
│   ├── App.jsx
│   └── main.jsx
├── CLAUDE.md
├── vite.config.js
└── package.json
```

---

## Visual Design — Read This Before Touching UI

The aesthetic is **medieval dungeon-crawl / D&D**, not modern or clean. Specific rules:

- **Background:** near-black stone (`#16120D`)
- **Tiles:** aged parchment (`#D6C18C`) for active days, dark stone for rest, deep crimson (`#7A2E2E`) for boss
- **Borders/paths:** weathered bronze (`#6B4F2E`), `iron` (`#2B2620`) for inner borders
- **Accent:** gold (`#D9A441`) for XP bar, today highlight, boss crown, done checkmarks
- **Moss green** (`#4F6B4A`) for the stretch badge and secondary actions

**Tile shapes** use SVG `clipPath` — an irregular blob for normal days (`sealBlob`), a heraldic shield for the boss day. Do NOT use `border-radius` circles or rounded rectangles for tiles.

**Each tile is slightly rotated** (see `TILTS` array in `constants/tilts.js`) to look hand-stamped. The icon inside counter-rotates to stay upright.

**Icons** are custom single-stroke SVG components defined in `src/components/icons/`:
- `SwordIcon` — strength days
- `WheelIcon` — cycle days (a wagon wheel, not a bicycle)
- `TorchIcon` — rest days
- `SprigIcon` — stretch badge (appears as a small badge on paired days, not a full tile)
- `CrestIcon` — boss crown marker above the boss tile

**Fonts** must be loaded from Google Fonts. Uncial Antiqua is display-only (week title). Cinzel is for all headings and button labels. IM Fell English for body/modal text. Never use a sans-serif for themed UI text.

**Modals** use a parchment background (`#D6C18C`) with ink text (`#14110C`) and a `3px double` bronze border — they should feel like scrolls or notices, not dialogs.

---

## Peloton API

Uses the **unofficial Peloton API** (reverse-engineered, not publicly documented). All calls are proxied through Vercel serverless functions — credentials are never sent to the client.

> ⚠️ **Auth changed in practice.** Peloton migrated the class-library API to
> **Auth0 Bearer tokens**; the legacy `session_id` cookie no longer authorizes
> it. Also, `api.onepeloton.com` 403s unknown clients — you must send the
> official-app User-Agent. The values below reflect what actually works.

### Auth (Auth0)

The class API requires an **Auth0-issued Bearer token**, obtained via the Resource Owner Password grant:

```
POST https://auth.onepeloton.com/oauth/token
Body: {
  grant_type: "http://auth0.com/oauth/grant-type/password-realm",  // plain "password" is disabled
  realm: "Username-Password-Authentication",
  username, password,
  client_id: "WVoJxVDdPoFx4RNewvvg6ch2mZ7bwnsM",   // public web-app client
  audience: "https://api.onepeloton.com/",
  scope: "openid profile email offline_access"
}
Response: { access_token, refresh_token, expires_in, ... }
```

Store `access_token` + `refresh_token` in httpOnly cookies (`qb_token` / `qb_refresh`). All `api.onepeloton.com` calls send `Authorization: Bearer <access_token>` **plus** these headers: `User-Agent: Peloton/1.0 (iPhone; iOS 17.0)`, `Peloton-Platform: web`, `X-Requested-With: XMLHttpRequest`. (Legacy `/auth/login` cookie auth still works for `/api/me` and `check_session` but NOT the class library.)

### Fetch Classes

```
GET https://api.onepeloton.com/api/v2/ride/archived
Params:
  browse_category=cycling | strength | stretching   // NOT fitness_discipline
  content_format=audio,video
  instructor_id=<uuid>           (optional)
  duration=<seconds>             (optional, e.g. 1200 = 20 min)
  limit=40
  page=0
  sort_by=original_air_time
  desc=true
```

Each class in the response has:
- `id` — used for the Peloton deep link
- `title`
- `instructor` → `name`
- `duration` (seconds — divide by 60 for display)
- `difficulty_rating_avg` (0–10 difficulty — clusters high ~7–8, varies by discipline). NOTE: `overall_rating_avg` is a *like-ratio* (~0–1), NOT difficulty.
- `fitness_discipline_display_name`
- `image_url`

### Class Deep Link

```
https://members.onepeloton.com/classes/cycling?modal=classDetailsModal&classId=<id>
```

Opens the class detail page. On mobile with the Peloton app installed, this may hand off to the app.

### Instructors

```
GET https://api.onepeloton.com/api/instructor?limit=100
```

Returns all instructors with `id` and `name`. Cache this — it rarely changes. The `instructor_id` from here is what goes into the class filter params.

### Error Handling

- 401 → session expired, re-auth and retry once
- 429 → rate limited, back off 2s and retry
- Wrap all `/api` functions in try/catch and return structured `{ error, status }` on failure

---

## Balance Engine (`src/engine/balance.js`)

Takes the user's **preferred week template** (a set-once setting) and returns a valid 7-day schedule. This is the core logic — the quest board is just a view on top of it. The engine is pure/API-free (testable on its own); class data is filled in afterward by the API layer.

### Inputs

The engine reads from the saved settings object (see `src/state/settings.js`):

```js
{
  weekTemplate: ['strength','rest','cycle','rest','strength','strength','rest'], // Mon–Sun, the source of truth for which days are what
  difficulty: 'any' | 'beginner' | 'intermediate' | 'advanced',  // soft preference (sort), used at fetch time
  instructorIds: [],          // favorite instructors (empty = any), used at fetch time
  maxDuration: 30,            // minutes, used at fetch time
}
```

The user edits `weekTemplate` once in Settings (default: Strength Mon/Fri/Sat, Cycle Wed). The engine respects it as-is — it does **not** redistribute days. (This deliberately allows back-to-back days like Fri+Sat if the user prefers them; the old auto-spacing rule is gone in favor of user control + the low-friction philosophy.)

### Rules

1. Day types come straight from `weekTemplate`.
2. The **last strength day** of the week is flagged `boss: true`.
3. Strength days get a rotating focus (see below).
4. Every non-rest day gets a paired stretch (fetched by the API layer): focus-matched ≤15 min for strength, general/post-ride ≤10 min for cycle.

### Strength Focus Assignment

Rotate through focus areas across strength days to avoid the same muscle group twice in a row:
- 2 strength days → Upper Body + Lower Body
- 3 strength days → Upper Body + Lower Body + Core
- 4+ → cycle Upper / Lower / Core / Full Body

### Output

Array of 7 day objects:

```js
{
  day: 'MON',                 // MON–SUN
  type: 'strength' | 'cycle' | 'rest',
  focus: 'Upper Body' | 'Lower Body' | 'Core' | 'Full Body' | null,
  boss: true | false,
  status: 'done' | 'today' | 'upcoming',
  // populated after API fetch:
  classId: string,
  name: string,
  instructor: string,
  duration: number,           // minutes
  stretchClassId: string | null,
  stretchName: string | null,
  stretchDuration: number | null,
}
```

---

## Quest Flavor Text

Each class type has a pool of rotating quest title strings. The board shows these instead of the raw class name. Track which titles have been used recently (localStorage, last 4 weeks) and avoid repeats.

```js
// src/constants/questTitles.js
export const QUEST_TITLES = {
  strength: [
    'Forge the Blade', 'Storm the Keep', 'Hold the Line',
    'Arm the Garrison', 'Duel the Champion', 'Break the Siege',
  ],
  cycle: [
    'Race the Caravan', 'Outrun the Storm', 'Scout the Pass',
    'Ride Before Dawn', 'Cross the Wastes',
  ],
  rest: [
    'Rest at Camp', 'Mend Your Wounds', 'Tend the Fire',
    'Sleep Under Stars', 'Sharpen Your Steel',
  ],
};
```

---

## XP & Leveling

- **XP rate:** 1 XP per minute of class completed (stretch minutes count)
- **Storage:** `localStorage` — `{ totalXp: number, level: number, weeklyLog: [...] }`
- **Level thresholds:** Start simple — every 100 XP = 1 level. Adjust later once real usage data exists.
- **Weekly bonus:** If all non-rest days in a week are marked done, award 25 bonus XP.
- **No reset on missed days** — XP only ever goes up. A skipped week just means no weekly bonus.

---

## PWA Setup

Add a `manifest.json` and register a service worker so the app can be installed on Android (Add to Home Screen). Minimum viable:

```json
{
  "name": "Quest Board",
  "short_name": "QuestBoard",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#16120D",
  "theme_color": "#16120D",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## Auth & Security Notes

- Peloton credentials are entered once in the app, sent to `/api/auth`, and never stored client-side
- `/api/auth` exchanges them (via Auth0) for an `access_token` + `refresh_token`, stored in httpOnly cookies (`qb_token` / `qb_refresh`) set by the Vercel function
- The access token lasts ~10h; the refresh token ~30 days. Token refresh via `refresh_token` is **not yet wired** — on expiry (401) the user re-logs in. (TODO: auto-refresh.)
- This app is personal/private — no multi-user auth needed

---

## Environment Variables (Vercel)

No credentials are hardcoded. Set these in Vercel project settings:

```
# None required at launch — credentials are passed per-request by the user.
# Add PELOTON_BASE_URL if the API base ever changes:
PELOTON_BASE_URL=https://api.onepeloton.com
```

---

## Development Notes

- Run locally with `npm run dev` (Vite dev server on :5173)
- Vercel functions run locally via `vercel dev` (requires Vercel CLI)
- The prototype components (QuestBoard.jsx etc.) were built as a single-file React artifact — split into separate files per the structure above when porting
- All tile shapes, rotations, and color values are already finalized — don't redesign, just implement
- The balance engine logic is the thing most likely to need iteration; keep it isolated in `engine/balance.js` so it can be tested independently
