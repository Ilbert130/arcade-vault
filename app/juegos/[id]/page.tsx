import { notFound } from "next/navigation";
import GameDetail from "@/components/game-detail/GameDetail";
import { getGame, getGameStats, getLeaderboard } from "@/lib/catalog/queries";
export default async function GameDetailPage(props: PageProps<"/juegos/[id]">) {
  const { id } = await props.params;
  const game = await getGame(id);
  if (!game) notFound();
  const [stats, scores] = await Promise.all([
    getGameStats(id),
    getLeaderboard(id, 10),
  ]);
  return <GameDetail game={game} stats={stats} scores={scores} />;
}
