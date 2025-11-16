-- Add time control fields to games table
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS time_control_minutes INTEGER, -- initial time in minutes
ADD COLUMN IF NOT EXISTS time_control_increment INTEGER DEFAULT 0, -- increment in seconds
ADD COLUMN IF NOT EXISTS white_time_remaining INTEGER, -- time remaining in milliseconds
ADD COLUMN IF NOT EXISTS black_time_remaining INTEGER, -- time remaining in milliseconds
ADD COLUMN IF NOT EXISTS last_move_time TIMESTAMPTZ; -- when the last move was made

-- Add index for games that need timeout checking
CREATE INDEX IF NOT EXISTS idx_games_active_timed ON public.games(status, last_move_time) 
  WHERE status = 'active' AND time_control_minutes IS NOT NULL;

-- Add timeout as a valid win reason (already exists, just ensuring)
-- win_reason TEXT CHECK (win_reason IN ('castle_occupation', 'capture_all', 'no_legal_moves', 'resignation', 'timeout', 'draw'))

-- Update existing games to have null time control (correspondence games)
UPDATE public.games 
SET time_control_minutes = NULL,
    time_control_increment = 0,
    white_time_remaining = NULL,
    black_time_remaining = NULL
WHERE time_control_minutes IS NULL;

