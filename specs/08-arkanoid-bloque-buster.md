# 08 — BLOQUE BUSTER: Arkanoid real en la plataforma

**Estado:** Implementado
**Depende de:** SPEC 05-asteroides-rocas, SPEC 06-leaderboard-tabla-juegos, SPEC 07-tetris-caida
**Fecha:** 2026-10-12

**Objetivo:** Portar a TypeScript el Arkanoid de `references/started-games/04-arkanoid/` como motor jugable en el CRT de `/juegos/bloque-buster/jugar` y activar su leaderboard (`playable = true`).

## Alcance

**Incluye:**

- Motor `lib/games/bloque-buster/` (types, constants, entities, engine) con contrato `{ start, pause, resume, reset, destroy }` y callbacks `onHud`/`onGameOver`.
- Componente `components/games/BloqueBusterCanvas.tsx` (patrón de `TetrisCanvas`).
- Entrada `bloque-buster` en `components/games/registry.tsx` (HUD: Puntuación, Vidas, Nivel; controles; overlay de inicio `BLOQUE BUSTER`).
- Assets en `public/games/bloque-buster/`: `spritesheet-breakout.png` (sprites de pala, bola, bloques y explosiones) y los sonidos `ball-bounce.mp3` / `break-sound.mp3`.
- Migración `supabase/migrations/<timestamp>_bloque_buster_playable.sql` (`update ... set playable = true where id = 'bloque-buster'`), aplicada con el MCP de Supabase + `get_advisors`.
- Estilos en `app/globals.css` (diseñados con `/frontend-design`, tokens CRT existentes).
- Reglas fieles al original:
  - Mundo lógico 800×600. Rejilla 10×6 de bloques 64×24 con origen (80, 80). Pala 81×14 en y=560; bola 16×16.
  - 5 niveles (piramide, ajedrez, huecos, marco+cruz…) con velocidad ×1.00/1.10/1.21/1.33/1.46 sobre vx=200, vy=-300.
  - 3 vidas; +10 puntos por bloque; un bloque por frame; la bola rebota invirtiendo `vy`.
  - Rebote en paredes/techo y en la pala (fuerza `vy` hacia arriba); animación de explosión de 4 frames (150 ms) por color.
  - Completar el nivel 5 = victoria → `onGameOver(score)`; perder la última vida = fin → `onGameOver(score)`, una sola vez.
  - La bola arranca pegada a la pala en cada vida/nivel (como el original, sale directamente al empezar).
- Controles: `← →` mover pala, ratón mueve la pala (mapeado a coordenadas lógicas), `P`/`Esc` pausa (gestionado por `GamePlayer`).
- Sonido de rebote y rotura (HTMLAudio creado dentro de funciones, nunca en el cuerpo del módulo).

**No incluye:**

- Salto de nivel desde la pausa (era un atajo de depuración del original; permitirlo rompería el ranking).
- Power-ups, ángulo de rebote según el punto de la pala, bloques de varios golpes, guardado de partida.
- Overlays de pausa/game over dibujados en canvas (los pinta `GamePlayer`).
- Anti-trampas ni cambios en `saveScore`, vistas o modal.
- Portar otros juegos.

## Modelo de datos

- Fila en `public.games`: `id = 'bloque-buster'` ya sembrada (`playable = false`); solo se actualiza el flag.
- HUD: `{ score, lives, level }`. Puntuación enviada: entero 0–99.999.999 (máx. real = 5 niveles × bloques × 10, muy por debajo).
- Sin cambios de esquema → no se regeneran tipos.

## Archivos

```
lib/games/bloque-buster/{types,constants,entities,engine}.ts   nuevo
components/games/BloqueBusterCanvas.tsx                        nuevo
components/games/registry.tsx                                  entrada nueva
app/globals.css                                                estilos BLOQUE BUSTER
public/games/bloque-buster/{spritesheet-breakout.png,sounds/*} assets
supabase/migrations/<timestamp>_bloque_buster_playable.sql     nuevo
specs/08-arkanoid-bloque-buster.md                             este spec
CLAUDE.md                                                      juegos jugables / specs implementados
```

## Plan de implementación

1. Leer docs de Next 16.3.3 (Client Components, public assets) y la referencia (hecho: `game.js`, `levels.js`, `spritesheet.js`).
2. Copiar assets a `public/games/bloque-buster/`.
3. `types.ts` y `constants.ts` (niveles, sprites, paleta).
4. `entities.ts`: carga del spritesheet (por instancia de motor), bloques, explosiones, dibujo.
5. `engine.ts`: bucle con `MAX_DT = 0.05`, `phase`, teclas/ratón en `start()`/`destroy()`, `onHud` solo al cambiar, pausa automática.
6. `BloqueBusterCanvas.tsx`.
7. Entrada en registry + CSS con `/frontend-design`.
8. Migración `playable` + `get_advisors`.
9. Verificación (invitado, con sesión, detalle, Salón, simulados/ROCAS/CAÍDA intactos), `npm run build`, `npm run lint`.

## Criterios de aceptación

- [x] El juego no arranca hasta pulsar EMPEZAR/Espacio; pausa (P/Esc/botón y automática) y fin funcionan.
- [x] Los 5 niveles, velocidades, vidas, puntuación (+10), rebotes y explosiones coinciden con el original; victoria y derrota llaman a `onGameOver` una vez.
- [x] La pala responde a flechas y ratón (escala correcta con el canvas escalado por CSS).
- [x] `onHud` solo al cambiar valores.
- [x] Sin `any`/`@ts-ignore`, sin globals mutables, sin acceso a DOM/`window`/`Audio` en el cuerpo del módulo.
- [x] Sin rAF ni listeners residuales al salir de la página; canvas 4:3 nítido en HiDPI.
- [x] Flechas y Espacio no hacen scroll ni activan botones durante la partida; teclas no quedan pegadas tras pausar.
- [x] `games.playable = true` para `bloque-buster` en el proyecto remoto; `get_advisors` sin avisos nuevos.
- [x] Invitado: "INICIA SESIÓN PARA GUARDAR TU MARCA" → `/auth`. Con sesión: "PUNTUACIÓN GUARDADA" y aparece en `/juegos/bloque-buster` y `/salon?juego=bloque-buster`.
- [x] ROCAS, CAÍDA y los demás juegos simulados no cambian (los simulados siguen con "NO CLASIFICABLE (DEMO)").
- [x] `npm run build` y `npm run lint` sin errores; consola sin errores.

## Decisiones tomadas y descartadas

- **Carpeta `lib/games/bloque-buster/`** (id del juego, no `arkanoid`). Coincide con assets, migración y URL. _Descartado:_ `arkanoid/`.
- **Quitar el selector de nivel de la pausa.** Era una herramienta de desarrollo y permitiría saltar a niveles para farmear/evitar puntuación. _Descartado:_ portarlo.
- **Un solo spritesheet cargado por instancia de motor** (sin caché a nivel de módulo, por StrictMode); el motor dibuja un fondo oscuro mientras carga y no inicia la física hasta que la imagen esté lista.
- **HUD de página** (Puntuación, Vidas, Nivel); el motor no dibuja texto in-game. _Descartado:_ duplicar HUD en canvas.
- **Colisión del original** (AABB + invertir `vy`, un bloque por frame) se mantiene por fidelidad, aunque un golpe lateral también invierte `vy`.

## Riesgos identificados

- StrictMode (doble montaje), Espacio compartido con la página, foco en botones, callbacks obsoletos, teclas pegadas al pausar.
- Carga asíncrona del spritesheet vs. `start()` y `destroy()` antes de que cargue.
- Audio: autoplay solo tras gesto del usuario (el inicio es por clic/Espacio, así que es válido); fallos de `play()` se ignoran.
- Escalado del ratón: usar `getBoundingClientRect` contra el mundo lógico 800×600.
- Bola atascada en bucle horizontal infinito (sin ángulo en pala): el original ya lo tiene; se acepta y se documenta.
