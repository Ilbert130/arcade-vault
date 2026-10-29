---
name: add-game
description: Crea o porta un juego a Arcade Vault con su motor TypeScript, componente canvas, integración en GamePlayer y leaderboard en Supabase (playable, scores, Salón de la Fama). Úsalo siempre que el usuario pida agregar, portar, migrar, implementar o hacer jugable un juego (Tetris/caída, Arkanoid/bloque-buster, Snake/serpentina, Pac-Man/glotón, invasores, ranaria, duelo-pixel, o uno nuevo), que venga o no de references/started-games, o que hable de "activar el leaderboard", "poner playable" o "integrar un juego en la plataforma", aunque no mencione la palabra skill.
argument-hint: <juego o ruta en references/started-games>
---

# add-game — llevar un juego a Arcade Vault

Un juego "completo" en esta plataforma son cuatro piezas que deben encajar: **motor TS** (sin React) → **componente canvas** → **entrada en el registry de `GamePlayer`** → **fila `playable = true` en `public.games`**. El leaderboard (`saveScore`, vistas, modal, Salón) ya es genérico: en cuanto el juego es `playable` y reporta puntuación, guarda y rankea solo. Los specs 05 (ROCAS) y 06 (leaderboard) son la referencia viva; este skill repite su patrón.

Responde en el idioma del usuario; el texto de UI del proyecto va en español.

## Convenciones de nombres

- `<slug>` es siempre el `id` del juego en `public.games` (p. ej. `caida`, `bloque-buster`, `serpentina`), no el nombre del juego original (`tetris`, `arkanoid`). Así carpeta, assets, migración y URL coinciden y el siguiente agente encuentra todo con el mismo nombre. Excepción: `lib/games/asteroids/` ya existe para `rocas`; no la renombres.
- Componente: `<Name>Canvas.tsx` con `<Name>` en PascalCase del `id` (`CaidaCanvas`, `BloqueBusterCanvas`); clase CSS `.<slug>-canvas`.
- Registry: `components/games/registry.tsx` (con `x`, porque guarda referencias a componentes). Si ya existe como `.ts`, déjalo como está.
- Clases del overlay de inicio genéricas: `.game-start*` (no `.rocas-start*`).

## Antes de escribir código

1. Lee `CLAUDE.md`/`AGENTS.md`. Luego **abre y lee** (no basta con listar la carpeta) las guías de `node_modules/next/dist/docs/` que toquen lo que vas a escribir: como mínimo Client Components / `"use client"` y public assets si el juego los usa. Next 16.3.3 difiere de lo que sabes y el proyecto lo exige.
2. Lee `specs/05-asteroides-rocas.md` y `specs/06-leaderboard-tabla-juegos.md` solo si necesitas el detalle; el resumen operativo está en `references/`.
3. **Invoca el skill `/frontend-design` (herramienta Skill, `frontend-design`) antes de escribir el CSS y los overlays del juego.** Es una regla del proyecto, no opcional: el overlay de inicio, los controles y el estilo del canvas se diseñan con él, partiendo de los tokens y clases CRT existentes en `globals.css`. Si el entorno no permite invocar skills, dilo en el resumen final en lugar de omitirlo en silencio.
4. Un hook ejecuta Prettier+ESLint en cada edición: arregla lo que reporte (p. ej. el lint de React Compiler rechaza algunos `useCallback`; si lo quitas, comprueba que el comportamiento no cambia).

## Flujo

### 1. Identificar el juego

- **¿Hay referencia?** Mira `references/started-games/` (`ls`). Si existe la carpeta (p. ej. `03-tetris`, `04-arkanoid`), lee `game.js`, `index.html`, assets y su `README.md`. Si no existe o el usuario pide un juego nuevo, diséñalo desde cero con el mismo contrato (no inventes una referencia).
- **¿Ya está en el catálogo?** Revisa `supabase/migrations/*games_scores.sql`: ids sembrados con `playable=false`: `bloque-buster` (Arkanoid), `caida` (Tetris), `serpentina`, `gloton`, `invasores`, `ranaria`, `duelo-pixel`. Si el id existe, solo se hace `update ... set playable = true`; si es nuevo, `insert` con `sort_order` único, `cat` ∈ ARCADE/PUZZLE/SHOOTER/VERSUS, `color` ∈ cyan/magenta/yellow/green y una clase `cover-*`.
- Si hay ambigüedad real (qué juego, controles, alcance de niveles/sonido), pregunta antes de seguir.

### 2. Spec primero

Crea `specs/NN-slug.md` (NN = siguiente número libre; `ls specs/`) con `assets/spec-template.md`, en español, con el mismo formato de los specs 05/06 (Estado, Depende de, Fecha, Objetivo, Alcance, Archivos, Plan, Criterios `[ ]`, Decisiones, Riesgos). Si hay `specs/.spec-config.yml` con `AutoCreateBranch: true`, trabaja en la rama `spec-NN-slug`. Muestra el spec al usuario y espera su visto bueno antes de implementar; si prefiere el flujo oficial, delega a `/spec` y `/spec-impl`.

### 3. Prerrequisito: registry en GamePlayer

`components/GamePlayer.tsx` nació hard-coded a ROCAS (`isRocas`). Si todavía existe esa bandera, haz **primero y por separado** el refactor descrito en `references/game-registry.md` (ROCAS pasa a ser una entrada, sin cambios de comportamiento; verifica que sigue funcionando). Si el registry ya existe, solo agrega una entrada.

### 4. Motor

`lib/games/<slug>/{types,constants,entities?,engine}.ts` siguiendo `references/engine-contract.md`. Si portas desde vanilla JS, aplica `references/porting-vanilla-js.md` (globals → closure, DOM → callbacks, overlays → React, assets → `public/games/<slug>/`). El motor no importa React ni toca `document.getElementById`.

### 5. Componente canvas

`components/games/<Name>Canvas.tsx` copiando el patrón de `AsteroidsCanvas.tsx`: motor creado una vez en `useEffect([])`, callbacks por refs, `status` → `start/pause/resume/reset`, `destroy()` en el cleanup.

### 6. Integración visual

Entrada en el registry, CSS del juego junto al bloque ROCAS de `app/globals.css` (canvas 4:3, overlay de inicio, controles), `.cover-*` nueva solo si el `cover` es nuevo. Usa `/frontend-design` y los tokens CSS existentes (neón, CRT).

### 7. Leaderboard

Sigue `references/leaderboard-integration.md`: migración `supabase/migrations/<timestamp>_<slug>_playable.sql` (plantilla en `assets/migration-template.sql`), aplicada con el MCP `apply_migration`, luego `get_advisors` (security). No regeneres tipos si solo cambian datos. No toques `saveScore`, vistas ni el modal salvo que el juego lo exija (justifícalo en el spec).

### 8. Verificar (evidencia antes de afirmar)

- `npm run build` y `npm run lint` sin errores.
- `npm run dev` + navegador (Playwright o Chrome DevTools MCP): el juego arranca, pausa, termina; invitado → "INICIA SESIÓN PARA GUARDAR TU MARCA" → `/auth`; con sesión → "PUNTUACIÓN GUARDADA" y fila en `scores` (consulta con MCP `execute_sql`); `/juegos/<id>` muestra top 10, partidas y mejor global; `/salon?juego=<id>` muestra podio y "TU MEJOR MARCA"; un juego aún simulado sigue mostrando "NO CLASIFICABLE (DEMO)"; consola sin errores; no queda rAF ni listeners tras navegar fuera.

### 9. Cierre

Marca `[x]` solo los criterios que **verificaste de verdad**. Si no pudiste abrir el navegador o aplicar la migración (entorno sin servidor, sin MCP, prueba no interactiva), deja sin marcar los criterios que dependen de eso (guardado con sesión, detalle, Salón, RLS, consola, limpieza de rAF/listeners) y di en el resumen final qué quedó sin probar; un `[x]` sin evidencia es peor que un `[ ]`. Pon `Estado: Implementado` solo si todo está marcado, si no `En revisión`. Actualiza `CLAUDE.md` (juegos jugables y specs implementados). Haz commit solo si el usuario lo pide.

Termina con un resumen: archivos creados/modificados, resultado literal de build y lint, qué pasos del flujo no se hicieron y por qué. Si no puedes escribir el archivo de resumen que te pidieron, entrégalo igual en el mensaje final.

## Reglas que evitan los fallos típicos

- Sin `any` ni `@ts-ignore`; sin estado mutable a nivel de módulo (rompe StrictMode y la segunda partida).
- `onHud` solo cuando cambia un valor; `onGameOver(finalScore)` exactamente una vez (también para victoria/fin de niveles).
- Registrar teclas en `start()` y quitarlas en `destroy()`; `preventDefault` en flechas/Espacio solo durante la partida; limpiar el mapa de teclas al pausar.
- Pausa automática en `visibilitychange`/`blur`; `blur()` del botón tras clic para que Espacio no lo reactive.
- Nada de `window`/`document`/`Audio`/`localStorage` en el cuerpo del módulo (SSR de Next): solo dentro de funciones llamadas desde `useEffect`.
- La puntuación enviada debe ser entero 0–99.999.999 (lo valida `saveScore`; RLS es la garantía final).
- Un juego sin entrada en el registry sigue en simulación y `playable=false`: no los mezcles.
