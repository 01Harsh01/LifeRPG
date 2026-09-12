# ⚔️ Life RPG

Turn your real life into an RPG. Complete real-world quests, earn XP on a non-linear
leveling curve, grow six character attributes, maintain streaks, earn gold, buy
cosmetics in the shop, and unlock achievements — all backed by a real database.

## Live Demo
`https://your-frontend-url.vercel.app` — *(replace after deploying)*

---

## Core Features Implemented

- **Real Authentication & Security** — signup/login with bcrypt password hashing, JWT in an httpOnly cookie, session persists across refresh, protected routes. A user can only see and modify their own character data.
- **Quests (Full CRUD)** — create, read, update, delete, and complete quests. Due date support, category filters, and search. Rewards (XP/gold/attribute gain) are **always calculated server-side** from difficulty (`Easy`, `Medium`, `Hard`, `Epic`) — never trusted from the client.
- **Non-linear RPG Leveling Engine** — `XP required for level N = round(100 × N^1.5)`, correctly handling multi-level-ups in a single quest completion.
- **Character Attributes** — Strength, Intellect, Discipline, Vitality, Creativity, Social — each quest category dynamically boosts the matching character stat.
- **Daily Streak Tracking** — server-clock-based consecutive days tracker; prevents multi-quest inflation on the same day and tracks longest streak.
- **Virtual Economy & Shop** — Themes, Avatars, Frames, Badges, Titles, and Cosmetics. Purchases and balances are atomic and server-enforced via Prisma transactions.
- **Inventory & Cosmetic Equipping** — equip/unequip avatars, titles, and frames that dynamically alter the character card in real time.
- **Achievements System** — auto-unlocks server-side milestones (First Quest, On Fire 7-day streak, Quest Master, Scholar, Warrior, Wealthy Adventurer, Level 10).
- **Chronicles (Activity Feed)** — complete chronological log of quest completions, level ups, purchases, and achievements.
- **Tactile Celebrations & Web Audio** — celebratory level-up modals with Web Audio procedural sound effects (chimes, fanfares, coin clinks), canvas confetti bursts, animated XP bars, and sound toggle.
- **Responsive & Accessible UI** — full desktop sidebar and mobile bottom navigation with quick drawer, keyboard accessibility (Tab, Enter, Space, Escape to close modals), and `prefers-reduced-motion` compliance.

---

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, lucide-react, React Router
- **Backend:** Node.js, Express, TypeScript, Zod, JWT, bcryptjs, Helmet, express-rate-limit, cookie-parser
- **Database:** Prisma ORM with **SQLite** for zero-configuration local runs; ready for PostgreSQL deployment.

---

## Local Setup & Running

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev                 # Starts API on http://localhost:4000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev                 # Starts Vite dev server on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

### 3. Running Automated Tests
```bash
cd backend
npm test                    # Runs Jest tests for leveling math, rewards, and streaks
```

---

## Database Schema

```prisma
model User {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  passwordHash  String
  level         Int      @default(1)
  xp            Int      @default(0)
  gold          Int      @default(0)
  currentStreak Int      @default(0)
  longestStreak Int      @default(0)
  lastQuestDate DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  attributes    CharacterAttribute?
  quests        Quest[]
  inventory     InventoryItem[]
  achievements  UserAchievement[]
  activity      ActivityLog[]
}

model CharacterAttribute {
  id         String @id @default(uuid())
  userId     String @unique
  user       User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  strength   Int    @default(0)
  intellect  Int    @default(0)
  discipline Int    @default(0)
  vitality   Int    @default(0)
  creativity Int    @default(0)
  social     Int    @default(0)
}

model Quest {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String
  description String?
  category    String    // Coding | Study | Fitness | Health | Work | Personal | Reading | Creativity | Social | Custom
  difficulty  String    // Easy | Medium | Hard | Epic
  xpReward    Int
  goldReward  Int
  completed   Boolean   @default(false)
  completedAt DateTime?
  dueDate     DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model ShopItem {
  id          String   @id @default(uuid())
  name        String
  description String
  type        String   // Theme | Avatar | Frame | Badge | Title | Cosmetic
  price       Int
  rarity      String   // Common | Rare | Epic | Legendary
  icon        String
  createdAt   DateTime @default(now())
  purchases   InventoryItem[]
}

model InventoryItem {
  id           String    @id @default(uuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  itemId       String
  item         ShopItem  @relation(fields: [itemId], references: [id])
  quantity     Int       @default(1)
  equipped     Boolean   @default(false)
  purchasedAt  DateTime  @default(now())

  @@unique([userId, itemId])
}
```

---

## Environment Variables (`backend/.env`)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET=super_secret_life_rpg_jwt_secure_key_2026_dev_env
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
PORT=4000
NODE_ENV=development
```

---

## Walkthrough Video Guide (90-180s)

To satisfy the submission criteria:
1. **Sign up / Log in** — Create an account (e.g. `Arthur`, `arthur@rpg.dev`).
2. **Create a Quest** — Click "+ New Quest", fill in "Conquer Dungeon", select "Coding" + "Epic" difficulty.
3. **Complete Quest & Level Up** — Click "Complete Quest", enjoy the fanfare chime, confetti burst, and level up modal (`Level 1 -> 2`).
4. **Refresh Page (F5)** — Show that Level 2, XP, and gold persist from the database.
5. **Shop & Inventory** — Head to the Shop, buy an Avatar or Badge, equip it in your Bag, and see the Character Card update immediately!
