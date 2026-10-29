import {
  BULLET_SPEED,
  BULLET_TTL,
  H,
  POWERUP_TTL,
  RADII,
  SHIP_DRAG,
  SHIP_INVINCIBLE,
  SHIP_NOSE,
  SHIP_RADIUS,
  SHIP_ROT,
  SHIP_THRUST,
  SHOOT_COOLDOWN,
  SPEEDS,
  TRIPLE_SPREAD,
  W,
} from "./constants";
import type { AsteroidsSkin } from "./skins";
import type { ActionMap } from "./types";
// ── Utils ─────────────────────────────────────────────────────────────────────
export const wrap = (v: number, max: number) => ((v % max) + max) % max;
export const dist = (
  a: { x: number; y: number },
  b: { x: number; y: number },
) => Math.hypot(a.x - b.x, a.y - b.y);
export const rand = (min: number, max: number) =>
  min + Math.random() * (max - min);
export const randInt = (min: number, max: number) =>
  Math.floor(rand(min, max + 1));
export type AsteroidSize = 1 | 2 | 3;
/** Pasada fina del núcleo (skin neón) sobre el trazo actual, sin glow. */
function strokeCore(ctx: CanvasRenderingContext2D, skin: AsteroidsSkin) {
  if (!skin.core) return;
  ctx.shadowBlur = 0;
  ctx.strokeStyle = skin.core;
  ctx.lineWidth = skin.lineWidth * 0.4;
  ctx.stroke();
}
// ── Bullet ────────────────────────────────────────────────────────────────────
export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl = BULLET_TTL;
  radius = 2;
  dead = false;
  constructor(x: number, y: number, angle: number) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * BULLET_SPEED;
    this.vy = Math.sin(angle) * BULLET_SPEED;
  }
  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }
  draw(ctx: CanvasRenderingContext2D, skin: AsteroidsSkin) {
    ctx.save();
    ctx.fillStyle = skin.yellow;
    ctx.shadowColor = skin.yellow;
    ctx.shadowBlur = skin.glow * 0.8;
    if (skin.squareBullets) {
      // Píxel duro del mismo tamaño que el punto redondo (solo dibujo).
      const r = this.radius;
      ctx.fillRect(
        Math.round(this.x - r),
        Math.round(this.y - r),
        r * 2,
        r * 2,
      );
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    if (skin.core) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = skin.core;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
// ── Asteroid ──────────────────────────────────────────────────────────────────
export class Asteroid {
  x: number;
  y: number;
  size: AsteroidSize;
  radius: number;
  dead = false;
  vx: number;
  vy: number;
  rotSpeed: number;
  rot: number;
  verts: [number, number][] = [];
  constructor(x: number, y: number, size: AsteroidSize = 3) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = RADII[size];
    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);
    // Polígono irregular
    const n = randInt(8, 13);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }
  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }
  split(): Asteroid[] {
    if (this.size <= 1) return [];
    const next = (this.size - 1) as AsteroidSize;
    return [
      new Asteroid(this.x, this.y, next),
      new Asteroid(this.x, this.y, next),
    ];
  }
  draw(ctx: CanvasRenderingContext2D, skin: AsteroidsSkin) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = skin.magenta;
    ctx.shadowColor = skin.magenta;
    ctx.shadowBlur = skin.glow;
    ctx.lineWidth = skin.lineWidth;
    ctx.lineJoin = skin.lineJoin;
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    strokeCore(ctx, skin);
    ctx.restore();
  }
}
// ── PowerUp ───────────────────────────────────────────────────────────────────
export class PowerUp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius = 12;
  ttl = POWERUP_TTL;
  dead = false;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 40);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }
  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }
  draw(ctx: CanvasRenderingContext2D, skin: AsteroidsSkin, font: string) {
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;
    const pulse = 0.85 + Math.sin(performance.now() / 150) * 0.15;
    ctx.save();
    ctx.shadowColor = skin.green;
    ctx.shadowBlur = skin.glow * 1.2;
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = skin.green;
    ctx.lineWidth = skin.lineWidth * (4 / 3);
    const r = this.radius * pulse;
    ctx.beginPath();
    ctx.rect(-r, -r, r * 2, r * 2);
    ctx.stroke();
    strokeCore(ctx, skin);
    ctx.restore();
    ctx.save();
    ctx.shadowColor = skin.green;
    ctx.shadowBlur = skin.glow * 0.6;
    ctx.fillStyle = skin.green;
    ctx.font = `bold 12px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("3x", this.x, this.y);
    ctx.restore();
  }
}
// ── Ship ──────────────────────────────────────────────────────────────────────
export class Ship {
  x = W / 2;
  y = H / 2;
  angle = -Math.PI / 2;
  vx = 0;
  vy = 0;
  radius = SHIP_RADIUS;
  thrusting = false;
  invincible = SHIP_INVINCIBLE;
  shootCooldown = 0;
  dead = false;
  tripleShot = 0;
  constructor() {
    this.reset();
  }
  reset() {
    this.x = W / 2;
    this.y = H / 2;
    this.angle = -Math.PI / 2;
    this.vx = 0;
    this.vy = 0;
    this.radius = SHIP_RADIUS;
    this.thrusting = false;
    this.invincible = SHIP_INVINCIBLE;
    this.shootCooldown = 0;
    this.dead = false;
  }
  update(dt: number, keys: ActionMap) {
    if (this.dead) return;
    if (this.invincible > 0) this.invincible -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.tripleShot > 0) this.tripleShot -= dt;
    if (keys.rotateLeft) this.angle -= SHIP_ROT * dt;
    if (keys.rotateRight) this.angle += SHIP_ROT * dt;
    this.thrusting = !!keys.thrust;
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * SHIP_THRUST * dt;
      this.vy += Math.sin(this.angle) * SHIP_THRUST * dt;
    }
    this.vx *= SHIP_DRAG;
    this.vy *= SHIP_DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }
  tryShoot(): Bullet[] {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = SHOOT_COOLDOWN;
    const ox = this.x + Math.cos(this.angle) * SHIP_NOSE;
    const oy = this.y + Math.sin(this.angle) * SHIP_NOSE;
    if (this.tripleShot > 0) {
      return [
        new Bullet(ox, oy, this.angle - TRIPLE_SPREAD),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle + TRIPLE_SPREAD),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }
  /** `blink` desactiva el parpadeo de invencibilidad (p. ej. antes de empezar). */
  draw(ctx: CanvasRenderingContext2D, skin: AsteroidsSkin, blink = true) {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (
      blink &&
      this.invincible > 0 &&
      Math.floor(this.invincible * 8) % 2 === 0
    )
      return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = skin.cyan;
    ctx.shadowColor = skin.cyan;
    ctx.shadowBlur = skin.glow;
    ctx.lineWidth = skin.lineWidth;
    ctx.lineJoin = skin.lineJoin;
    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo(20, 0); // nariz
    ctx.lineTo(-12, -9); // ala izquierda
    ctx.lineTo(-7, 0); // muesca trasera
    ctx.lineTo(-12, 9); // ala derecha
    ctx.closePath();
    ctx.stroke();
    if (skin.core) {
      strokeCore(ctx, skin);
      // Restaura trazo y glow para la llama.
      ctx.lineWidth = skin.lineWidth;
      ctx.shadowBlur = skin.glow;
    }
    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8, 4);
      ctx.strokeStyle = skin.flame;
      ctx.shadowColor = skin.yellow;
      ctx.stroke();
    }
    ctx.restore();
  }
}
// ── Partículas (explosión) ────────────────────────────────────────────────────
export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  dead = false;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl = this.life;
  }
  update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }
  // Sin shadowBlur: puede haber muchas partículas a la vez.
  draw(ctx: CanvasRenderingContext2D, skin: AsteroidsSkin) {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(${skin.particleRgb},${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}
