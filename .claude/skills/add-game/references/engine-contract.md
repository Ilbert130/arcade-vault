# Contrato del motor y del componente canvas

Fuente: spec 05 y `lib/games/rocas/`, `components/games/RocasCanvas.tsx` + `components/games/useGameCanvas.ts`. Léelos como ejemplo funcional. Los tipos compartidos (`GameStatus`, `GenericHud`, `GameRenderProps`, `GameEngine`, `CreateGame`) están en `lib/games/platform/contract.ts`.

## Archivos
```
lib/games/<slug>/types.ts       Hud, Callbacks, Game, XAction (unión de acciones de entrada)
lib/games/<slug>/constants.ts   W/H lógicos, PALETTE (hex copiados de los tokens de app/styles/base.css), tuning
lib/games/<slug>/entities.ts    clases/helpers con draw(ctx) por parámetro (sin globals)
lib/games/<slug>/engine.ts      createXGame(canvas, callbacks, skin): Game
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
  press: (action: string) => void;   // = keydown de la acción; desconocidas se ignoran
  release: (action: string) => void; // = keyup de la acción
  releaseAll: () => void;            // suelta todas las acciones mantenidas
};
/** Acciones de entrada del motor (teclado y mando táctil), p. ej. ROCAS: */
export type XAction = "rotateLeft" | "rotateRight" | "thrust" | "fire";
```
`score` siempre es obligatorio (es lo que se guarda). Los demás campos del HUD dependen del juego (Tetris: `lines`, `level`; Arkanoid: `lives`, `level`).

## Reglas del motor
- Todo el estado vive en el closure de `createXGame`; `phase` tipo `idle | playing | dead | paused | gameover`.
- Mundo lógico fijo (800×600, 4:3) escalado por CSS; si el juego es vertical (Tetris 300×600), centra el tablero en el mundo 800×600 y dibuja panel lateral (siguiente pieza) en el mismo canvas.
- HiDPI: `canvas.width = W*dpr`, `ctx.setTransform(dpr,0,0,dpr,0,0)` al dibujar.
- Bucle rAF con `dt` en segundos limitado a `MAX_DT` (0.05).
- El constructor inicializa estado y dibuja un primer frame (visible con status `ready`).
- Teclas en `window`, añadidas en `start()` y quitadas en `destroy()`; `code` de `KeyboardEvent`.
- **API de entrada (spec 12)**: el motor expone `press/release/releaseAll` (cumple `GameInput` de `lib/games/platform/touch.ts`). El teclado no toca el estado directamente: un mapa `KEY_ACTIONS` traduce `e.code` → acción y llama a `press`/`release`, conservando `preventDefault` y el filtro de `e.repeat` donde aplique. El mando táctil llama a las mismas funciones, así que ambos se comportan igual.
  - Las acciones solo tienen efecto con `phase === "playing"` (igual que el teclado); las desconocidas se ignoran.
  - Acciones mantenidas (girar, mover la pala…) en un mapa por acción (`keys[action]`); `releaseAll` lo vacía y se reutiliza en `pause()`/`reset()`.
  - Acciones de una pulsación (rotar, caída dura, girar la serpiente) se ejecutan en `press`; si el juego no tiene estado mantenido, `release`/`releaseAll` son no-ops pero existen.
  - La repetición al mantener la hace el mando (`repeat: true` en su `touch`), no el motor. Ejemplos: `lib/games/caida/engine.ts` (pulsación + `ONCE_ACTIONS`), `lib/games/bloque-buster/engine.ts` (mantenidas), `lib/games/serpentina/engine.ts` (`press(dir)` → `queueTurn`).
- La fuente se lee con `getComputedStyle(canvas).getPropertyValue("--mono")`.
- El motor no dibuja menús, pausa ni "game over": eso lo pinta React (overlays de `GamePlayer`). Puede dibujar el HUD in-game mínimo si el juego lo necesita, pero score/vidas/nivel salen por `onHud`.

## Componente canvas
El ciclo de vida es común y vive en `components/games/useGameCanvas.ts`; el Canvas de un juego nuevo es solo esto:

```tsx
"use client";
import { createXGame } from "@/lib/games/<slug>/engine";
import type { GameRenderProps } from "@/lib/games/platform/contract";
import { useGameCanvas } from "@/components/games/useGameCanvas";
export default function XCanvas(props: GameRenderProps) {
  const canvasRef = useGameCanvas(createXGame, props);
  return <canvas ref={canvasRef} className="<slug>-canvas" aria-label="…" />;
}
```

Lo que hace el hook (no lo copies en el Canvas):
Props `{ status, skin, onHud, onGameOver, inputRef }` con `status: "ready" | "playing" | "paused" | "over"` e `inputRef: RefObject<GameInput | null>`.
- `useEffect([inputRef])` crea el motor, asigna `inputRef.current = game` y en la limpieza pone `inputRef.current = null` **antes** de `destroy()` (con StrictMode el ref nunca apunta a un motor destruido); callbacks por refs (evita callbacks viejos y doble montaje de StrictMode).
- `useEffect([status])` con `prevStatusRef` mapea transiciones:

| Transición | Llamada |
|---|---|
| ready→playing | `start()` |
| playing→paused | `pause()` |
| paused→playing | `resume()` |
| →over | `pause()` |
| over→ready | `reset()` |

- Render: `<canvas className="<slug>-canvas" aria-label="…" />`.
