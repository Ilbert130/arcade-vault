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
};
export type GameEntry = {
  Canvas: React.ComponentType<GameRenderProps>;
  hud: HudFields;            // qué muestra la barra superior
  controls: string;          // texto de .crt-controls (en español)
  startTitle: string;        // título del overlay de inicio
  startHint?: string;
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
Una entrada nueva: `{ Canvas: TetrisCanvas, hud: ["score","lines","level"], controls: "← → MOVER · ↑ ROTAR · ↓ CAÍDA · ESPACIO CAÍDA RÁPIDA · P PAUSA", startTitle: "CAÍDA", … }`.
