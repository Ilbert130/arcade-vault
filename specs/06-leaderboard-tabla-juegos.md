# 06 — Leaderboard real y catálogo de juegos en Supabase

**Estado:** Implementado
**Depende de:** SPEC 04-supabase-auth, SPEC 05-asteroides-rocas
**Fecha:** 2026-10-02

**Objetivo:** Mover el catálogo de juegos a una tabla `public.games` en Supabase y guardar las puntuaciones de partidas reales en `public.scores`, para que el Salón de la Fama, el detalle de cada juego y la Biblioteca muestren rankings y estadísticas reales en lugar de datos sembrados.

## Alcance

**Incluye:**

- Migración SQL versionada `supabase/migrations/<timestamp>_games_scores.sql`, aplicada al proyecto remoto con el MCP de Supabase (`apply_migration`):
  - Tabla `public.games` (catálogo) con RLS y lectura pública, sembrada con los 8 juegos actuales de `lib/data.ts` (mismos `id`, textos, `cat`, `cover`, `color`, en el mismo orden).
  - Columna `games.playable`: `true` solo para `rocas`; el resto `false`.
  - Tabla `public.scores` (historial de partidas) con RLS: lectura pública; inserción solo para usuarios autenticados, con `user_id = auth.uid()` y solo en juegos `playable`; sin update ni delete para clientes.
  - Vista `public.leaderboard` (`security_invoker`): mejor marca por jugador y juego, con `username` y `rank`.
  - Vista `public.game_stats` (`security_invoker`): `best` (máxima puntuación) y `plays` (nº de partidas guardadas) por juego, con 0 si no hay partidas.
- Tipos regenerados con el MCP (`generate_typescript_types`) en `lib/supabase/database.types.ts`.
- Capa de datos de servidor:
  - `lib/games/types.ts`: tipos `Game`, `GameWithStats`, `LeaderboardRow`.
  - `lib/games/queries.ts`: `getGames`, `getGamesWithStats`, `getGame`, `getGameStats`, `getLeaderboard`, `getPlayerBest` usando `lib/supabase/server.ts`.
- `lib/data.ts`: se eliminan `GAMES`, `PLAYERS`, `seededScores`, `ScoreRow` y el tipo `Game`; solo queda `CATS`.
- `/biblioteca`:
  - `app/biblioteca/page.tsx` (Server Component) obtiene `getGamesWithStats()` y lo pasa por props a `components/Library.tsx` (sigue siendo cliente para búsqueda y filtros).
  - `components/GameCard.tsx` recibe `GameWithStats`; "MEJOR PUNTUACIÓN" muestra `best` real o `—` si es 0.
- `/juegos/[id]` (`app/juegos/[id]/page.tsx`):
  - Lee el juego con `getGame(id)`; `notFound()` si no existe.
  - "Partidas" y "Mejor global" muestran `plays` y `best` reales (`—` en mejor global si es 0).
  - "MEJORES PUNTUACIONES" muestra el top 10 real de `leaderboard` (rango, usuario, fecha `dd/mm/aaaa`, puntuación).
  - Estado vacío: "AÚN NO HAY MARCAS" + "¡SÉ EL PRIMERO!".
  - "Dificultad" y las etiquetas del detalle no cambian.
- `/juegos/[id]/jugar`:
  - `app/juegos/[id]/jugar/page.tsx` pasa a Server Component: obtiene el juego con `getGame`, `notFound()` si no existe, y renderiza el nuevo `components/GamePlayer.tsx` (cliente) con `game` por props.
  - `components/GamePlayer.tsx` contiene la lógica actual de la página (simulación, ROCAS, HUD, pausa, modal) sin cambios de comportamiento salvo el modal.
  - Server Action `saveScore` en `app/juegos/[id]/jugar/actions.ts` (`"use server"`).
  - Modal "FIN DEL JUEGO", según el caso:
    - Juego no `playable` (simulado): texto "PUNTUACIÓN NO CLASIFICABLE (DEMO)" y sin botón de guardar.
    - `playable` sin sesión: "INICIA SESIÓN PARA GUARDAR TU MARCA" y botón "INICIAR SESIÓN" que navega a `/auth`. La puntuación no se guarda.
    - `playable` con sesión: el nombre se muestra como el `username` (solo lectura, desaparece el input de iniciales) y botón "GUARDAR PUNTUACIÓN".
    - Estados del guardado: `idle` → `saving` (botón deshabilitado, "GUARDANDO…") → `saved` ("▸ PUNTUACIÓN GUARDADA_") o `error` (mensaje en español y botón para reintentar).
    - "JUGAR DE NUEVO" vuelve el guardado a `idle`.
- `/salon`:
  - `app/salon/page.tsx` (Server Component) lee `searchParams.juego`; si falta o no es un `id` válido, usa el primer juego por `sort_order`.
  - Obtiene los juegos, el top 10 del juego activo y, si hay sesión, la mejor marca del usuario con su rango real (`getPlayerBest`).
  - `components/HallOfFame.tsx` deja de ser cliente: recibe todo por props; las pestañas son `<Link href="/salon?juego=<id>">` con `chip active` en la activa.
  - Podio con los 3 primeros del top 10 (solo se dibujan los puestos que existen); tabla con el top 10.
  - Estado vacío del juego: "AÚN NO HAY MARCAS EN <TÍTULO>" en lugar de podio y tabla.
  - Con sesión: fila "▸ TU MEJOR MARCA EN <TÍTULO>" con rango, usuario, puntuación y fecha reales, aunque esté fuera del top 10. Si no tiene marca: "AÚN NO TIENES MARCA EN <TÍTULO>". Sin sesión no se muestra la fila.
- Se elimina `lib/session.ts` (su único export, `saveScore` de `localStorage`, queda sustituido). La clave `av_scores` deja de usarse.
- Revalidación tras guardar: `revalidatePath` de `/salon`, `/biblioteca` y `/juegos/<id>`.
- Diseño de estados nuevos (vacíos, modal invitado/demo/error) con `/frontend-design`, coherente con los estilos existentes de `globals.css`.

**No incluye (fuera de alcance de este spec):**

- Home (`components/Home.tsx` y `lib/mock-data.ts`): actividad reciente y top jugadores siguen con datos ficticios.
- Guardar puntuaciones de invitados o "puntuación pendiente" que se sube tras iniciar sesión.
- Guardar puntuaciones de los 7 juegos simulados (se activará al poner `playable = true` en el spec de cada juego real).
- Anti-trampas o validación de la partida en servidor más allá del rango del `score`.
- Panel de administración del catálogo, edición de juegos desde la UI o subida de portadas (las portadas siguen siendo clases CSS `.cover-*`).
- Paginación, filtros por fecha (semanal/mensual) o ranking global entre juegos.
- Perfil de jugador o historial de partidas propio.
- Realtime (el leaderboard no se actualiza solo; se ve al recargar o navegar).
- Migrar las puntuaciones existentes en `localStorage` (`av_scores`).
- Borrar o editar puntuaciones.

## Modelo de datos

### Base de datos (`supabase/migrations/<timestamp>_games_scores.sql`)

```sql
create table public.games (
  id         text primary key check (id ~ '^[a-z0-9-]{2,32}$'),
  title      text not null,
  short      text not null,
  long       text not null,
  cat        text not null check (cat in ('ARCADE','PUZZLE','SHOOTER','VERSUS')),
  cover      text not null,           -- clase CSS .cover-* de globals.css
  color      text not null check (color in ('cyan','magenta','yellow','green')),
  playable   boolean not null default false,
  sort_order int not null unique,
  created_at timestamptz not null default now()
);

alter table public.games enable row level security;
create policy "games_select_all" on public.games
  for select to anon, authenticated using (true);
-- Sin políticas de escritura: el catálogo solo cambia por migración.

-- Semilla: los 8 juegos de lib/data.ts (sort_order 1..8), rocas con playable = true.

create table public.scores (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid()
             references public.profiles(id) on delete cascade,
  game_id    text not null references public.games(id) on delete cascade,
  score      integer not null check (score between 0 and 99999999),
  created_at timestamptz not null default now()
);

create index scores_game_score_idx on public.scores (game_id, score desc, created_at);
create index scores_user_idx on public.scores (user_id);

alter table public.scores enable row level security;
create policy "scores_select_all" on public.scores
  for select to anon, authenticated using (true);
create policy "scores_insert_own_playable" on public.scores
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.games g where g.id = game_id and g.playable)
  );
-- Sin update/delete para clientes.

-- Mejor marca por jugador y juego; empate → gana quien la consiguió antes.
create view public.leaderboard with (security_invoker = true) as
select b.game_id, b.user_id, p.username, b.score, b.achieved_at,
       row_number() over (partition by b.game_id
                          order by b.score desc, b.achieved_at asc) as rank
from (
  select distinct on (game_id, user_id)
         game_id, user_id, score, created_at as achieved_at
  from public.scores
  order by game_id, user_id, score desc, created_at asc
) b
join public.profiles p on p.id = b.user_id;

create view public.game_stats with (security_invoker = true) as
select g.id as game_id,
       coalesce(max(s.score), 0) as best,
       count(s.id)               as plays
from public.games g
left join public.scores s on s.game_id = g.id
group by g.id;
```

### TypeScript (`lib/games/types.ts`)

```ts
export type Game = Database["public"]["Tables"]["games"]["Row"];
// { id, title, short, long, cat, cover, color, playable, sort_order, created_at }

export type GameWithStats = Game & { best: number; plays: number };

export type LeaderboardRow = {
  rank: number;
  username: string;
  score: number;
  achievedAt: string; // ISO; se formatea como dd/mm/aaaa (es-ES) al renderizar
};
```

### Consultas (`lib/games/queries.ts`, solo servidor)

```ts
export async function getGames(): Promise<Game[]>; // orden sort_order
export async function getGamesWithStats(): Promise<GameWithStats[]>;
export async function getGame(id: string): Promise<Game | null>;
export async function getGameStats(
  id: string,
): Promise<{ best: number; plays: number }>;
export async function getLeaderboard(
  gameId: string,
  limit = 10,
): Promise<LeaderboardRow[]>;
export async function getPlayerBest(
  gameId: string,
  userId: string,
): Promise<LeaderboardRow | null>;
```

### Server Action (`app/juegos/[id]/jugar/actions.ts`)

```ts
type SaveScoreResult = { ok: true } | { ok: false; error: string };

export async function saveScore(input: {
  gameId: string;
  score: number;
}): Promise<SaveScoreResult>;
```

Mensajes de error: "Inicia sesión para guardar tu marca." (sin sesión), "Este juego aún no guarda puntuaciones." (no `playable` o inexistente), "Puntuación inválida." (no entero o fuera de 0–99.999.999), "No se pudo guardar. Inténtalo de nuevo." (genérico).

### Archivos

```
supabase/migrations/<timestamp>_games_scores.sql   nuevo
lib/supabase/database.types.ts                     regenerado
lib/games/types.ts                                 nuevo
lib/games/queries.ts                               nuevo
lib/data.ts                                        solo CATS
lib/session.ts                                     eliminado
app/biblioteca/page.tsx                            fetch + props
components/Library.tsx, components/GameCard.tsx    reciben datos por props
app/juegos/[id]/page.tsx                           datos reales
app/juegos/[id]/jugar/page.tsx                     Server Component
app/juegos/[id]/jugar/actions.ts                   nuevo
components/GamePlayer.tsx                          nuevo (lógica movida de jugar/page.tsx)
app/salon/page.tsx, components/HallOfFame.tsx      datos reales + ?juego=
```

## Plan de implementación

1. **Documentación.** Leer en `node_modules/next/dist/docs/` lo relativo a `searchParams`/`PageProps` en Server Components, Server Actions, `revalidatePath` y el modelo de caché de Next.js 16.3.3 antes de escribir código.
2. **Migración.** Crear `supabase/migrations/<timestamp>_games_scores.sql` con tablas, políticas, índices, vistas y la semilla de los 8 juegos. Aplicarla con `apply_migration`. Verificar con `list_tables` y `get_advisors` (security) que no hay avisos nuevos (RLS, `security_definer_view`).
3. **Tipos.** Regenerar `lib/supabase/database.types.ts` con `generate_typescript_types`. Crear `lib/games/types.ts`. `npm run build` pasa.
4. **Consultas.** Crear `lib/games/queries.ts` con las seis funciones tipadas. Ante error de Supabase: las de lista devuelven `[]`, `getGame`/`getPlayerBest` devuelven `null`, `getGameStats` devuelve `{ best: 0, plays: 0 }`.
5. **Biblioteca.** `app/biblioteca/page.tsx` obtiene `getGamesWithStats()` y lo pasa a `Library`; `Library` filtra sobre la prop; `GameCard` usa `GameWithStats` y muestra `—` si `best === 0`.
6. **Detalle.** `app/juegos/[id]/page.tsx` usa `getGame`, `getGameStats` y `getLeaderboard(id, 10)`; estado vacío del leaderboard.
7. **Jugar: separación server/cliente.** Mover el cuerpo de `app/juegos/[id]/jugar/page.tsx` a `components/GamePlayer.tsx` con `game: Game` por props; la página pasa a Server Component con `getGame` + `notFound()`. El modal sigue usando temporalmente `saveScore` de `lib/session.ts`. El juego funciona igual que antes.
8. **Server Action.** Crear `app/juegos/[id]/jugar/actions.ts` con `saveScore`: `auth.getUser()`, validación de `score` (entero, rango), comprobación de juego `playable`, `insert` en `scores`, `revalidatePath` de `/salon`, `/biblioteca` y `/juegos/<id>`; errores mapeados a los mensajes del modelo de datos.
9. **Modal.** En `GamePlayer.tsx`: tres variantes (demo, invitado, con sesión), estados `idle | saving | saved | error`, `username` en solo lectura, reset del guardado en "JUGAR DE NUEVO". Eliminar `lib/session.ts` y confirmar por búsqueda que no quedan referencias a `saveScore` de `localStorage` ni a `av_scores`.
10. **Salón.** `app/salon/page.tsx` lee `searchParams.juego`, resuelve el juego activo, obtiene top 10 y, con sesión (cliente server `auth.getUser()`), `getPlayerBest`. `HallOfFame.tsx` pasa a componente sin `"use client"`, pestañas con `Link`, podio parcial, estado vacío y fila "TU MEJOR MARCA" real.
11. **Limpieza de `lib/data.ts`.** Eliminar `GAMES`, `PLAYERS`, `seededScores`, `ScoreRow` y `Game`; dejar `CATS`. Confirmar por búsqueda que no quedan imports.
12. **Diseño.** Aplicar `/frontend-design` a los estados vacíos (detalle y Salón), las variantes del modal y el estado de error, con estilos nuevos en `globals.css` si hacen falta.
13. **Verificación manual.** `npm run dev`:
    - `/biblioteca` muestra los 8 juegos en el mismo orden que antes; las tarjetas muestran `—` hasta que haya marcas.
    - Sin sesión, jugar ROCAS hasta FIN → el modal muestra "INICIA SESIÓN PARA GUARDAR TU MARCA" y el botón lleva a `/auth`.
    - Con sesión (`PX_KAI`), jugar ROCAS y guardar → "▸ PUNTUACIÓN GUARDADA_"; existe la fila en `public.scores` con su `user_id`.
    - `/juegos/rocas` muestra la marca en el top 10, "Partidas" = 1 y "Mejor global" = esa puntuación.
    - Guardar una segunda partida peor con el mismo usuario → el top sigue mostrando una sola fila de `PX_KAI` con la mejor; "Partidas" = 2.
    - `/salon?juego=rocas` muestra podio, tabla y la fila "TU MEJOR MARCA" con rango real; `/salon?juego=caida` muestra "AÚN NO HAY MARCAS EN CAÍDA"; `/salon?juego=xyz` y `/salon` muestran el primer juego.
    - En un juego simulado (`/juegos/caida/jugar`), FIN muestra "PUNTUACIÓN NO CLASIFICABLE (DEMO)" sin botón de guardar.
    - Insert directo vía REST con la publishable key sin sesión, con otro `user_id` o en un juego no `playable` → rechazado por RLS.
    - `npm run build` y `npm run lint` sin errores; consola del navegador sin errores.

## Criterios de aceptación

- [x] `supabase/migrations/<timestamp>_games_scores.sql` está en el repo y en el proyecto remoto existen `public.games` (8 filas, solo `rocas` con `playable = true`), `public.scores`, `public.leaderboard` y `public.game_stats`, con RLS activado en ambas tablas.
- [x] `get_advisors` (security) no reporta avisos nuevos sobre `games`, `scores`, `leaderboard` ni `game_stats`.
- [x] `lib/supabase/database.types.ts` incluye `games`, `scores` y las dos vistas; no hay `any` ni `@ts-ignore` en el código nuevo.
- [x] `lib/data.ts` solo exporta `CATS`; `lib/session.ts` no existe; ninguna parte de la app usa `seededScores`, `GAMES` de `lib/data.ts` ni la clave `av_scores`.
- [x] `/biblioteca`, `/juegos/[id]`, `/juegos/[id]/jugar` y `/salon` obtienen el catálogo de `public.games`; un `id` inexistente en `/juegos/[id]` y `/juegos/[id]/jugar` devuelve 404.
- [x] Las tarjetas de Biblioteca muestran la mejor puntuación real o `—`; el detalle muestra "Partidas" y "Mejor global" reales.
- [x] El top 10 del detalle y del Salón muestra una sola fila por jugador (su mejor marca), ordenado por puntuación descendente y, en empate, por fecha más antigua primero.
- [x] Un usuario con sesión puede guardar su puntuación de ROCAS desde el modal y aparece en `/salon?juego=rocas` y `/juegos/rocas` al navegar a ellas.
- [x] Sin sesión, el modal de ROCAS muestra "INICIA SESIÓN PARA GUARDAR TU MARCA" con enlace a `/auth` y no guarda nada.
- [x] En juegos simulados el modal muestra "PUNTUACIÓN NO CLASIFICABLE (DEMO)" y no ofrece guardar.
- [x] El botón de guardar se deshabilita mientras guarda; un error muestra el mensaje en español y permite reintentar.
- [x] RLS rechaza inserts sin sesión, con `user_id` ajeno o en juegos con `playable = false`; ningún cliente puede actualizar ni borrar puntuaciones.
- [x] `/salon` sin `?juego` o con un `id` inválido muestra el primer juego por `sort_order`; las pestañas cambian la URL a `/salon?juego=<id>`.
- [x] Con sesión, el Salón muestra "TU MEJOR MARCA" con rango y puntuación reales aunque esté fuera del top 10, o "AÚN NO TIENES MARCA EN <TÍTULO>" si no tiene; sin sesión no aparece.
- [x] Un juego sin marcas muestra el estado vacío en el detalle y en el Salón, sin podio ni filas inventadas.
- [x] El comportamiento de juego de ROCAS (SPEC 05) y de la simulación del resto no cambia.
- [x] `npm run build` y `npm run lint` completan sin errores y la consola del navegador no muestra errores en `/biblioteca`, `/juegos/rocas`, `/juegos/rocas/jugar` y `/salon`.

## Decisiones tomadas y descartadas

- **Un solo spec para `games` + `scores`.** `scores` necesita la FK a `games`, y ambos cambian los mismos consumidores. _Descartado:_ dos specs separados (más ciclos para un cambio acoplado) y mantener el catálogo solo en código con `game_id` de texto libre.
- **`public.games` como fuente única del catálogo.** Evita que la BD y `lib/data.ts` se desincronicen. _Descartado:_ tabla solo para la FK mientras la UI sigue leyendo `lib/data.ts`.
- **El catálogo solo cambia por migración.** Sin políticas de escritura en `games`. _Descartado:_ panel de administración (spec propio si llega).
- **`best` y `plays` calculados desde `scores` (vista `game_stats`).** Datos reales y coherentes con el leaderboard. _Descartado:_ columnas fijas con los valores ficticios actuales y quitarlos de la UI.
- **Historial completo en `scores` y ranking por mejor marca por jugador (vista `leaderboard`).** Conserva todas las partidas (`plays`) sin que un jugador ocupe varias posiciones. _Descartado:_ ranking con todas las partidas y tabla `best_scores` con upsert (pierde el historial).
- **Vistas con `security_invoker = true`.** Respetan el RLS de las tablas y evitan el lint `security_definer_view`. _Descartado:_ funciones RPC `security definer`.
- **Empate: gana la marca más antigua** (`row_number` ordenando por `achieved_at`). Rangos únicos y estables. _Descartado:_ `rank()` con posiciones compartidas.
- **Solo usuarios con sesión guardan.** RLS con `user_id = auth.uid()` evita suplantar nombres. _Descartado:_ guardado de invitados con nombre libre y "puntuación pendiente" tras login.
- **El nombre del ranking es el `username` de `profiles`.** Desaparece el input de iniciales del modal. _Descartado:_ nombre libre por partida.
- **Solo juegos `playable` guardan (hoy solo ROCAS).** El leaderboard contiene únicamente partidas reales; cada spec de juego real activará su `playable`. _Descartado:_ guardar puntuaciones simuladas.
- **Server Action `saveScore` con validación + RLS como garantía final.** Mismo patrón que `app/auth/actions.ts`. _Descartado:_ insert directo desde el navegador.
- **Rango de `score` 0–99.999.999 sin más anti-trampas.** Suficiente para esta fase. _Descartado:_ validación de la partida en servidor (spec futuro).
- **Salón como Server Component con `?juego=<id>`.** URL compartible y sin fetch desde el cliente. _Descartado:_ `HallOfFame` cliente consultando Supabase al cambiar de pestaña.
- **Top 10 en Salón y detalle.** Mismo límite en ambos; el podio usa los 3 primeros. _Descartado:_ top 12 actual y top 50.
- **"TU MEJOR MARCA" con rango real aunque esté fuera del top.** _Descartado:_ mostrarla solo si está fuera del top.
- **`/jugar` como Server Component + `GamePlayer` cliente.** Permite leer el juego de Supabase en servidor y mantener toda la interacción en cliente. _Descartado:_ que la página cliente consulte el catálogo desde el navegador.
- **Eliminar `lib/session.ts` y `av_scores`.** Una sola fuente de puntuaciones. _Descartado:_ mantener `localStorage` como respaldo y migrar las puntuaciones locales.
- **Home fuera de alcance.** Sigue con `lib/mock-data.ts` hasta su propio spec.

## Riesgos identificados

- **Caché de Next.js 16.** Si las páginas se cachean, una marca recién guardada no aparece; `revalidatePath` tras el insert y el uso de cookies (cliente server de Supabase) deben forzar datos frescos. Verificar en la documentación del paso 1.
- **Supabase no disponible o variables ausentes.** Las consultas devuelven listas vacías o `null`; la Biblioteca mostraría "NO HAY RESULTADOS" y el detalle 404. Es aceptable mientras no rompa el render ni deje errores sin capturar.
- **Rendimiento de las vistas.** `leaderboard` recorre todas las partidas del juego en cada consulta; con el volumen actual es despreciable y el índice `(game_id, score desc, created_at)` ayuda. Si crece, se pasaría a una vista materializada en otro spec.
- **Puntuaciones falsas.** Cualquier usuario autenticado puede llamar a la Server Action (o a la REST API) con un `score` inventado dentro del rango. Riesgo aceptado hasta el spec de anti-trampas.
- **Semilla desincronizada.** Los textos de la semilla deben copiarse exactamente de `lib/data.ts` antes de eliminarlo; la verificación compara la Biblioteca antes y después.
- **Tipos de las vistas.** `generate_typescript_types` marca las columnas de vistas como `nullable`; `queries.ts` debe normalizarlas (p. ej. `?? 0`) sin usar `any`.
- **`HallOfFame` sin `"use client"`.** Hoy depende de `useState`/`useEffect`; al pasar a Server Component hay que quitar todos los hooks o el build fallará.

## Lo que **no** entra en este spec

- Home con datos reales (actividad y top jugadores).
- Puntuaciones de invitados o guardado pendiente tras login.
- Puntuaciones de los juegos simulados.
- Anti-trampas, edición o borrado de puntuaciones.
- Administración del catálogo, paginación, rankings por periodo o global, perfil e historial del jugador, Realtime.
- Migración de `av_scores` de `localStorage`.

Cada uno, si llega, va en su propio spec.
