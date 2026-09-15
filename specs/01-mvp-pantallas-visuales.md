# SPEC 01 — MVP: pantallas visuales de Arcade Vault

**Estado:** Approved
**Depende de:** —
**Fecha:** 2026-09-02
**Objetivo:** Migrar las 5 pantallas visuales del prototipo estático (`references/templates/*.jsx`) a rutas reales de Next.js 16 (App Router + TS + Tailwind v4), sin implementar ningún juego jugable de verdad.

## Alcance

**Incluye:**
- Migración de las 5 pantallas del prototipo a rutas de App Router:
  - Biblioteca (`/`) — hero, buscador, chips de categoría, grid de juegos.
  - Detalle de juego (`/juegos/[id]`) — info del juego + tabla de mejores puntuaciones.
  - Reproductor (`/juegos/[id]/jugar`) — HUD, pantalla CRT con la simulación visual de partida ya existente en el template (puntaje que sube solo, vidas, nivel, pausa, modal de fin de juego), y guardado de puntuación.
  - Autenticación (`/auth`) — tabs de iniciar sesión / crear cuenta, botón de invitado, botones sociales decorativos.
  - Salón de la Fama (`/salon`) — tabs por juego, podio top 3, tabla de puntuaciones, fila "tu marca" si hay sesión.
- Layout global (`app/layout.tsx`) con `Nav` (logo, links activos, contador de créditos fijo, botón de sesión, menú hamburguesa móvil) y footer, igual que en el prototipo.
- Datos mock (`GAMES`, `CATS`, `PLAYERS`, `seededScores`) portados a un módulo TypeScript tipado.
- Sesión de usuario (`av_user`) y puntuaciones guardadas (`av_scores`) persistidas en `localStorage`, igual que en el prototipo — sin backend real.
- Estilos: reutilizar el tema ya portado en `app/globals.css` (ya incluye todas las clases `.av-*`, `.card`, `.btn`, `.crt`, etc. del prototipo).

**No incluye:**
- Ningún juego jugable de verdad (mecánicas reales, colisiones, inputs de juego). La pantalla "Reproductor" mantiene la simulación puramente visual que ya trae el template (intervalo que incrementa un puntaje ficticio).
- Autenticación real (no hay backend, no hay validación de credenciales, no hay proveedores OAuth reales).
- Persistencia en servidor o base de datos — todo vive en `localStorage` del navegador.
- Sistema de créditos/monedas funcional (el contador "CRÉDITOS · 03" es decorativo y fijo).
- Cualquier funcionalidad no visible en los templates de referencia (perfiles, notificaciones, multijugador, etc.) — quedaría para un spec futuro.

## Modelo de datos

Nuevo módulo `lib/data.ts` (tipado), sin base de datos:

```ts
export type Game = {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string; // clase CSS .cover-* ya definida en globals.css
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;
};

export type ScoreRow = { rank: number; name: string; score: number; date: string };

export const GAMES: Game[];
export const CATS: string[]; // ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]
export const PLAYERS: string[];
export function seededScores(seed: number, count?: number): ScoreRow[];
```

Nuevo módulo `lib/session.ts` para leer/escribir `localStorage` (client-only):

```ts
export type SessionUser = { name: string };
export function getUser(): SessionUser | null;
export function setUser(user: SessionUser | null): void; // av_user
export function saveScore(entry: { game: string; score: number; name: string }): void; // av_scores
```

## Plan de implementación

1. Crear `lib/data.ts` portando `GAMES`, `CATS`, `PLAYERS` y `seededScores` desde `references/templates/data.jsx`, con tipos TS.
2. Crear `lib/session.ts` con los helpers de `localStorage` para usuario (`av_user`) y puntuaciones (`av_scores`), replicando `handleLogin`/`handleSaveScore` de `app.jsx`.
3. Crear `components/Nav.tsx` (client component) portando `nav.jsx`: logo, links activos vía `usePathname()`, contador de créditos, botón de sesión (usa `session.ts`), panel móvil con backdrop.
4. Actualizar `app/layout.tsx` para renderizar `<Nav />` antes de `{children}` y el footer después (ya existen `.av-bg`/`.av-noise`/`#root`/`.av-main`), quitando el `<main>` duplicado si aplica.
5. Reescribir `app/page.tsx` como la pantalla Biblioteca (`biblioteca.jsx`): hero, buscador + chips de categoría (estado client-side), grid de `GameCard`, estado vacío "NO HAY RESULTADOS". `GameCard` como componente client aparte con el efecto tilt del mouse.
6. Crear `app/juegos/[id]/page.tsx` portando `detalle.jsx`: info del juego, tags, stat-strip, leaderboard con `seededScores`, botón "JUGAR AHORA" → `/juegos/[id]/jugar`, botón "VOLVER AL VAULT" → `/`. `notFound()` si el id no existe.
7. Crear `app/juegos/[id]/jugar/page.tsx` (client component) portando `reproductor.jsx`: HUD, pantalla CRT con la simulación visual existente (interval de puntaje, vidas, nivel, pausa), modal de fin de juego que guarda la puntuación vía `session.ts`, botones "JUGAR DE NUEVO" / "VOLVER AL VAULT" / "SALIR".
8. Crear `app/auth/page.tsx` (client component) portando `auth.jsx`: tabs iniciar sesión/crear cuenta, formulario, botón "JUGAR COMO INVITADO", botones sociales decorativos; al enviar, guarda el usuario vía `session.ts` y redirige a `/`.
9. Crear `app/salon/page.tsx` portando `salon.jsx`: tabs por juego, podio top 3, tabla de puntuaciones con `seededScores`, fila "tu mejor marca" si hay sesión activa (leída de `session.ts`), botón "VOLVER A LA BIBLIOTECA" → `/`.
10. Eliminar el contenido boilerplate de `create-next-app` que quede en `app/page.tsx` (ya se sobrescribe en el paso 5) y verificar que `npm run build` compile sin errores de tipos ni de rutas.

## Criterios de aceptación

- [ ] `/` muestra la Biblioteca: hero, buscador funcional (filtra por texto), chips de categoría funcionales (filtran por `cat`), grid de tarjetas de `GAMES`, y el estado vacío cuando no hay resultados.
- [ ] Cada tarjeta de juego navega a `/juegos/[id]` al hacer click o al pulsar "JUGAR".
- [ ] `/juegos/[id]` muestra la info del juego y una tabla de mejores puntuaciones generada con `seededScores`; el botón "JUGAR AHORA" navega a `/juegos/[id]/jugar`.
- [ ] `/juegos/[id]/jugar` muestra el HUD y la pantalla CRT con la simulación visual (el puntaje sube solo, hay pausa funcional); al pulsar "FIN" aparece el modal de fin de juego y se puede guardar la puntuación (persistida en `localStorage`).
- [ ] `/auth` permite alternar entre "iniciar sesión" y "crear cuenta", enviar el formulario guarda un usuario en `localStorage` y redirige a `/`; "JUGAR COMO INVITADO" limpia la sesión y redirige a `/`.
- [ ] `/salon` muestra tabs por juego, podio top 3, tabla completa de puntuaciones, y la fila "tu mejor marca" solo si hay un usuario en sesión.
- [ ] El `Nav` global aparece en las 5 rutas, resalta el link activo correctamente, y el botón de sesión cambia entre "Iniciar Sesión" y el nombre del usuario según `localStorage`.
- [ ] El menú hamburguesa móvil del `Nav` abre/cierra correctamente en viewport angosto.
- [ ] `npm run build` termina sin errores.
- [ ] Ningún archivo implementa lógica de juego real (colisiones, inputs de control, reglas) — solo la simulación visual ya existente en el template.

## Decisiones tomadas

- **Rutas por carpeta** (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/auth`, `/salon`) en vez de mantener el ruteo por hash del prototipo — es lo idiomático en Next.js App Router y evita reimplementar un router manual.
- **Interacción real con `localStorage`** (sesión + puntuaciones) en vez de maquetas puramente estáticas — el prototipo ya definía ese comportamiento y es trivial de portar; mantiene el MVP navegable de punta a punta sin backend.
- **Se conserva la simulación visual del Reproductor** (puntaje ficticio incrementando por `setInterval`, vidas, nivel, modal de fin de juego) tal como está en `reproductor.jsx` — es un efecto visual, no una mecánica de juego real, y es necesario para mostrar el flujo completo de la pantalla.
- **Elementos decorativos sin funcionalidad** (contador de créditos fijo, botones sociales de Google/GitHub) se mantienen visibles pero inertes, consistente con el alcance "solo la parte visual".
- **Datos mock en `lib/data.ts`** en vez de `app/data.ts` — separa datos/lógica compartida de las rutas, siguiendo la convención habitual de Next.js.
- **`Nav` vive en `app/layout.tsx`** envolviendo todas las rutas, en vez de repetirse en cada página — evita duplicación y usa `usePathname()` de `next/navigation` para el estado activo en vez de comparar un objeto `route` manual.

## Riesgos identificados

- Los estilos de `app/globals.css` ya fueron portados manualmente en un commit previo (`b4f5016`) y deben seguir cubriendo todas las clases usadas por las pantallas nuevas (`.av-detail`, `.av-player`, `.crt`, `.modal`, `.av-hall`, `.podium`, etc.) — si falta alguna clase al portar una pantalla, se debe agregar a `globals.css` en el mismo paso, no diferirlo.
- Al usar `localStorage` en componentes que Next.js podría intentar renderizar en servidor, hay que marcar explícitamente como `"use client"` los componentes que leen/escriben sesión (Nav, Auth, Reproductor, Salón) para evitar errores de hidratación.
