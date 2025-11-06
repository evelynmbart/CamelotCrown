# Courser - Chess Game Platform

A multiplayer chess game platform built with Next.js 16, Supabase, and TypeScript.

## Features

- 🎮 **Real-time Multiplayer** - Play live games with other players
- 👥 **Lobby System** - Create or join games with customizable settings
- 📊 **ELO Rating System** - Competitive ranking system
- 💬 **In-game Chat** - Communicate with your opponent
- 📈 **Player Profiles** - Track your stats and match history
- 🏆 **Leaderboard** - See top players
- ♟️ **Local Play** - Practice against yourself

## Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [pnpm](https://pnpm.io/) - `npm install -g pnpm`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local Supabase)
- [Supabase CLI](https://supabase.com/docs/guides/cli) - `brew install supabase/tap/supabase`

### Installation

1. **Clone the repository** (if you haven't already)

   ```bash
   cd /path/to/Courser
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   The default values are configured for local development.

4. **Start Supabase locally**

   ```bash
   supabase start
   ```

   This will:

   - Start a local Postgres database
   - Apply all migrations automatically
   - Start Supabase Studio (database UI)
   - Start other Supabase services

   Note: First run will take a few minutes to download Docker images.

5. **Run the development server**

   ```bash
   pnpm dev
   ```

6. **Open your browser**
   - App: [http://localhost:3000](http://localhost:3000)
   - Supabase Studio: [http://localhost:54323](http://localhost:54323)

### Test Users

For local development, two test users are automatically seeded:

| Email            | Password      | Username |
| ---------------- | ------------- | -------- |
| `alice@test.com` | `password123` | alice    |
| `bob@test.com`   | `password123` | bob      |

You can use these to test multiplayer features by logging in with different browsers or incognito windows.

## Development

### Database Management

```bash
# Reset database (reapply all migrations)
supabase db reset

# Check database status
supabase status

# Stop Supabase
supabase stop

# View database in Supabase Studio
open http://localhost:54323
```

### Creating New Migrations

```bash
# Create a new migration file
supabase migration new your_migration_name

# This creates: supabase/migrations/TIMESTAMP_your_migration_name.sql
# Edit the file and add your SQL
# Then run: supabase db reset
```

### Project Structure

```
Courser/
├── app/                    # Next.js 16 app directory
│   ├── auth/              # Authentication pages
│   ├── game/[id]/         # Game page
│   ├── lobby/             # Game lobby
│   ├── leaderboard/       # Player rankings
│   └── players/           # Player profiles
├── components/            # React components
│   ├── ui/               # UI components (shadcn/ui)
│   └── *.tsx             # Game-specific components
├── lib/                   # Utilities and logic
│   ├── chivalry-logic.ts # Game rules
│   ├── elo-system.ts     # Rating calculations
│   └── supabase/         # Supabase client setup
├── supabase/
│   ├── migrations/       # Database migrations
│   └── config.toml       # Supabase config
└── scripts/              # Legacy migration files (kept for reference)
```

## Database Schema

- **profiles** - User profiles with ELO ratings and stats
- **games** - Game records with board state and metadata
- **moves** - Detailed move history
- **game_chat** - In-game chat messages
- **game_requests** - Game challenges
- **messages** - Player-to-player messages
- **spectators** - Game spectator tracking

## Deployment

### Deploy to Vercel

1. **Create a Supabase Cloud project** at [supabase.com](https://supabase.com)

2. **Push migrations to production**

   ```bash
   # Link your project
   supabase link --project-ref your-project-ref

   # Push migrations
   supabase db push
   ```

3. **Deploy to Vercel**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel
   ```

4. **Set environment variables in Vercel**
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Deployment**: Vercel

## Useful Commands

```bash
# Development
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint

# Supabase
supabase start    # Start local Supabase
supabase stop     # Stop local Supabase
supabase status   # Check status
supabase db reset # Reset database
```

## Troubleshooting

### "Failed to start container" error

Make sure Docker Desktop is running.

### Port conflicts

If ports 54321-54324 are in use, stop Supabase and check for conflicts:

```bash
supabase stop
lsof -i :54321
```

### Database not updating

Reset the database to reapply migrations:

```bash
supabase db reset
```

## License

MIT
