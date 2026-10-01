// Mundo lógico fijo: la física y la dificultad no dependen del tamaño de pantalla.
export const W = 800;
export const H = 600;
/** Límite de dt por frame (s) para evitar saltos tras un parón. */
export const MAX_DT = 0.05;
// ── Asteroides (índice = tamaño 1, 2, 3) ──────────────────────────────────────
export const RADII = [0, 16, 30, 50] as const;
export const SPEEDS = [0, 85, 55, 32] as const;
export const POINTS = [0, 100, 50, 20] as const;
export const SAFE_SPAWN_DIST = 130;
// ── Nave ──────────────────────────────────────────────────────────────────────
export const SHIP_ROT = 3.5; // rad/s
export const SHIP_THRUST = 260; // px/s²
export const SHIP_DRAG = 0.987;
export const SHIP_RADIUS = 12;
export const SHIP_INVINCIBLE = 3; // s tras reaparecer
export const SHIP_NOSE = 21;
export const SHOOT_COOLDOWN = 0.2;
export const RESPAWN_DELAY = 2;
export const START_LIVES = 3;
// ── Balas ─────────────────────────────────────────────────────────────────────
export const BULLET_SPEED = 520;
export const BULLET_TTL = 1.1;
// ── Power-up de disparo triple ────────────────────────────────────────────────
export const POWERUP_DROP_CHANCE = 0.15;
export const POWERUP_DURATION = 5;
export const POWERUP_TTL = 12;
export const POWERUP_GUARANTEED_KILLS = 5;
export const TRIPLE_SPREAD = 0.18;
// ── Paleta neón (replica los tokens de app/globals.css) ───────────────────────
export const PALETTE = {
  bg: "#000000",
  ink: "#e6e9ff", // --ink
  inkDim: "#8a8fb5", // --ink-dim
  cyan: "#00f5ff", // --cyan
  magenta: "#ff006e", // --magenta
  yellow: "#f5ff00", // --yellow
  green: "#00ff88", // --green
} as const;
/** Partículas en --ink (#e6e9ff) con alfa variable. */
export const PARTICLE_RGB = "230, 233, 255";
/** Llama del propulsor en --yellow con alfa. */
export const FLAME_COLOR = "rgba(245, 255, 0, 0.85)";
export const GLOW = 10;
