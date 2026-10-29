import Home from "@/components/home/Home";
import { getGames } from "@/lib/catalog/queries";

export default async function Page() {
  const games = await getGames();
  return <Home games={games} />;
}
