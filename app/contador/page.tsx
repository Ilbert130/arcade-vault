import type { Metadata } from "next";
import Contador from "@/components/contador/Contador";
export const metadata: Metadata = { title: "Contador Pokémon · Arcade Vault" };
export default function Page() {
  return <Contador />;
}
