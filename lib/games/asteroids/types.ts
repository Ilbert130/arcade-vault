export type AsteroidsHud = {
  score: number;
  lives: number;
  level: number;
};
export type AsteroidsCallbacks = {
  /** Se llama solo cuando cambia score, lives o level (no en cada frame). */
  onHud: (hud: AsteroidsHud) => void;
  /** Se llama una vez cuando lives llega a 0. */
  onGameOver: (finalScore: number) => void;
};
export type AsteroidsGame = {
  start: () => void; // inicia la partida desde cero y el bucle rAF
  pause: () => void; // congela update (sigue dibujando el último frame)
  resume: () => void; // continúa; reinicia el reloj de dt
  reset: () => void; // estado inicial (score 0, lives 3, level 1) sin arrancar
  destroy: () => void; // cancela rAF y elimina listeners de teclado
};
/** Mapa de teclas presionadas, indexado por `KeyboardEvent.code`. */
export type KeyMap = Record<string, boolean>;
