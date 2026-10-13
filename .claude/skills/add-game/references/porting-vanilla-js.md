# Portar un juego vanilla JS (references/started-games) a TS

Los juegos de referencia son scripts con globals, DOM y overlays propios. Receta general:

1. **Globals → closure.** Mete `score`, `lives`, entidades, `keys`, etc. dentro de `createXGame`. Las clases pasan a `entities.ts` con `draw(ctx)` recibiendo el contexto.
2. **DOM → callbacks.** `getElementById('score')` / `updateHUD()` → `onHud({...})` solo si cambia. `endGame()`/overlay → `onGameOver(score)`. Elimina botones de reinicio y toggles de tema (`localStorage`): la plataforma ya tiene su UI.
3. **Overlays del canvas → React.** Quita pausa/game over/menús dibujados en el canvas; `GamePlayer` ya los provee.
4. **Input.** `document`/`window` keydown → listeners añadidos en `start()`, quitados en `destroy()`. Ratón/click: coordenadas relativas al canvas y escaladas (`rect` y `canvas.width / rect.width`), porque CSS escala el canvas.
5. **Assets.** Mueve imágenes/sonidos a `public/games/<slug>/` (`<slug>` = `id` del juego, p. ej. `bloque-buster`) y refiérelos con URL absoluta (`/games/<slug>/...`). Carga asíncrona dentro del motor (no en el cuerpo del módulo). `new Audio` solo dentro de funciones. Sonido es opcional: si es mucho, déjalo fuera del alcance en el spec.
6. **Datos.** `<script>` múltiples (p. ej. `levels.js`) → módulo tipado (`levels.ts`).
7. **SSR.** Cero acceso a `window`/`document` al importar el módulo.
8. **Bucle.** Conserva la lógica original (acumulador, `dropInterval`, etc.), pero con `phase`, `MAX_DT` y pausa/resume correctos.
9. **Fidelidad.** Mantén reglas, puntuación y sensación del original; documenta en el spec cualquier cambio. Luego aplica la paleta neón del proyecto.

## Notas por juego de referencia
- **03-tetris** (`caida`, `cover-tetro`): canvas 300×600 (10×20, bloque 30) + segundo canvas para la siguiente pieza; HUD en DOM (score, lines, level); bucle con acumulador. Plan: un solo canvas 800×600 con tablero centrado y panel "SIGUIENTE" al lado; `onHud({score, lines, level})`; quitar tema claro/oscuro y `restart-btn`.
- **04-arkanoid** (`bloque-buster`, `cover-bricks`): 800×600, varios `<script>` (spritesheet, levels, game), PNG + mp3, ratón (`mousemove`/`click`) y teclado, estados `playing|paused|gameover|win`. Plan: assets a `public/games/bloque-buster/`, spritesheet cargado async, `levels.ts` tipado, ratón escalado, `win` → `onGameOver(score)`, pausa/overlays fuera del canvas.
- **02-asteroids** (`rocas`): ya portado (spec 05); úsalo de modelo.
- Juegos sin referencia (serpentina, gloton, invasores, ranaria, duelo-pixel): diseña desde cero con `engine-contract.md`; describe controles, reglas y puntuación en el spec.
