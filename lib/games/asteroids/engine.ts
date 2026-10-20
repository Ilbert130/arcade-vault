import { DEFAULT_SKIN } from "@/lib/games/skins";
import type { SkinId } from "@/lib/games/skins";
import {
  H,
  MAX_DT,
  POINTS,
  POWERUP_DROP_CHANCE,
  POWERUP_DURATION,
  POWERUP_GUARANTEED_KILLS,
  RESPAWN_DELAY,
  SAFE_SPAWN_DIST,
  START_LIVES,
  W,
} from "./constants";
import {
  Asteroid,
  Bullet,
  Particle,
  PowerUp,
  Ship,
  dist,
  rand,
} from "./entities";
import { SKINS } from "./skins";
import type {
  AsteroidsCallbacks,
  AsteroidsGame,
  AsteroidsHud,
  KeyMap,
} from "./types";
/** Separación de la rejilla decorativa (skins con `grid`). */
const GRID_STEP = 40;
type Phase = "idle" | "playing" | "dead" | "paused" | "gameover";
/** Teclas que el juego consume; se bloquea su acción por defecto mientras se juega. */
const GAME_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
]);
export function createAsteroidsGame(
  canvas: HTMLCanvasElement,
  callbacks: AsteroidsCallbacks,
  skinId: SkinId = DEFAULT_SKIN,
): AsteroidsGame {
  const ctxOrNull = canvas.getContext("2d");
  if (!ctxOrNull) throw new Error("Canvas 2D no disponible");
  const ctx: CanvasRenderingContext2D = ctxOrNull;
  // Fuente monoespaciada del Vault (variable CSS ya resuelta por el navegador).
  const font =
    getComputedStyle(canvas).getPropertyValue("--mono").trim() || "monospace";
  // ── Estado (privado al closure) ─────────────────────────────────────────────
  let skin = SKINS[skinId] ?? SKINS[DEFAULT_SKIN];
  let ship = new Ship();
  let bullets: Bullet[] = [];
  let asteroids: Asteroid[] = [];
  let particles: Particle[] = [];
  let powerUps: PowerUp[] = [];
  let score = 0;
  let lives = START_LIVES;
  let level = 1;
  let phase: Phase = "idle";
  let pausedFrom: "playing" | "dead" = "playing";
  let deadTimer = 0;
  let powerUpSpawned = false;
  let killsSinceSpawn = 0;
  let keys: KeyMap = {};
  let justPressed: KeyMap = {};
  let rafId: number | null = null;
  let lastTime: number | null = null;
  let dpr = 0;
  let listening = false;
  let gameOverEmitted = false;
  let lastHud: AsteroidsHud | null = null;
  // ── Input ───────────────────────────────────────────────────────────────────
  const inProgress = () => phase === "playing" || phase === "dead";
  function onKeyDown(e: KeyboardEvent) {
    if (!inProgress()) return;
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    if (!keys[e.code]) justPressed[e.code] = true;
    keys[e.code] = true;
  }
  function onKeyUp(e: KeyboardEvent) {
    if (inProgress() && GAME_KEYS.has(e.code)) e.preventDefault();
    keys[e.code] = false;
  }
  function pressed(code: string) {
    const val = !!justPressed[code];
    justPressed[code] = false;
    return val;
  }
  function clearKeys() {
    keys = {};
    justPressed = {};
  }
  // ── HUD hacia React ─────────────────────────────────────────────────────────
  function emitHud() {
    if (
      lastHud &&
      lastHud.score === score &&
      lastHud.lives === lives &&
      lastHud.level === level
    )
      return;
    lastHud = { score, lives, level };
    callbacks.onHud(lastHud);
  }
  // ── Lógica ──────────────────────────────────────────────────────────────────
  function spawnAsteroids(count: number) {
    for (let i = 0; i < count; i++) {
      let x: number;
      let y: number;
      do {
        x = rand(0, W);
        y = rand(0, H);
      } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_SPAWN_DIST);
      asteroids.push(new Asteroid(x, y, 3));
    }
  }
  function initGame() {
    ship = new Ship();
    bullets = [];
    asteroids = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    score = 0;
    lives = START_LIVES;
    level = 1;
    deadTimer = 0;
    gameOverEmitted = false;
    spawnAsteroids(3 + level);
  }
  function nextLevel() {
    level++;
    bullets = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    ship.reset();
    spawnAsteroids(3 + level);
  }
  function explode(x: number, y: number, count = 8) {
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
  }
  function killShip() {
    explode(ship.x, ship.y, 14);
    ship.dead = true;
    lives--;
    if (lives <= 0) {
      phase = "gameover";
      clearKeys();
    } else {
      phase = "dead";
      deadTimer = RESPAWN_DELAY;
    }
  }
  function updateParticles(dt: number) {
    particles.forEach((p) => p.update(dt));
    particles = particles.filter((p) => !p.dead);
  }
  function update(dt: number) {
    if (phase === "idle" || phase === "paused") return;
    if (phase === "gameover") {
      updateParticles(dt);
      return;
    }
    if (phase === "dead") {
      deadTimer -= dt;
      updateParticles(dt);
      asteroids.forEach((a) => a.update(dt));
      if (deadTimer <= 0) {
        phase = "playing";
        ship.reset();
      }
      return;
    }
    // Disparar
    if (pressed("Space")) bullets.push(...ship.tryShoot());
    ship.update(dt, keys);
    bullets.forEach((b) => b.update(dt));
    asteroids.forEach((a) => a.update(dt));
    particles.forEach((p) => p.update(dt));
    powerUps.forEach((p) => p.update(dt));
    bullets = bullets.filter((b) => !b.dead);
    particles = particles.filter((p) => !p.dead);
    powerUps = powerUps.filter((p) => !p.dead);
    for (const p of powerUps) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        ship.tripleShot = POWERUP_DURATION;
      }
    }
    // Bala vs asteroide
    const newAsteroids: Asteroid[] = [];
    for (const b of bullets) {
      for (const a of asteroids) {
        if (!a.dead && !b.dead && dist(b, a) < a.radius) {
          b.dead = true;
          a.dead = true;
          score += POINTS[a.size];
          explode(a.x, a.y, a.size * 5);
          newAsteroids.push(...a.split());
          if (!powerUpSpawned) {
            killsSinceSpawn++;
            const guaranteed = killsSinceSpawn >= POWERUP_GUARANTEED_KILLS;
            if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
              powerUps.push(new PowerUp(a.x, a.y));
              powerUpSpawned = true;
            }
          }
        }
      }
    }
    asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
    bullets = bullets.filter((b) => !b.dead);
    // Nave vs asteroide
    if (ship.invincible <= 0) {
      for (const a of asteroids) {
        if (dist(ship, a) < ship.radius + a.radius * 0.82) {
          killShip();
          break;
        }
      }
    }
    // Nivel completado
    if (phase === "playing" && asteroids.length === 0) nextLevel();
  }
  // ── Draw ────────────────────────────────────────────────────────────────────
  function syncResolution() {
    const next = window.devicePixelRatio || 1;
    if (next === dpr) return;
    dpr = next;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  function drawLifeIcon(x: number, y: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.strokeStyle = skin.cyan;
    ctx.shadowColor = skin.cyan;
    ctx.shadowBlur = skin.glow * 0.6;
    ctx.lineWidth = skin.lineWidth * 0.8;
    ctx.lineJoin = skin.lineJoin;
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  function drawHUD() {
    ctx.save();
    ctx.font = `15px ${font}`;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = skin.ink;
    ctx.shadowColor = skin.hudShadow;
    ctx.shadowBlur = skin.hudGlow;
    ctx.textAlign = "left";
    ctx.fillText(`SCORE  ${score}`, 14, 26);
    ctx.textAlign = "center";
    ctx.fillText(`NIVEL ${level}`, W / 2, 26);
    for (let i = 0; i < lives; i++) drawLifeIcon(W - 16 - i * 22, 18);
    if (ship.tripleShot > 0) {
      ctx.textAlign = "left";
      ctx.fillStyle = skin.green;
      ctx.shadowColor = skin.green;
      ctx.shadowBlur = skin.glow * 0.8;
      ctx.fillText(`3x  ${ship.tripleShot.toFixed(1)}s`, 14, 46);
    }
    ctx.restore();
  }
  function drawGrid(color: string) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = GRID_STEP; x < W; x += GRID_STEP) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
    }
    for (let y = GRID_STEP; y < H; y += GRID_STEP) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
    }
    ctx.stroke();
    ctx.restore();
  }
  function draw() {
    syncResolution();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = skin.bg;
    ctx.fillRect(0, 0, W, H);
    if (skin.grid) drawGrid(skin.grid);
    particles.forEach((p) => p.draw(ctx, skin));
    asteroids.forEach((a) => a.draw(ctx, skin));
    powerUps.forEach((p) => p.draw(ctx, skin, font));
    bullets.forEach((b) => b.draw(ctx, skin));
    ship.draw(ctx, skin, phase !== "idle");
    drawHUD();
  }
  // ── Bucle ───────────────────────────────────────────────────────────────────
  function loop(ts: number) {
    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, MAX_DT);
    lastTime = ts;
    update(dt);
    emitHud();
    if (phase === "gameover" && !gameOverEmitted) {
      gameOverEmitted = true;
      callbacks.onGameOver(score);
    }
    draw();
    rafId = requestAnimationFrame(loop);
  }
  function ensureLoop() {
    if (rafId !== null) return;
    lastTime = null;
    rafId = requestAnimationFrame(loop);
  }
  function addListeners() {
    if (listening) return;
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    listening = true;
  }
  // Estado inicial visible antes de empezar.
  initGame();
  draw();
  return {
    start() {
      initGame();
      clearKeys(); // la pulsación de Espacio que inicia no dispara
      phase = "playing";
      lastTime = null;
      emitHud();
      addListeners();
      ensureLoop();
    },
    pause() {
      if (phase !== "playing" && phase !== "dead") return;
      pausedFrom = phase;
      phase = "paused";
      clearKeys();
    },
    resume() {
      if (phase !== "paused") return;
      phase = pausedFrom;
      clearKeys();
      lastTime = null;
    },
    reset() {
      initGame();
      clearKeys();
      phase = "idle";
      emitHud();
      draw();
    },
    setSkin(id) {
      skin = SKINS[id] ?? SKINS[DEFAULT_SKIN];
      // Redibuja ya: en "idle" no hay bucle y en pausa se ve el cambio al instante.
      draw();
    },
    destroy() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      listening = false;
      clearKeys();
    },
  };
}
