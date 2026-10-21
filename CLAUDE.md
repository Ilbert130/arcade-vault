# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault: a retro arcade portal for playing games online and competing on a points leaderboard (see README.md). Next.js 16.3.3 (App Router, TypeScript, React 19, Tailwind CSS v4) + Supabase (Auth + Postgres). UI copy is in Spanish.

Commands: `npm run dev`, `npm run build`, `npm run lint`, `npm run format`. There is no test runner configured.

## Architecture

- **Routes (`app/`)**: `/` home, `/about` (contact form → Server Action in `app/about/actions.ts` sending email via Resend), `/auth` (Supabase Auth, actions in `app/auth/actions.ts`), `/biblioteca` (game library), `/salon` (Hall of Fame), `/juegos/[id]` (game detail + top 10), `/juegos/[id]/jugar` (player; `actions.ts` has the `saveScore` Server Action).
- **Pages are thin Server Components** that fetch data and pass it as props to UI components in `components/` (client components where interactivity is needed, e.g. `Library.tsx` search/filters, `GamePlayer.tsx`).
- **Supabase clients (`lib/supabase/`)**: `server.ts` (Server Components/Actions, cookie-based, create one per request), `client.ts` (browser), `proxy.ts` (`updateSession`). Root `proxy.ts` (Next 16's replacement for middleware) refreshes the session and redirects logged-in users away from `/auth`.
- **Data layer (`lib/games/`)**: `types.ts` (`Game`, `GameWithStats`, `LeaderboardRow`) and `queries.ts` (server-only: `getGames`, `getGamesWithStats`, `getGame`, `getGameStats`, `getLeaderboard`, `getPlayerBest`). Queries swallow errors and return empty values. `getGames`, `getGamesWithStats` and `getGame` filter by `playable = true`, so unimplemented games are hidden everywhere (Home, Biblioteca, Salón) and `/juegos/[id]` returns 404 for them; a game appears by setting its `playable` flag (the `/add-game` migration). `lib/data.ts` only keeps `CATS`.
- **Database** (`supabase/migrations/`, applied to the remote project via the Supabase MCP): `profiles` (created by `handle_new_user` trigger), `games` (catalog, read-only for clients, changes only via migration; `playable` flag), `scores` (public read; insert only by the authenticated owner on playable games; no update/delete), views `leaderboard` (best score per user/game with `rank`) and `game_stats` (`best`, `plays`), both `security_invoker`. After schema changes regenerate `lib/supabase/database.types.ts` with the MCP `generate_typescript_types`. Each newly playable game gets its own migration (`<timestamp>_<slug>_playable.sql`, e.g. `caida`, `bloque_buster`, `serpentina`). The Supabase MCP server is configured in `.mcp.json`.
- **Games**: engines live in `lib/games/<game>/` as framework-agnostic TS (e.g. `asteroids/engine.ts`), wrapped by a `<Name>Canvas.tsx` component in `components/games/` and hosted by `GamePlayer.tsx`, which looks the game up in `GAME_REGISTRY` (`components/games/registry.tsx`). Each `GameEntry` has `Canvas` (receives `status: "ready" | "playing" | "paused" | "over"`, `skin`, `onHud(GenericHud)`, `onGameOver(finalScore)` and `inputRef`), `hud` (subset of `score | lives | level | lines`), `controls`, `startTitle`, `startHint` and a **required** `touch` layout; ids without an entry get the simulated demo. Touch controls (spec 12): every engine exposes `press/release/releaseAll(action)` (its `XAction` union in `types.ts`; the keyboard maps keys → actions and goes through the same functions); the Canvas assigns the engine to `inputRef` (`GameInput`, `lib/games/touch.ts`) and `GamePlayer` renders `TouchPad.tsx` (D-pad + A/B from `entry.touch`, built with `touchLayout<XAction>()`, `repeat` for hold-to-repeat), calling `releaseAll()` when leaving `playing`. The pad only shows on `@media (pointer: coarse)`, with its own portrait/landscape player layout in `globals.css`. On game over `GamePlayer` calls `saveScore`, so the leaderboard needs no per-game code. Playable so far:
  - `rocas` — Asteroids, `lib/games/asteroids/` (folder keeps the original name).
  - `caida` — Tetris, `lib/games/tetris/`.
  - `bloque-buster` — Arkanoid, `lib/games/bloque-buster/`, sprites/sounds in `public/games/bloque-buster/`.
  - `serpentina` — Snake, built from scratch in `lib/games/serpentina/`, fruit atlas in `public/games/serpentina/` (source in `references/source-assets/snake-assets/`).
  - New games use the `games.id` slug for folder, assets, migration and URL (see the `add-game` skill).
- **References**: original vanilla JS games to port in `references/started-games/`; visual design templates in `references/templates/`; raw art in `references/source-assets/`; table of the currently playable games (id, title, category, short description, color) in `references/implemented-games/implemented-games.md` — update it whenever a game is made playable.
- **Home**: `components/Home.tsx` still reads `ACTIVITY` and `TOP_PLAYERS` from `lib/mock-data.ts` (placeholder data, not Supabase). `components/ComingSoon.tsx` is a generic placeholder page.
- **Styling**: the retro/CRT look is driven by CSS variables and classes in `app/globals.css` (e.g. `.cover-*` game covers, `.crt-content`); fonts (Press Start 2P, JetBrains Mono, Courier Prime) are set in `app/layout.tsx`.

Env vars (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `SUPABASE_DB_PASSWORD`.

## Skills

- Use always `/frontend-design` to design the user interface.
- `/add-game` (project skill in `.claude/skills/add-game/`): use it whenever a game is added, ported or made playable. It covers the TS engine, canvas component, registry entry, `playable` migration and leaderboard wiring, with references (`engine-contract.md`, `game-registry.md`, `leaderboard-integration.md`, `porting-vanilla-js.md`) and templates for the spec and the migration.
- `/spec` and `/spec-impl` (from `Klerith/fernando-skills`): Spec Driven Design flow, see Workflow.
- `/worktree <task>` (user-level skill): runs the task in an isolated git worktree under `.trees/<name>`, on its own branch.
- `game-planner` subagent (`.claude/agents/game-planner.md`): plans and decides which game fits the platform next; read-only on code, keeps a versioned memory of past suggestions (proposed/accepted/rejected/implemented) in `.claude/agent-memory/game-planner/MEMORY.md`; its output is a spec-ready card for `/add-game <id>`.
- `skin-designer` subagent (`.claude/agents/skin-designer.md`): audits that every playable game has at least 3 skins (`clasico` default = current look, `neon`, `retro`), and designs/implements missing ones following its skin contract (`lib/games/skins.ts`, per-game `skins.ts`, engine `setSkin`, selector in `GamePlayer`); skins are cosmetic only. Keeps per-game skin status in `.claude/agent-memory/skin-designer/MEMORY.md`. Run it after `/add-game`.
- `mobile-porter` subagent (`.claude/agents/mobile-porter.md`): audits and fixes the mobile/responsive experience (all pages + every playable game's player and touch pad) across a viewport matrix (phones portrait/landscape, tablet, narrow/standard desktop) using Chrome DevTools MCP; reference is spec 12 plus the post-spec layout changes (100dvh player, container-query `--key`, staged Nav collapse, `suppressHydrationWarning`, `allowedDevOrigins`). Audit-only unless asked to fix; never changes gameplay or skins. Keeps per-page/viewport status in `.claude/agent-memory/mobile-porter/MEMORY.md`. Run it after `/add-game` (with `skin-designer`).
- `/game-jam <tema>` (project skill in `.claude/skills/game-jam/`): runs a game jam on a theme. Launches 3 `game-jam-designer` subagents (`.claude/agents/game-jam/`) in parallel with different angles (A acción, B puzzle, C wildcard/versus), each writing a pitch + full spec; the main session judges them with `references/rubrica.md`, writes `veredicto.md`, copies the winner to `specs/NN-<id>.md` and logs the 3 ideas in game-planner's memory. Results live in `game-jam/<fecha>-<tema>/` (see `game-jam/README.md`).

## Before writing code

Read `node_modules/next/dist/docs/` first — this project pins Next.js 16.3.3, which has breaking changes vs. older Next.js versions likely present in training data (e.g. typed route props like `LayoutProps<"/">` in `app/layout.tsx`, `proxy.ts` instead of `middleware.ts`). See AGENTS.md above for details; that block is regenerated by `next dev` and should be committed as-is, not stripped out.

A PostToolUse hook (`.claude/hooks/format-and-lint.mjs`) runs Prettier + ESLint --fix on every edited file and strips blank lines from JS/TS/CSS files; unfixable lint errors are reported back and must be fixed.

## Workflow

Per README.md, this project follows Spec Driven Design using `/spec` and `/spec-impl` commands from the `Klerith/fernando-skills` skill pack (installed via `npx skills@latest add Klerith/fernando-skills`). Specs live in `specs/NN-slug.md` (01–10 implemented); `/spec-impl` auto-creates a `spec-NN-slug` branch (`specs/.spec-config.yml`). Prefer that spec → implementation flow over ad hoc changes when adding features.
