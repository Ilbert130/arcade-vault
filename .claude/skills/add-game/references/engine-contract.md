# Contrato del motor y del componente canvas

Fuente: spec 05 y `lib/games/asteroids/`, `components/games/AsteroidsCanvas.tsx`. Léelos como ejemplo funcional.

## Archivos
```
lib/games/<slug>/types.ts       Hud, Callbacks, Game, KeyMap
lib/games/<slug>/constants.ts   W/H lógicos, PALETTE (hex copiados de los tokens de globals.css), tuning
lib/games/<slug>/entities.ts    clases/helpers con draw(ctx) por parámetro (sin globals)
lib/games/<slug>/engine.ts      createXGame(canvas, callbacks): Game
components/games/<Name>Canvas.tsx
```

## Tipos (patrón)
```ts
export type XHud = { score: number; lives?: number; level?: number; lines?: number };
export type XCallbacks = {
  onHud: (hud: XHud) => void;          // solo cuando cambia algún valor
  onGameOver: (finalScore: number) => void; // una vez; también para victoria
};
export type XGame = {
  start: () => void;   // partida desde cero + arranca rAF
  pause: () => void;   // congela update, sigue dibujando el último frame
  resume: () => void;  // continúa; reinicia lastTime para no saltar dt
  reset: () => void;   // estado inicial sin arrancar
  destroy: () => void; // cancela rAF y quita listeners
};
```
`score` siempre es obligatorio (es lo que se guarda). Los demás campos del HUD dependen del juego (Tetris: `lines`, `level`; Arkanoid: `lives`, `level`).

## Reglas del motor
- Todo el estado vive en el closure de `createXGame`; `phase` tipo `idle | playing | dead | paused | gameover`.
- Mundo lógico fijo (800×600, 4:3) escalado por CSS; si el juego es vertical (Tetris 300×600), centra el tablero en el mundo 800×600 y dibuja panel lateral (siguiente pieza) en el mismo canvas.
- HiDPI: `canvas.width = W*dpr`, `ctx.setTransform(dpr,0,0,dpr,0,0)` al dibujar.
- Bucle rAF con `dt` en segundos limitado a `MAX_DT` (0.05).
- El constructor inicializa estado y dibuja un primer frame (visible con status `ready`).
- Teclas en `window`, añadidas en `start()` y quitadas en `destroy()`; `code` de `KeyboardEvent`.
- La fuente se lee con `getComputedStyle(canvas).getPropertyValue("--mono")`.
- El motor no dibuja menús, pausa ni "game over": eso lo pinta React (overlays de `GamePlayer`). Puede dibujar el HUD in-game mínimo si el juego lo necesita, pero score/vidas/nivel salen por `onHud`.

## Componente canvas
Props `{ status, onHud, onGameOver }` con `status: "ready" | "playing" | "paused" | "over"`.
- `useEffect([])` crea el motor y devuelve `destroy()`; callbacks por refs (evita callbacks viejos y doble montaje de StrictMode).
- `useEffect([status])` con `prevStatusRef` mapea transiciones:

| Transición | Llamada |
|---|---|
| ready→playing | `start()` |
| playing→paused | `pause()` |
| paused→playing | `resume()` |
| →over | `pause()` |
| over→ready | `reset()` |

- Render: `<canvas className="<slug>-canvas" aria-label="…" />`.
