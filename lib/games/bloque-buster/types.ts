export type BloqueBusterHud = {
  score: number;
  lives: number;
  level: number;
};
export type BloqueBusterCallbacks = {
  /** Se llama solo cuando cambia score, lives o level (no en cada frame). */
  onHud: (hud: BloqueBusterHud) => void;
  /** Se llama una vez: al perder la última vida o al completar el nivel 5. */
  onGameOver: (finalScore: number) => void;
};
export type BloqueBusterGame = {
  start: () => void; // partida desde cero y bucle rAF
  pause: () => void; // congela update (sigue dibujando el último frame)
  resume: () => void; // continúa; reinicia el reloj de dt
  reset: () => void; // estado inicial sin arrancar
  destroy: () => void; // cancela rAF y elimina listeners
};
export type BlockColor =
  "gray" | "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green";
export type Rect = { x: number; y: number; w: number; h: number };
export type Block = Rect & { color: BlockColor; alive: boolean };
export type Explosion = Rect & { color: BlockColor; elapsed: number };
export type Ball = Rect & { vx: number; vy: number };
export type LevelBlock = { col: number; row: number; color: BlockColor };
export type Level = { speed: number; blocks: LevelBlock[] };
/** Región del spritesheet. */
export type SpriteRect = { sx: number; sy: number; sw: number; sh: number };
