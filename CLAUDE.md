# Peloton Quest Board

A personal workout planning web app that pulls real classes from a Peloton account and presents the weekly schedule as a D&D-style quest board. The game layer exists to reduce decision fatigue and increase engagement — the balance engine does the real work, the RPG skin makes it worth looking at.

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
│   │   ├── QuestBoard.jsx      # Main board view — the winding path with day tiles
│   │   ├── DayTile.jsx         # Individual tile (seal/shield shape, icon, status badges)
│   │   ├── DayModal.jsx        # Tap-a-day popup — class name, instructor, Peloton link
│   │   ├── PlanModal.jsx       # "Plan the Week" modal — filters + generated schedule
│   │   ├── ScheduleList.jsx    # Editable Mon–Sun list inside PlanModal
│   │   ├── RerollModal.jsx     # Per-day re-roll with scoped filters
│   │   └── PortraitModal.jsx   # Full-size character portrait popup
│   ├── engine/
│   │   └── balance.js          # Balance engine — takes filters, returns a valid week
│   ├── state/
│   │   └── useSchedule.js      # React state/context for the current week's schedule
│   ├── constants/
│   │   ├── colors.js           # COLORS palette object
│   │   ├── fonts.js            # Font stack constants
│   │   ├── questTitles.js      # Rotating flavor-text pools by class type
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

### Auth

```
POST https://api.onepeloton.com/auth/login
Body: { username_or_email, password }
Response: { session_id, user_id }
```

Store `session_id` in an httpOnly cookie on the Vercel function side. All subsequent API calls include it as `Cookie: peloton_session_id=<session_id>`.

### Fetch Classes

```
GET https://api.onepeloton.com/api/v2/ride/archived
Params:
  content_format=audio,video
  fitness_discipline=cycling | strength | stretching
  instructor_id=<uuid>           (optional)
  difficulty=<float>             (optional, 0–10)
  duration=<seconds>             (optional, e.g. 1200 = 20 min)
  limit=20
  page=0
  sort_by=original_air_time
  desc=true
```

Each class in the response has:
- `id` — used for the Peloton deep link
- `title`
- `instructor` → `name`
- `duration` (seconds — divide by 60 for display)
- `overall_rating_avg` (0–10, this is the difficulty proxy)
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

Takes user-defined weekly preferences and returns a valid 7-day schedule. This is the core logic — the quest board is just a view on top of it.

### Inputs

```js
{
  strengthDays: 2–3,          // how many strength slots to fill
  cycleCount: 1,              // always 1 for now
  difficultyMin: 1–10,
  difficultyMax: 1–10,
  instructorIds: [],          // empty = any instructor
  maxDuration: 60,            // minutes
}
```

### Rules (in priority order)

1. Total active days = `strengthDays + cycleCount`. Remaining days are rest.
2. **No two hard days back-to-back.** Strength and cycle are both "hard." Rest days must be distributed so there is always at least one rest between any two active days. If this is impossible given the count, relax to allow one pair of back-to-back active days max.
3. Strength days are distributed across the week (not all clumped at the start or end).
4. The **last strength day** of the week is automatically flagged as `boss: true`.
5. Every non-rest day gets a paired stretch class automatically — fetch a stretch class whose body focus matches the strength focus (upper/lower/core/full body) and whose duration is ≤15 min. For cycle days, fetch a "post-ride" or general stretch ≤10 min.
6. Stretch classes do NOT count as hard days for the back-to-back rule.

### Strength Focus Assignment

Rotate through focus areas across strength days to avoid doing the same muscle group twice in a row:
- 2 strength days → Upper Body + Lower Body
- 3 strength days → Upper Body + Lower Body + Core (or Full Body)

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
- The `session_id` is stored in an httpOnly cookie set by the Vercel function
- The session lasts roughly 30 days; re-auth silently when a 401 is returned
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
