# Arcade Vault

Portal retro para jugar arcades clásicos en el navegador y competir por la mayor puntuación en un ranking global.

**Stack:** Next.js 16.3.3 (App Router, React 19, TypeScript, Tailwind CSS v4) · Supabase (Auth + Postgres) · Resend (correo de contacto).

Juegos jugables: ROCAS (Asteroids), CAÍDA (Tetris), BLOQUE BUSTER (Arkanoid), SERPENTINA (Snake) y RANARIA (Frogger). La lista viva está en [`references/implemented-games/implemented-games.md`](references/implemented-games/implemented-games.md).

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # rellena las claves de Supabase y Resend
npm run dev                  # http://localhost:3000
```

| Variable                                                           | Uso                                                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Cliente de Supabase (Project Settings → API)                                               |
| `RESEND_API_KEY`                                                   | Formulario de contacto de `/about`                                                         |
| `SUPABASE_DB_PASSWORD`                                             | Acceso a la base de datos (migraciones)                                                    |
| `DEV_ALLOWED_ORIGINS`                                              | Solo desarrollo: IPs de la LAN separadas por comas para abrir `npm run dev` desde el móvil |

## Scripts

| Comando                       | Qué hace                                                        |
| ----------------------------- | --------------------------------------------------------------- |
| `npm run dev`                 | Servidor de desarrollo                                          |
| `npm run build` / `npm start` | Build de producción y servidor                                  |
| `npm run lint`                | ESLint                                                          |
| `npm run typecheck`           | `tsc --noEmit`                                                  |
| `npm run check`               | Lint + typecheck (lo mismo que comprueba la CI, salvo el build) |
| `npm run format`              | Prettier sobre todo el repo                                     |

La CI (`.github/workflows/ci.yml`) ejecuta lint, typecheck y build en cada PR y en cada push a `main`.

## Estructura

```
app/                    rutas (páginas finas) y Server Actions colocadas junto a su ruta
  styles/               CSS global partido por zona; app/globals.css solo los importa en orden
components/
  layout/               Nav
  shared/               piezas reutilizables (GameCard, useReveal)
  home/ about/ auth/ library/ hall-of-fame/ game-detail/
  player/               reproductor: GamePlayer, SkinSwitch, useGameSkin, TouchPad
  games/                registry de juegos, useGameCanvas y un <Slug>Canvas por juego
lib/
  catalog/              consultas a Supabase del catálogo y leaderboard (solo servidor) y sus tipos
  format.ts             formatos de puntuación, rango y fecha (es-ES)
  games/platform/       contrato común de los juegos, skins y mando táctil
  games/<slug>/         motor TypeScript de cada juego, sin React
  placeholder/          datos de ejemplo que aún no vienen de Supabase
  supabase/             clientes de Supabase (servidor, navegador, proxy) y tipos generados
public/games/<slug>/    sprites y sonidos de cada juego
supabase/migrations/    esquema y una migración `<timestamp>_<slug>_playable.sql` por juego
specs/                  specs numerados (índice y estado en specs/README.md)
docs/game-jam/          resultados de las game jams
references/             material fuente: juegos originales, maquetas y arte (no forma parte de la app)
.claude/                skills, agentes y hooks del proyecto para Claude Code
```

## Cómo se trabaja

El proyecto sigue **Spec Driven Design**: cada cambio parte de un spec en `specs/` y se implementa en su rama `spec-NN-slug`.

```bash
npx skills@latest add Klerith/fernando-skills   # /spec y /spec-impl
```

Para añadir un juego se usa el skill del proyecto `/add-game`; las convenciones (motor, Canvas, registry, migración) están en [`CLAUDE.md`](CLAUDE.md) y en `.claude/skills/add-game/`.
