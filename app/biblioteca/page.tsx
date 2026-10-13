import Library from "@/components/Library";
import { getGamesWithStats } from "@/lib/games/queries";

export default async function Page() {
  const games = await getGamesWithStats();
  return <Library games={games} />;
}
