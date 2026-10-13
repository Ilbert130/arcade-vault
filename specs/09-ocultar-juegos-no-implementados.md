# 09 — Ocultar los juegos no implementados

**Estado:** Implementado
**Depende de:** SPEC 03-biblioteca-salon-auth, SPEC 06-leaderboard-tabla-juegos, SPEC 08-arkanoid-bloque-buster
**Fecha:** 2026-10-13

**Objetivo:** Que en toda la plataforma (Home, Biblioteca, Salón de la Fama, detalle y player) solo aparezcan los juegos con `games.playable = true`, y que los demás no se vean ni sean accesibles por URL.

## Alcance

**Incluye:**

- Criterio único de "implementado": `games.playable = true` (hoy `rocas`, `caida`, `bloque-buster`). Un juego nuevo aparece solo al activar su flag con la migración de `/add-game`.
- Filtro en `lib/games/queries.ts`: `getGames`, `getGamesWithStats` y `getGame` añaden `.eq("playable", true)`.
  - Biblioteca (`/biblioteca`) y selector del Salón (`/salon`) quedan arreglados sin tocar las páginas.
  - `/juegos/[id]` y `/juegos/[id]/jugar` devuelven `notFound()` para ids no jugables (ya lo hacen cuando `getGame` devuelve `null`).
- Home (`/`): `app/page.tsx` pasa a Server Component async que lee `getGames()` y se lo pasa como prop a `components/Home.tsx`.
  - El mini-rail "JUEGOS DISPONIBLES AHORA" se alimenta de la BD (en lugar de `GAMES` de `lib/mock-data.ts`), con `cover` del registro de BD.
  - "ÚLTIMAS PUNTUACIONES" (`ACTIVITY`) se filtra en runtime a entradas cuyo `game` coincide (sin distinguir mayúsculas) con el título de un juego implementado.
  - Textos: el stat `12+ JUEGOS` pasa a mostrar el número real de juegos implementados; la feature "JUEGOS CLÁSICOS" deja de nombrar Snake y se reescribe con juegos reales (Asteroids, Tetris, Arkanoid).
- Biblioteca: los chips de categoría (`CATS`) muestran solo `TODOS` y las categorías que tengan al menos un juego implementado.
- Eliminar `GAMES` y el tipo `Game` de `lib/mock-data.ts` (quedan sin uso).
- Actualizar `CLAUDE.md` (lista de specs implementados y nota sobre el filtro `playable`).

**No incluye:**

- Cambios de esquema, migraciones o regenerar tipos: no se toca la BD ni el flag `playable`.
- Borrar filas de `games` ni los covers CSS (`.cover-*`) de juegos aún no implementados: se necesitarán cuando se porten.
- Reemplazar el mock de actividad y `TOP_PLAYERS` por datos reales en Home (spec futuro). `TOP_PLAYERS` no está ligado a un juego, así que no se filtra.
- Quitar del código la simulación de `GamePlayer.tsx` y la nota "NO CLASIFICABLE (DEMO)": queda sin alcanzar vía UI/URL pero su limpieza va en otro spec.
- Modo admin / vista previa de juegos no publicados.
- Cambios en `saveScore` (ya rechaza juegos no `playable`).

## Modelo de datos

No introduce estructuras nuevas. Reutiliza `public.games` (columna `playable`) y el tipo `Game` de `lib/games/types.ts`.

- `Home` recibe `games: Game[]` (solo implementados).
- Regla de filtrado de actividad: `ACTIVITY.filter((a) => games.some((g) => g.title.toLowerCase() === a.game.toLowerCase()))`.
- Categorías visibles en Biblioteca: `CATS.filter((c) => c === "TODOS" || games.some((g) => g.cat === c))`.

## Archivos

```
lib/games/queries.ts           filtro playable en getGames/getGamesWithStats/getGame
app/page.tsx                   Server Component async, pasa games a Home
components/Home.tsx            prop games, rail/actividad/stat/feature desde datos reales
components/Library.tsx         chips solo de categorías con juegos
lib/mock-data.ts               se elimina GAMES y tipo Game
CLAUDE.md                      nota sobre el filtro y spec 09
specs/09-ocultar-juegos-no-implementados.md   este spec
```

## Plan de implementación

1. Leer docs de Next 16.3.3 relevantes (Server Components que pasan props a Client Components) en `node_modules/next/dist/docs/`.
2. `lib/games/queries.ts`: añadir `.eq("playable", true)` a las tres consultas. Prueba: `/biblioteca` muestra solo 3 juegos; `/juegos/serpentina` da 404.
3. `components/Library.tsx`: filtrar `CATS` a las categorías con juegos. Prueba: no hay chips vacíos.
4. `app/page.tsx` + `components/Home.tsx`: recibir `games`, pintar el mini-rail desde BD, filtrar `ACTIVITY`, ajustar stat `JUEGOS` y texto de la feature. Prueba: Home muestra 3 tarjetas, actividad solo de Caída/Rocas/Bloque Buster.
5. Quitar `GAMES` y `Game` de `lib/mock-data.ts`; `npm run lint` limpia imports.
6. Actualizar `CLAUDE.md`. Verificación manual y `npm run build`.

## Criterios de aceptación

- [x] `/biblioteca` muestra exactamente los juegos con `playable = true` y ninguno más.
- [x] El selector de `/salon` lista solo juegos implementados; `/salon?juego=serpentina` cae al primer juego implementado.
- [x] `/juegos/serpentina` y `/juegos/serpentina/jugar` devuelven la página 404; `/juegos/rocas`, `/juegos/caida` y `/juegos/bloque-buster` siguen funcionando.
- [x] El mini-rail de Home muestra solo juegos implementados y sus tarjetas llevan a `/biblioteca`.
- [x] "ÚLTIMAS PUNTUACIONES" no muestra Glotón, Invasores, Serpentina ni Ranaria.
- [x] El stat de Home muestra el número de juegos implementados (3 hoy), no `12+`.
- [x] Ningún texto de Home nombra Snake ni otro juego no implementado.
- [x] Biblioteca no muestra chips de categoría sin juegos (hoy desaparece `VERSUS`).
- [x] Al poner `playable = true` en una fila de `games`, el juego aparece en Biblioteca, Home y Salón sin cambiar código.
- [x] Jugar y guardar puntuación en ROCAS, CAÍDA y BLOQUE BUSTER sigue igual.
- [x] `lib/mock-data.ts` ya no exporta `GAMES`; `npm run build` y `npm run lint` sin errores.

## Decisiones tomadas y descartadas

- **Sí:** `games.playable` como única fuente de verdad. Ya existe en BD y se activa con cada migración de juego. _Descartado:_ usar `GAME_REGISTRY` (duplicaría la fuente y desincronizaría con la BD).
- **Sí:** filtrar en `queries.ts`. Un solo punto cubre Biblioteca, Salón y detalle/player. _Descartado:_ filtrar en cada página (riesgo de olvidar alguna).
- **Sí:** 404 por URL directa. Coherente con "no deben aparecer". _Descartado:_ dejarlos accesibles por URL con la demo simulada.
- **Sí:** Home lee de la BD (mini-rail) y filtra la actividad mock por título. Cuando se porte un juego nuevo aparece solo. _Descartado:_ editar a mano `mock-data.ts` en cada juego.
- **Sí:** ocultar chips de categorías vacías. Decisión menor tomada sin preguntar, para no mostrar filtros que siempre devuelven "NO HAY RESULTADOS".
- **No:** limpiar la simulación de `GamePlayer`. Queda como código inalcanzable; se retira en otro spec para mantener este diff pequeño.
- **No:** filtrar `TOP_PLAYERS`. No pertenece a un juego concreto; sigue siendo mock hasta que Home use datos reales.

## Riesgos identificados

| Riesgo                                                                          | Mitigación                                                                                 |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Si la BD falla, `getGames()` devuelve `[]` y Home/Biblioteca quedan vacíos      | Ya es el comportamiento actual (errores tragados); Home debe renderizar con rail vacío.    |
| El título de BD no coincide con el texto de `ACTIVITY.game` (acentos, espacios) | Comparación sin mayúsculas; verificar los 3 casos (Caída, Rocas, Bloque Buster).           |
| Los 404 por URL rompen enlaces antiguos a juegos no implementados               | Aceptado: eran demos no clasificables.                                                     |
| Home deja de ser puramente cliente                                              | `page.tsx` es Server Component y pasa props serializables; `Home` conserva `"use client"`. |

## Qué **no** está en este spec

- Cambios de BD, migraciones o del flag `playable`.
- Datos reales de actividad / top jugadores en Home.
- Limpieza de la simulación de `GamePlayer` y de los covers CSS de juegos no portados.
- Vista de administración para previsualizar juegos no publicados.
- Portar nuevos juegos.
