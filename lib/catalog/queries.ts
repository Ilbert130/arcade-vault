// Solo servidor: usa el cliente de Supabase con cookies (lib/supabase/server.ts).
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type {
  Game,
  GameStats,
  GameWithStats,
  LeaderboardRow,
} from "@/lib/catalog/types";
type LeaderboardView = Database["public"]["Views"]["leaderboard"]["Row"];
// Las columnas de las vistas llegan como nullable en los tipos generados.
function toLeaderboardRow(r: LeaderboardView): LeaderboardRow {
  return {
    rank: r.rank ?? 0,
    username: r.username ?? "—",
    score: r.score ?? 0,
    achievedAt: r.achieved_at ?? "",
  };
}
export async function getGames(): Promise<Game[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("playable", true)
      .order("sort_order");
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}
export async function getGamesWithStats(): Promise<GameWithStats[]> {
  try {
    const supabase = await createClient();
    const [games, stats] = await Promise.all([
      supabase
        .from("games")
        .select("*")
        .eq("playable", true)
        .order("sort_order"),
      supabase.from("game_stats").select("*"),
    ]);
    if (games.error || !games.data) return [];
    const byGame = new Map(
      (stats.data ?? []).map((s) => [s.game_id, s] as const),
    );
    return games.data.map((g) => {
      const s = byGame.get(g.id);
      return { ...g, best: s?.best ?? 0, plays: s?.plays ?? 0 };
    });
  } catch {
    return [];
  }
}
export async function getGame(id: string): Promise<Game | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("id", id)
      .eq("playable", true)
      .maybeSingle();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}
export async function getGameStats(id: string): Promise<GameStats> {
  const empty = { best: 0, plays: 0 };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("game_stats")
      .select("best, plays")
      .eq("game_id", id)
      .maybeSingle();
    if (error || !data) return empty;
    return { best: data.best ?? 0, plays: data.plays ?? 0 };
  } catch {
    return empty;
  }
}
export async function getLeaderboard(
  gameId: string,
  limit = 10,
): Promise<LeaderboardRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .eq("game_id", gameId)
      .order("rank")
      .limit(limit);
    if (error || !data) return [];
    return data.map(toLeaderboardRow);
  } catch {
    return [];
  }
}
export async function getPlayerBest(
  gameId: string,
  userId: string,
): Promise<LeaderboardRow | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .eq("game_id", gameId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return toLeaderboardRow(data);
  } catch {
    return null;
  }
}
