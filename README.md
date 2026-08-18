# EventDrop

QR-code-based shared event photo platform. Organizer creates an event → guests
scan a QR code → guests upload photos with no account required → photos
appear in a live shared gallery in realtime.

## Status: Foundation + Auth + Events + QR + Guest Sessions + Uploads + Live Gallery + Reactions

- `api/` — Express + TypeScript REST API. Prisma schema (User, Event, Guest,
  Photo, Reaction), Socket.IO wired into the HTTP server, env validation,
  centralized error handling, security middleware, organizer auth, event
  CRUD, anonymous guest sessions, a presigned R2 upload flow, a public
  approved-photos list endpoint with live reaction counts, a `photo:new`
  broadcast on confirmed uploads, and a heart-reaction toggle endpoint that
  broadcasts `reaction:update` in real time.
- `web/` — Next.js 16 (App Router) + TypeScript + Tailwind v4 frontend:
  organizer login/register/dashboard/event-creation/QR-code pages, and the
  public `/e/[slug]` guest page with a live gallery (real-time new photos
  and reaction counts) and tappable heart buttons on each photo.

Both apps typecheck and lint cleanly. I booted both dev servers and
regression-tested every existing route after adding reactions — no breakage.
Still true from before: real end-to-end verification (an actual photo
reaching R2, a real-time reaction landing in a second browser tab) needs a
live Postgres + R2 setup that doesn't exist in this sandbox, so that's the
first thing worth smoke-testing once you have credentials wired up.

### One known gap worth flagging

Reaction "liked" state (♥ vs 🤍) is tracked client-side only, per browser
session — it resets on page reload and isn't fetched from the server. Fine
for now, but if that matters for launch, the fix is a `GET
/api/photos/:photoId/reactions/me` endpoint (or including guest reaction
state in the gallery list response) — flag it if you want that added.

### Auth endpoints

| Method | Path                | Auth required | Notes                              |
|--------|---------------------|----------------|-------------------------------------|
| POST   | `/api/auth/register`| No             | `{ email, password, name? }`        |
| POST   | `/api/auth/login`   | No             | `{ email, password }`               |
| POST   | `/api/auth/refresh` | Refresh cookie | Issues a new access token           |
| POST   | `/api/auth/logout`  | No             | Clears both auth cookies            |
| GET    | `/api/auth/me`      | Access cookie  | Returns the current organizer       |

Tokens are set as httpOnly cookies (`eventdrop_access`, 15 min; `eventdrop_refresh`,
30 days, scoped to `/api/auth`), not returned in the JSON body.

### Reactions

| Method | Path                          | Auth required | Notes                                        |
|--------|-------------------------------|----------------|--------------------------------------------------|
| POST   | `/api/photos/:photoId/reactions` | Guest cookie | `{ slug, type? }` (type defaults to `"heart"`) — toggles on/off |
| Socket | `reaction:update` (server → client) | —       | `{ photoId, type, count }` broadcast to the event room on every toggle |

Tapping the heart on a photo you haven't reacted to adds a reaction; tapping
it again removes it — same request, same endpoint, idempotent-by-toggle.
Reaction counts are included in the gallery list response and kept in sync
live via the same Socket.IO room used for new photos.

### Live gallery

| Method | Path                          | Auth required | Notes                                  |
|--------|-------------------------------|----------------|-------------------------------------------|
| GET    | `/api/events/public/:slug/photos` | No         | Last 200 `APPROVED` photos, newest first  |
| Socket | `event:join` / `event:leave`  | No             | Client emits with an event id to (un)subscribe |
| Socket | `photo:new` (server → client) | —              | Broadcast to `event:{eventId}` room the moment an approved upload is confirmed |

Pending (moderated) photos are never fetched or broadcast to the public
gallery — they only become visible after an organizer approves them (that
moderation UI is step 9, not built yet).

### Photo upload endpoints

| Method | Path              | Auth required | Notes                                              |
|--------|-------------------|----------------|-------------------------------------------------------|
| POST   | `/api/photos/presign` | Guest cookie | `{ slug, mimeType, size }` → `{ uploadUrl, objectKey }` |
| POST   | `/api/photos`     | Guest cookie   | `{ slug, objectKey, mimeType, size }` → creates the `Photo` row |

Flow: guest requests a presigned URL → uploads the file directly to R2 with
a `PUT` (never touches our server) → confirms with the API, which does a
`HeadObject` check against R2 before trusting the metadata, then sets
`status` to `APPROVED` or `PENDING` based on the event's `autoApprove`
setting. Allowed types: JPEG, PNG, WebP, HEIC/HEIF, capped at 15MB.
`objectKey`s are validated to belong to the claimed event before being
accepted, so a guest can't attach another event's upload to this one.

### Guest session endpoints

| Method | Path                | Auth required | Notes                                          |
|--------|---------------------|----------------|--------------------------------------------------|
| POST   | `/api/guests/sessions` | No (cookie)  | `{ slug, name? }` — creates or resumes a guest session |
| PATCH  | `/api/guests/sessions` | Guest cookie | `{ slug, name }` — sets/updates the guest's display name |

Each event gets its own cookie (`eg_{eventId}`, httpOnly, 180-day expiry) so
the same browser can hold separate anonymous identities across multiple
events. No login, no account — this is what the `/e/[slug]` guest landing
page calls automatically on load.

### Event endpoints

| Method | Path                     | Auth required | Notes                                    |
|--------|--------------------------|----------------|--------------------------------------------|
| POST   | `/api/events`            | Yes            | `{ name, description?, eventDate?, autoApprove? }` |
| GET    | `/api/events`            | Yes            | List the logged-in organizer's events      |
| GET    | `/api/events/:id`        | Yes            | Fetch one of your own events (404 if not owner) |
| PATCH  | `/api/events/:id`        | Yes            | Partial update, same ownership check       |
| DELETE | `/api/events/:id`        | Yes            | Cascades to guests/photos/reactions        |
| GET    | `/api/events/public/:slug` | No           | What guests see after scanning the QR code |

Slugs are generated as `{kebab-case-name}-{6-char-id}` (e.g.
`sarahs-birthday-bash-x7k2pq`) and retried up to 5 times on collision before
failing loudly. Ownership checks return 404 rather than 403 on someone else's
event, so organizers can't probe for which event IDs exist.

## Prerequisites

- Node.js 20+
- A PostgreSQL database (e.g. [Neon](https://neon.tech))
- A Cloudflare R2 bucket — needed to actually test uploads. Create one at
  [dash.cloudflare.com](https://dash.cloudflare.com) → R2, generate an API
  token with read/write access, and set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
  `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` in `api/.env`. For `R2_PUBLIC_URL`,
  either enable the bucket's public dev URL or attach a custom domain, and
  set it to that base URL (no trailing slash).

## Setup

### 1. API

```bash
cd api
npm install
cp .env.example .env   # already present with dev defaults — edit DATABASE_URL
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

The API starts on `http://localhost:4000`. Verify with:

```bash
curl http://localhost:4000/api/health
```

> **Note:** `npx prisma generate` needs to reach `binaries.prisma.sh` to
> download its query engine. This was built in a sandboxed environment
> without access to that domain (confirmed — even with a real local
> PostgreSQL instance running, the generate step still fails on the binary
> fetch), so the Prisma client has not been generated yet. This is a one-time
> step — run it first, on your own machine, before `npm run dev`.

### 2. Web

```bash
cd web
npm install
# .env.local already points NEXT_PUBLIC_API_URL at localhost:4000/api
npm run dev
```

Visit `http://localhost:3000`.

> **Note on fonts:** the default Next.js Geist fonts (via `next/font/google`)
> were removed from `layout.tsx` because this sandbox couldn't reach Google
> Fonts servers. Feel free to add them back locally — they'll work fine on
> your machine.

## Project structure

```
eventdrop/
├── api/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── config/       env validation, prisma client
│       ├── routes/       route definitions
│       ├── controllers/  request handlers (to be added per feature)
│       ├── services/     business logic (to be added per feature)
│       ├── middlewares/  auth, error handling
│       ├── validators/   Zod schemas (to be added per feature)
│       ├── utils/        AppError, asyncHandler
│       ├── sockets/      Socket.IO setup
│       ├── app.ts        Express app assembly
│       └── server.ts     entrypoint
├── web/
│   └── src/
│       ├── app/           App Router pages
│       ├── components/ui/ shadcn-style primitives
│       └── lib/           api-client, utils
├── .env.example
└── README.md
```

## Next steps (build order)

1. ~~Organizer auth (register/login/logout, JWT + refresh cookies)~~ ✅
2. ~~Create Event + slug generation~~ ✅
3. ~~QR code generation/display~~ ✅
4. ~~Guest session creation~~ ✅
5. ~~Presigned R2 upload flow~~ ✅
6. ~~Photo metadata endpoint~~ ✅
7. ~~Live gallery + Socket.IO `photo:new` events~~ ✅
8. ~~Reactions~~ ✅
9. Organizer dashboard + moderation
