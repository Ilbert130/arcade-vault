import type { Database } from "@/lib/supabase/database.types";

export type Game = Database["public"]["Tables"]["games"]["Row"];

export type GameWithStats = Game & { best: number; plays: number };

export type LeaderboardRow = {
  rank: number;
  username: string;
  score: number;
  achievedAt: string; // ISO; se formatea como dd/mm/aaaa (es-ES) al renderizar
};
