import { notFound } from "next/navigation";
import GamePlayer from "@/components/GamePlayer";
import { getGame } from "@/lib/games/queries";

export default async function GamePlayerPage(
  props: PageProps<"/juegos/[id]/jugar">,
) {
  const { id } = await props.params;
  const game = await getGame(id);
  if (!game) notFound();
  return <GamePlayer game={game} />;
}
