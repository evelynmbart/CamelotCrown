import type { BoardState } from "@/lib/camelot/types";

export interface Player {
  id: string;
  username: string;
  elo_rating: number;
}

export interface TimeControl {
  minutes: number;
  increment: number; // in seconds
}

export interface GameData {
  id: string;
  white_player_id: string;
  black_player_id: string;
  white_player: Player;
  black_player: Player;
  status: string;
  current_turn: string;
  board_state: BoardState;
  move_history: string[];
  white_castle_moves: number;
  black_castle_moves: number;
  time_control_minutes?: number | null;
  time_control_increment?: number | null;
  white_time_remaining?: number | null; // milliseconds
  black_time_remaining?: number | null; // milliseconds
  last_move_time?: string | null;
  winner_id?: string;
  win_reason?: string;
  completed_at?: string;
}

