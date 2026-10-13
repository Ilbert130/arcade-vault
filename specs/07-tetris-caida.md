# 07 — CAÍDA: Tetris real en la plataforma

**Estado:** Implementado
**Depende de:** SPEC 05-asteroides-rocas, SPEC 06-leaderboard-tabla-juegos
**Fecha:** 2026-10-12

**Objetivo:** Portar a TypeScript el Tetris de `references/started-games/03-tetris/` como motor jugable en el CRT de `/juegos/caida/jugar` y activar su leaderboard (`playable = true`).

## Alcance

**Incluye:**

- Motor `lib/games/tetris/` (types, constants, entities, engine) con contrato `{ start, pause, resume, reset, destroy }` y callbacks `onHud`/`onGameOver`.
- Componente `components/games/TetrisCanvas.tsx` (patrón de `AsteroidsCanvas`).
- **Refactor previo e independiente** de `GamePlayer` a registry (`components/games/registry.tsx`): ROCAS pasa a ser una entrada sin cambio de comportamiento; después se añade la entrada `caida`. HUD configurable por juego (`score`, `lives`, `level`, `lines`): CAÍDA muestra Puntuación, Líneas y Nivel (sin Vidas).
- Entrada `caida` en el registry (controles, HUD, overlay de inicio `CAÍDA`).
- Migración `supabase/migrations/<timestamp>_caida_playable.sql` (`update ... set playable = true where id = 'caida'`), aplicada con el MCP de Supabase + `get_advisors`.
- Estilos en `app/globals.css` (diseñados con `/frontend-design`, tokens CRT existentes).
- Reglas fieles al original:
  - Tablero 10×20, 8 piezas: I, O, T, S, Z, J, L y la pieza propia **N («tuerca»)** 3×3 con hueco central; aleatorias uniformes (sin bolsa de 7).
  - Rotación horaria con wall kicks `[0, -1, 1, -2, 2]`; pieza fantasma (alpha 0.2); vista de la siguiente pieza.
  - Puntuación: líneas `[0,100,300,500,800] × nivel`; caída suave `+1` por fila; caída dura `+2` por celda.
  - Nivel = `floor(líneas/10)+1`; intervalo de caída `max(100, 1000 − (nivel−1)·90)` ms.
  - Fin de partida cuando la pieza nueva colisiona al aparecer → `onGameOver(score)` una vez.
- Controles: `← →` mover, `↑`/`X` rotar, `↓` caída suave, `Espacio` caída dura, `P`/`Esc` pausa (gestionado por `GamePlayer`).

**No incluye:**

- Sonido, hold, bolsa 7-bag, SRS completo, T-spins, guardado de partida.
- Tema claro/oscuro y botón de reinicio del original (la plataforma ya tiene su UI).
- Anti-trampas ni cambios en `saveScore`, vistas o modal.
- Portar otros juegos.

## Modelo de datos

- Fila en `public.games`: `id = 'caida'` ya sembrada (`cover-tetro`, `playable = false`); solo se actualiza el flag.
- HUD: `{ score, lines, level }`. Puntuación enviada: entero 0–99.999.999 (la máxima realista queda muy por debajo).
- Sin cambios de esquema → no se regeneran tipos.

## Archivos

```
lib/games/tetris/{types,constants,entities,engine}.ts   nuevo
components/games/TetrisCanvas.tsx                       nuevo
components/games/registry.tsx                           nuevo (rocas + caida)
components/GamePlayer.tsx                               refactor a registry
app/globals.css                                         estilos CAÍDA; .rocas-start* → .game-start*
supabase/migrations/<timestamp>_caida_playable.sql      nuevo
specs/07-tetris-caida.md                                este spec
CLAUDE.md                                               juegos jugables / specs implementados
```

## Plan de implementación

1. Leer docs de Next 16.3.3 (Client Components, public assets) y la referencia (hecho: `game.js`, `index.html`).
2. Refactor de `GamePlayer` a registry (ROCAS idéntico; verificar `/juegos/rocas/jugar` y un simulado como `/juegos/serpentina/jugar`).
3. `types.ts` y `constants.ts` (mundo lógico 800×600; tablero 300×600 centrado con panel «SIGUIENTE» y mini-HUD en el mismo canvas; paleta neón desde tokens).
4. `entities.ts`: piezas, rotación, colisión, dibujo de bloques.
5. `engine.ts`: bucle con acumulador, `phase`, `MAX_DT = 0.05`, teclas en `start()`/`destroy()`, `onHud` solo al cambiar.
6. `TetrisCanvas.tsx`.
7. Entrada en registry + CSS con `/frontend-design`.
8. Migración `playable` + `get_advisors`.
9. Verificación (invitado, con sesión, detalle, Salón, simulados y ROCAS intactos), `npm run build`, `npm run lint`.

## Criterios de aceptación

- [x] El juego no arranca hasta pulsar EMPEZAR/Espacio; pausa (P/Esc/botón y automática) y FIN funcionan.
- [x] Las 8 piezas (incl. N), rotación con kicks, fantasma, siguiente pieza, líneas, puntuación, nivel y velocidad coinciden con el original.
- [x] `onHud` solo al cambiar valores; `onGameOver` exactamente una vez.
- [x] Sin `any`/`@ts-ignore`, sin globals mutables, sin acceso a DOM/`window` en el cuerpo del módulo.
- [x] Sin rAF ni listeners residuales al salir de la página; canvas 4:3 nítido en HiDPI.
- [x] Flechas y Espacio no hacen scroll ni activan botones durante la partida; teclas no quedan pegadas tras pausar.
- [x] `games.playable = true` para `caida` en el proyecto remoto; `get_advisors` sin avisos nuevos.
- [x] Invitado: "INICIA SESIÓN PARA GUARDAR TU MARCA" → `/auth`. Con sesión: "PUNTUACIÓN GUARDADA" y aparece en `/juegos/caida` y `/salon?juego=caida`.
- [x] ROCAS y los demás juegos simulados no cambian (los simulados siguen con "NO CLASIFICABLE (DEMO)").
- [x] `npm run build` y `npm run lint` sin errores; consola sin errores.

## Decisiones tomadas y descartadas

- **Un solo canvas 800×600 con tablero centrado y panel lateral.** Mantiene el contrato 4:3 del CRT y un único componente. _Descartado:_ dos canvas como el original.
- **Mantener piezas aleatorias uniformes y la pieza N.** Fidelidad al original. _Descartado:_ 7-bag.
- **HUD de página sin vidas para CAÍDA** (campo `lines` en su lugar). _Descartado:_ mostrar «Vidas» vacías.
- **Registry como paso previo y separado.** Evita mezclar refactor y juego nuevo.

## Riesgos identificados

- StrictMode (doble montaje), Espacio compartido con la página, foco en botones, callbacks obsoletos, teclas pegadas al pausar.
- Refactor del registry podría alterar ROCAS: verificar antes de añadir CAÍDA.
- Repetición de teclas (`e.repeat`) en `←/→/↓`: se acepta el auto-repeat del navegador como en el original; la rotación y la caída dura ignoran `repeat` para no encadenar acciones.
- Rama: hay cambios sin confirmar del spec 06 en `spec-06-leaderboard-tabla-juegos`; `spec-07-tetris-caida` se crearía arrastrándolos.
