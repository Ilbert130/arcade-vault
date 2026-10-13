import HallOfFame from "@/components/HallOfFame";
import { getGames, getLeaderboard, getPlayerBest } from "@/lib/games/queries";
import type { LeaderboardRow } from "@/lib/games/types";
import { createClient } from "@/lib/supabase/server";

// id del usuario con sesión, o null (sin sesión o Supabase no disponible).
async function getUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export default async function Page(props: PageProps<"/salon">) {
  const { juego } = await props.searchParams;
  const games = await getGames();
  // ?juego ausente o inválido → primer juego por sort_order.
  const game = games.find((g) => g.id === juego) ?? games[0];
  if (!game) {
    return <HallOfFame games={[]} game={null} rows={[]} you={undefined} />;
  }

  const [rows, userId] = await Promise.all([
    getLeaderboard(game.id, 10),
    getUserId(),
  ]);
  // undefined = sin sesión (no se muestra la fila); null = con sesión y sin marca.
  let you: LeaderboardRow | null | undefined;
  if (userId) you = await getPlayerBest(game.id, userId);

  return <HallOfFame games={games} game={game} rows={rows} you={you} />;
}
