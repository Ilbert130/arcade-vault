"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export type SaveScoreResult = { ok: true } | { ok: false; error: string };
const MAX_SCORE = 99_999_999;
const ERR = {
  noSession: "Inicia sesión para guardar tu marca.",
  notPlayable: "Este juego aún no guarda puntuaciones.",
  invalidScore: "Puntuación inválida.",
  generic: "No se pudo guardar. Inténtalo de nuevo.",
} as const;
export async function saveScore(input: {
  gameId: string;
  score: number;
}): Promise<SaveScoreResult> {
  const gameId = typeof input?.gameId === "string" ? input.gameId : "";
  const score = input?.score;
  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    return { ok: false, error: ERR.invalidScore };
  }
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: ERR.noSession };
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id, playable")
      .eq("id", gameId)
      .maybeSingle();
    if (gameError) return { ok: false, error: ERR.generic };
    if (!game?.playable) return { ok: false, error: ERR.notPlayable };
    // RLS (scores_insert_own_playable) es la garantía final.
    const { error } = await supabase
      .from("scores")
      .insert({ game_id: game.id, score, user_id: user.id });
    if (error) return { ok: false, error: ERR.generic };
  } catch {
    return { ok: false, error: ERR.generic };
  }
  revalidatePath("/salon");
  revalidatePath("/biblioteca");
  revalidatePath(`/juegos/${gameId}`);
  return { ok: true };
}
