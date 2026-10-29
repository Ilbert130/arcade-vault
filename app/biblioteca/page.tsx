import Library from "@/components/library/Library";
import { getGamesWithStats } from "@/lib/catalog/queries";

export default async function Page() {
  const games = await getGamesWithStats();
  return <Library games={games} />;
}
