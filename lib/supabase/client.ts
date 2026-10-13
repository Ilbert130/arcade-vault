import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type BrowserClient = ReturnType<typeof createClient>;
// Cliente para Client Components. Lanza si faltan las variables de entorno;
// los consumidores deben envolver la llamada en try/catch (o usar getSupabase).
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
// Como createClient, pero devuelve null en vez de lanzar: la UI sigue renderizando sin sesión.
export function getSupabase(): BrowserClient | null {
  try {
    return createClient();
  } catch {
    return null;
  }
}
export async function fetchUsername(
  supabase: BrowserClient,
  userId: string,
): Promise<Profile["username"] | null> {
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  return data?.username ?? null;
}
// username del usuario con sesión, o null si no hay sesión (o Supabase no está disponible).
export async function getCurrentUsername(): Promise<
  Profile["username"] | null
> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? await fetchUsername(supabase, user.id) : null;
  } catch {
    return null;
  }
}
