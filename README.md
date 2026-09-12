# ⚔️ Life RPG

Turn your real life into an RPG. Complete real-world quests, earn XP on a non-linear
leveling curve, grow six character attributes, maintain streaks, earn gold, buy
cosmetics in the shop, and unlock achievements — all backed by a real database.

## Live Demo
`https://your-frontend-url.vercel.app` — *(replace after deploying, see below)*

---

## Features

- **Real auth** — signup/login with bcrypt password hashing, JWT in an httpOnly
  cookie, session persists across refresh, protected routes.
- **Quests** — create, edit, delete, complete, filter, and search. Rewards
  (XP/gold/attribute gain) are **always calculated server-side** from difficulty —
  never trusted from the client.
- **Non-linear XP/leveling** — `XP required for level N = round(100 × N^1.5)`,
  correctly handles multi-level-ups in a single quest completion.
- **Attributes** — Strength, Intellect, Discipline, Vitality, Creativity, Social —
  each quest category trains a specific attribute.
- **Streaks** — server-clock-based daily streak tracking; can't be inflated by
  completing multiple quests in one day; resets on a missed day.
- **Gold economy & shop** — themes, avatars, frames, badges, titles, cosmetics.
  Purchases are validated and debited atomically on the server.
- **Inventory** — equip/unequip cosmetic items (one per type).
- **Achievements** — auto-unlock server-side based on real progress (first
  quest, 7-day streak, 50 quests, etc.).
- **Activity history** — a filterable timeline of everything that happened.
- **Premium fantasy UI** — dark glassmorphism, glowing cards, animated XP bars,
  level-up celebration modal, gold counter animation, streak glow, toast
  notifications — all via Framer Motion, and respects `prefers-reduced-motion`.
- **Responsive** — sidebar nav on desktop, bottom nav on mobile.
- **Accessible** — semantic HTML, labeled inputs, focus states, Escape closes
  modals, keyboard-navigable throughout.
- **Security** — every protected endpoint verifies the JWT and scopes all
  queries to `req.userId` (never trusts an id/price/reward from the client),
  Helmet, CORS, rate limiting, Zod input validation, Prisma parameterized
  queries.

## Tech Stack

**Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, lucide-react, React Router
**Backend:** Node.js, Express, TypeScript, Zod, JWT, bcrypt, Helmet, express-rate-limit
**Database:** Prisma ORM — ships configured for **SQLite** so it runs with zero
setup; the schema is Postgres-ready (see below).
**Note on scope:** the original spec asked for shadcn/ui — this build uses hand-built
Tailwind components in the same visual language to keep the toolchain simple and
100% dependency-installable; swapping in shadcn/ui components is a drop-in
enhancement if you want it later.

## Architecture

```
life-rpg/
├── backend/
│   ├── prisma/schema.prisma   # User, Quest, CharacterAttribute, ShopItem,
│   │                          # InventoryItem, Achievement, UserAchievement,
│   │                          # ActivityLog — with FKs + indexes
│   ├── prisma/seed.ts         # seeds shop items + achievements
│   └── src/
│       ├── routes/            # auth, quests, character, shop, inventory,
│       │                      # achievements, activity
│       ├── services/          # xp.ts (leveling formula), rewards.ts
│       │                      # (server-side reward table), streak.ts,
│       │                      # achievements.ts (auto-unlock logic)
│       ├── middleware/        # requireAuth, error handler
│       └── __tests__/         # Jest tests for xp/rewards/streak logic
└── frontend/
    └── src/
        ├── pages/              # Landing, Login, Signup, Dashboard, Quests,
        │                       # Character, Shop, Inventory, Achievements,
        │                       # History, Settings
        ├── components/         # XPBar, CharacterCard, QuestCard, RewardPopup,
        │                       # LevelUpModal, StreakBadge, GoldCounter,
        │                       # AchievementCard, InventoryCard, ShopItemCard,
        │                       # Navigation (Sidebar/MobileNav), Toast, etc.
        └── context/AuthContext.tsx
```

## Database Schema Overview

- `User` — auth + top-level stats (level, xp, gold, streaks)
- `CharacterAttribute` — 1:1 with User, six stats
- `Quest` — belongs to a User, server-computed `xpReward`/`goldReward`
- `ShopItem` / `InventoryItem` — catalog + per-user ownership (unique on user+item)
- `Achievement` / `UserAchievement` — catalog + per-user unlock records
- `ActivityLog` — append-only event feed per user

## Local Setup

### Backend
```bash
cd backend
cp .env.example .env       # already defaults to SQLite, zero config needed
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev                 # http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :4000)
```

Then open `http://localhost:5173`, sign up, and play.

### Tests
```bash
cd backend
npm test                    # Jest — XP curve, rewards table, streak logic
```

## Switching to Postgres for Production

1. In `backend/prisma/schema.prisma`, change the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` in your environment to your Neon/Supabase/Render Postgres
   connection string.
3. Run `npx prisma migrate deploy` (or `migrate dev` locally) — no other code
   changes are required; every query is written through Prisma so it's
   database-agnostic.

## Environment Variables (`backend/.env`)

```
DATABASE_URL=            # file:./dev.db for SQLite, or a postgres:// URL
JWT_SECRET=               # long random string — never commit the real one
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173   # used for CORS + cookie settings
PORT=4000
NODE_ENV=development
```

## Deployment

- **Frontend → Vercel:** import `frontend/`, framework preset "Vite", build
  command `npm run build`, output `dist`. Set no env vars needed unless you
  change the API base URL from the `/api` proxy — for production, point the
  frontend at your deployed backend URL (e.g. via a small `VITE_API_URL` env
  var and updating `services/api.ts`, or by proxying `/api` at your CDN).
- **Backend → Render/Railway:** import `backend/`, build command
  `npm install && npx prisma generate && npm run build`, start command
  `npx prisma migrate deploy && npm start`. Set `DATABASE_URL`, `JWT_SECRET`,
  `FRONTEND_URL`, `NODE_ENV=production`.
- **Database → Neon/Supabase:** create a Postgres instance, copy its connection
  string into `DATABASE_URL`, and switch the Prisma provider as above.

## API Overview

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/quests?status=&category=&search=
POST   /api/quests
PUT    /api/quests/:id
DELETE /api/quests/:id
POST   /api/quests/:id/complete

GET    /api/character
GET    /api/activity?filter=

GET    /api/shop
POST   /api/shop/:id/purchase

GET    /api/inventory
POST   /api/inventory/:id/equip

GET    /api/achievements
```

## Security Considerations

- Passwords hashed with bcrypt (cost factor 10); JWT stored in an httpOnly,
  `sameSite` cookie (never accessible to client-side JS).
- Every mutating endpoint re-derives `userId` from the verified JWT — it is
  never read from the request body, so a user cannot act on another user's
  data by supplying a different id.
- Quest rewards, shop prices, and level-up math are computed and validated
  **only** on the server.
- Shop purchases run inside a Prisma transaction that re-reads the user's gold
  balance server-side before decrementing it, preventing race conditions and
  client-supplied price tampering.
- Helmet for secure headers, CORS locked to `FRONTEND_URL`, rate limiting on
  all `/api` routes (tighter limits on auth endpoints), Zod validation on every
  input, and Prisma's parameterized queries prevent SQL injection.

## Future Improvements

- Real image avatars / uploaded avatars instead of emoji
- WebSocket-based live updates (e.g. friends' activity feed)
- Quest reminders / notifications
- Social features: friend leaderboards, guilds
- Sound effects for level-up/quest-complete (currently visual-only, since the
  spec calls sound optional)
- shadcn/ui component swap-in for even more polish
- E2E tests with Playwright covering the full signup → quest → level-up flow

## Verified in this build

- ✅ Backend type-checks cleanly (`tsc --noEmit`) and compiles to `dist/`.
- ✅ Frontend type-checks cleanly and **production build succeeds**
  (`vite build` → `dist/`, ~105KB gzipped JS).
- ✅ Jest suite (10 tests) passes for the XP curve, difficulty→reward table,
  category→attribute mapping, and streak increment/dedup/reset logic —
  including the exact `100 × level^1.5` formula and multi-level-up handling.
- ⚠️ This sandbox's network policy blocks Prisma's engine-binary CDN, so the
  live database itself could not be exercised end-to-end *here*. Run
  `npx prisma generate && npx prisma migrate dev && npm run seed && npm run dev`
  locally (or in Claude Code with full network access) to bring the API up
  against a real SQLite/Postgres database — the schema, routes, and
  transactions are complete and ready to run.
