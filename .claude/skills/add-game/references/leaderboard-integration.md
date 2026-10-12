# Leaderboard: qué ya existe y qué hace falta por juego

Fuente: spec 06. Casi todo es genérico.

## Ya genérico (no tocar salvo necesidad)
- `public.games` (catálogo, `playable`), `public.scores` (RLS: insert solo autenticado, `user_id = auth.uid()`, juego `playable`), vistas `leaderboard` (mejor marca por jugador/juego, `rank`) y `game_stats` (`best`, `plays`), ambas `security_invoker`.
- `lib/games/queries.ts` (`getGame`, `getGamesWithStats`, `getLeaderboard`, `getPlayerBest`…).
- Server Action `app/juegos/[id]/jugar/actions.ts` → `saveScore({gameId, score})`: valida entero 0–99.999.999, usuario, juego `playable`; inserta; `revalidatePath` de `/salon`, `/biblioteca`, `/juegos/<id>`.
- Modal "FIN DEL JUEGO" en `GamePlayer`: demo (`!playable`), invitado (→ `/auth`), con sesión (GUARDAR; estados idle/saving/saved/error).
- `/juegos/[id]`, `/salon?juego=<id>`, `/biblioteca` leen de la BD.

## Por juego (lo que sí hay que hacer)
1. **Migración** `supabase/migrations/<yyyymmddhhmmss>_<slug>_playable.sql` (plantilla en `assets/migration-template.sql`):
   - Juego sembrado: `update public.games set playable = true where id = '<id>';`
   - Juego nuevo: `insert into public.games (...)` con `sort_order` libre (único), y `playable = true`.
2. Aplicar con MCP Supabase `apply_migration` (mismo SQL que el archivo), después `get_advisors` (security): sin avisos nuevos.
3. Regenerar `lib/supabase/database.types.ts` (`generate_typescript_types`) solo si cambió el esquema, no si solo son datos.
4. El motor debe llamar `onGameOver(finalScore)` con un entero válido: eso es lo que guarda el modal.
5. Verificar extremo a extremo (ver SKILL.md paso 8). Para comprobar la fila: MCP `execute_sql` → `select * from scores where game_id = '<id>' order by created_at desc limit 5;`. Para limpiar datos de prueba, pide permiso al usuario antes de borrar nada en la BD remota.
6. RLS: probar que un insert sin sesión o en un juego `playable=false` es rechazado (spec 06).

## Mensajes de error de `saveScore` (no cambiar)
"Inicia sesión para guardar tu marca.", "Este juego aún no guarda puntuaciones.", "Puntuación inválida.", "No se pudo guardar. Inténtalo de nuevo."
