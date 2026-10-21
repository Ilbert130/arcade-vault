# Registry de juegos para GamePlayer

Problema: `components/GamePlayer.tsx` usa `isRocas = game.id === "rocas"` para elegir canvas, overlay de inicio, controles y desactivar la simulación. Eso no escala.

## Diseño
Archivo `components/games/registry.tsx` (cliente) con un mapa por `game.id`:

```ts
export type HudFields = Array<"score" | "lives" | "level" | "lines">;
export type GameRenderProps = {
  status: "ready" | "playing" | "paused" | "over";
  onHud: (hud: GenericHud) => void;   // GenericHud = { score: number; lives?: number; level?: number; lines?: number }
  onGameOver: (finalScore: number) => void;
  inputRef: RefObject<GameInput | null>; // el Canvas le asigna su motor (spec 12)
};
export type GameEntry = {
  Canvas: React.ComponentType<GameRenderProps>;
  hud: HudFields;            // qué muestra la barra superior
  controls: string;          // texto de .crt-controls (en español)
  startTitle: string;        // título del overlay de inicio
  startHint?: string;
  touch: TouchLayout;        // obligatorio: mando táctil del juego (spec 12)
};
export const GAME_REGISTRY: Record<string, GameEntry> = { rocas: {...} };
```
Cada `XCanvas` ya recibe `{status, onHud, onGameOver}`; si su `Hud` es más específico, adáptalo con un wrapper fino o tipa `onHud` con el `GenericHud` (campos opcionales).

## Refactor (una sola vez)
1. Crear el registry con la entrada `rocas` (canvas `AsteroidsCanvas`, `hud: ["score","lives","level"]`, textos actuales del overlay `.rocas-start` y de `.crt-controls`).
2. En `GamePlayer`: `const entry = GAME_REGISTRY[game.id]`; `const isReal = !!entry`. Sustituir cada `isRocas` por `isReal`, el título/hint del overlay por `entry.startTitle`, y el canvas por `<entry.Canvas …/>`. El estado inicial es `"ready"` si `isReal`, `"playing"` si es simulado; la simulación (`setInterval`) solo corre si `!isReal`. Renombrar clases `.rocas-start*` a genéricas (`.game-start*`) o mantenerlas solo si no estorba, ajustando `globals.css`.
3. HUD: renderizar solo los campos de `entry.hud`.
4. Verificar que ROCAS se comporta igual (spec 05) y que un juego simulado (p. ej. `/juegos/serpentina/jugar`) no cambió.

## Añadir un juego después
Una entrada nueva: `{ Canvas: TetrisCanvas, hud: ["score","lines","level"], controls: "← → MOVER · ↑ ROTAR · ↓ CAÍDA · ESPACIO CAÍDA RÁPIDA · P PAUSA", startTitle: "CAÍDA", touch: …, … }`.

## Mando táctil (`touch`, spec 12)
Todo juego del registry declara su `touch` (si falta, `npm run build` falla). Tipos en `lib/games/touch.ts`; el mando lo pinta `components/games/TouchPad.tsx` desde `GamePlayer`, solo visible con `@media (pointer: coarse)`.

```ts
touch: touchLayout<TetrisAction>([
  { slot: "left", action: "moveLeft", label: "MOVER", repeat: true },
  { slot: "right", action: "moveRight", label: "MOVER", repeat: true },
  { slot: "down", action: "softDrop", label: "BAJAR", repeat: true },
  { slot: "a", action: "rotate", label: "ROTAR" },
  { slot: "b", action: "hardDrop", label: "SOLTAR" },
]),
```
- `slot`: `up | down | left | right` (cruceta) o `a | b` (botones). Solo se pintan los slots declarados.
- `action`: una acción de la unión `XAction` del motor; `touchLayout<XAction>()` hace que una acción mal escrita falle en `tsc`.
- `label`: texto corto en mayúsculas (`""` si el glifo basta, como SERPENTINA).
- `repeat: true` para acciones de pulsación que deben repetirse al mantener (170 ms de espera, luego cada 50 ms); las acciones mantenidas del motor (girar, mover la pala) no lo llevan.
- EMPEZAR y PAUSA siguen siendo los botones de `GamePlayer`; el mando no arranca ni pausa.
