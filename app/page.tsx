import Home from "@/components/Home";
import { getGames } from "@/lib/games/queries";

export default async function Page() {
  const games = await getGames();
  return <Home games={games} />;
}
