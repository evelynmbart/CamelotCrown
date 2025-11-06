-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  elo_rating INTEGER DEFAULT 1200,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  games_lost INTEGER DEFAULT 0,
  games_drawn INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games table
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  white_player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  black_player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('live', 'correspondence')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'abandoned')),
  current_turn TEXT DEFAULT 'white' CHECK (current_turn IN ('white', 'black')),
  board_state JSONB NOT NULL,
  move_history JSONB DEFAULT '[]'::jsonb,
  winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  win_reason TEXT CHECK (win_reason IN ('castle_occupation', 'capture_all', 'no_legal_moves', 'resignation', 'timeout', 'draw')),
  white_castle_moves INTEGER DEFAULT 0,
  black_castle_moves INTEGER DEFAULT 0,
  last_move_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Moves table (for detailed move history)
CREATE TABLE IF NOT EXISTS public.moves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  move_number INTEGER NOT NULL,
  move_notation TEXT NOT NULL,
  move_type TEXT NOT NULL CHECK (move_type IN ('plain', 'Courser', 'jump', 'knight_charge', 'castle_move')),
  from_square TEXT NOT NULL,
  to_square TEXT NOT NULL,
  captured_pieces JSONB DEFAULT '[]'::jsonb,
  board_state_after JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matchmaking queue table
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('live', 'correspondence')),
  elo_rating INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Games policies
CREATE POLICY "games_select_own" ON public.games FOR SELECT 
  USING (auth.uid() = white_player_id OR auth.uid() = black_player_id OR status = 'waiting');
CREATE POLICY "games_insert_own" ON public.games FOR INSERT 
  WITH CHECK (auth.uid() = white_player_id OR auth.uid() = black_player_id);
CREATE POLICY "games_update_players" ON public.games FOR UPDATE 
  USING (auth.uid() = white_player_id OR auth.uid() = black_player_id);

-- Moves policies
CREATE POLICY "moves_select_game_players" ON public.moves FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.games 
      WHERE games.id = moves.game_id 
      AND (games.white_player_id = auth.uid() OR games.black_player_id = auth.uid())
    )
  );
CREATE POLICY "moves_insert_own" ON public.moves FOR INSERT 
  WITH CHECK (auth.uid() = player_id);

-- Matchmaking queue policies
CREATE POLICY "queue_select_all" ON public.matchmaking_queue FOR SELECT USING (true);
CREATE POLICY "queue_insert_own" ON public.matchmaking_queue FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "queue_delete_own" ON public.matchmaking_queue FOR DELETE USING (auth.uid() = player_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_white_player ON public.games(white_player_id);
CREATE INDEX IF NOT EXISTS idx_games_black_player ON public.games(black_player_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);
CREATE INDEX IF NOT EXISTS idx_moves_game_id ON public.moves(game_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_game_type ON public.matchmaking_queue(game_type);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_created_at ON public.matchmaking_queue(created_at);
