# 10 — SERPENTINA: Snake real en la plataforma

**Estado:** Implementado
**Depende de:** SPEC 05-asteroides-rocas, SPEC 06-leaderboard-tabla-juegos, SPEC 08-arkanoid-bloque-buster
**Fecha:** 2026-10-13

**Objetivo:** Crear Snake desde cero (no hay referencia en `references/started-games/`) como motor TS jugable en el CRT de `/juegos/serpentina/jugar`, usando las frutas de `references/source-assets/snake-assets/`, y activar su leaderboard (`playable = true`).

## Alcance

**Incluye:**

- Motor `lib/games/serpentina/` (types, constants, entities, engine) con contrato `{ start, pause, resume, reset, destroy }` y callbacks `onHud`/`onGameOver`.
- Componente `components/games/SerpentinaCanvas.tsx` (patrón de `BloqueBusterCanvas`).
- Entrada `serpentina` en `components/games/registry.tsx` (HUD: Puntuación, Nivel; controles; overlay `SERPENTINA`).
- Assets: `fruits.png` → `public/games/serpentina/fruits.png`. El atlas de `sprites.js` (`window.SPRITE_ATLAS`) se porta como constante tipada en `constants.ts` (sin `window`).
- Migración `supabase/migrations/<timestamp>_serpentina_playable.sql` (`update ... set playable = true where id = 'serpentina'`), aplicada con el MCP + `get_advisors`.
- Estilos `.serpentina-canvas` en `app/globals.css` (diseñados con `/frontend-design`, tokens CRT existentes; la portada `.cover-snake` ya existe).
- Reglas:
  - Mundo lógico 800×600, rejilla 20×15 celdas de 40 px.
  - La serpiente (3 segmentos, avanzando a la derecha) se mueve celda a celda con paso fijo; la velocidad aumenta con la longitud (paso 140 ms → mínimo 70 ms, −5 ms cada 2 frutas).
  - Controles: `← ↑ → ↓` y `W A S D`. Giro de 180° prohibido; se admite una cola de hasta 2 giros por paso para no perder pulsaciones rápidas.
  - Una fruta a la vez, en celda libre y de tipo aleatorio del atlas (22 frutas). Comer: +10 puntos y crece 1 segmento.
  - Nivel = 1 + floor(frutas / 5) (solo informativo/HUD y velocidad).
  - Fin: chocar con pared o con el propio cuerpo → `onGameOver(score)` una sola vez. Si la serpiente llena toda la rejilla = victoria, también `onGameOver(score)`.
  - Cuerpo dibujado en neón verde (segmentos redondeados, cabeza con ojos); frutas con los sprites del atlas.

**No incluye:**

- Sonido, modos con muros/portales, power-ups, mando táctil, guardado de partida.
- Overlays de pausa/game over en canvas (los pinta `GamePlayer`).
- Anti-trampas ni cambios en `saveScore`, vistas o modal.
- Portar otros juegos.

## Modelo de datos

- Fila en `public.games`: `id = 'serpentina'` ya sembrada (`playable = false`, ARCADE, `cover-snake`, green); solo se actualiza el flag.
- HUD: `{ score, level }`. Puntuación máxima real = 297 frutas × 10, muy por debajo de 99.999.999.
- Sin cambios de esquema → no se regeneran tipos.

## Archivos

```
lib/games/serpentina/{types,constants,entities,engine}.ts   nuevo
components/games/SerpentinaCanvas.tsx                       nuevo
components/games/registry.tsx                               entrada nueva
app/globals.css                                             estilos SERPENTINA
public/games/serpentina/fruits.png                          asset
supabase/migrations/<timestamp>_serpentina_playable.sql     nuevo
specs/10-snake-serpentina.md                                este spec
CLAUDE.md                                                   juegos jugables / specs implementados
```

## Plan de implementación

1. Leer docs de Next 16.3.3 (Client Components, public assets).
2. Copiar `fruits.png` a `public/games/serpentina/`.
3. `types.ts` y `constants.ts` (rejilla, paleta, atlas tipado).
4. `entities.ts`: carga de imagen por instancia de motor, dibujo de serpiente y fruta.
5. `engine.ts`: bucle con `MAX_DT = 0.05`, acumulador de paso, `phase`, teclas en `start()`/`destroy()`, `onHud` solo al cambiar, pausa automática.
6. `SerpentinaCanvas.tsx`.
7. Registry + CSS con `/frontend-design`.
8. Migración `playable` + `get_advisors`.
9. Verificación y `npm run build` / `npm run lint`.

## Criterios de aceptación

- [ ] El juego no arranca hasta pulsar EMPEZAR/Espacio; pausa (P/Esc/botón y automática) y fin funcionan.
- [x] Movimiento por rejilla, giros sin reversa, crecimiento, +10 por fruta y aceleración funcionan; choque (pared/cuerpo) y victoria llaman a `onGameOver` una vez.
- [x] `onHud` solo al cambiar valores.
- [x] Sin `any`/`@ts-ignore`, sin globals mutables, sin acceso a DOM/`window`/`Image` en el cuerpo del módulo.
- [x] Sin rAF ni listeners residuales al salir de la página; canvas 4:3 nítido en HiDPI.
- [ ] Flechas y Espacio no hacen scroll ni activan botones durante la partida; teclas no quedan pegadas tras pausar.
- [x] `games.playable = true` para `serpentina` en el proyecto remoto; `get_advisors` sin avisos nuevos.
- [ ] Invitado: "INICIA SESIÓN PARA GUARDAR TU MARCA" → `/auth`. Con sesión: "PUNTUACIÓN GUARDADA" y aparece en `/juegos/serpentina` y `/salon?juego=serpentina`.
- [ ] ROCAS, CAÍDA, BLOQUE BUSTER y los simulados no cambian.
- [x] `npm run build` y `npm run lint` sin errores. (Consola del navegador sin errores: sin verificar, no había navegador disponible.)

## Decisiones tomadas y descartadas

- **Carpeta `lib/games/serpentina/`** (id del juego, no `snake`). _Descartado:_ `snake/`.
- **Diseño desde cero:** no existe juego vanilla de referencia, solo assets.
- **Solo `fruits.png` + atlas** (es lo único provisto); cuerpo y cabeza se dibujan en canvas con el estilo neón.
- **Paso fijo con acumulador** (no movimiento continuo) para mantener la lógica de rejilla determinista.
- **Cola de giros (máx. 2)** en vez de aplicar solo la última tecla, para que giros rápidos en U no se pierdan.

## Riesgos identificados

- StrictMode (doble montaje), Espacio compartido con la página, foco en botones, callbacks obsoletos, teclas pegadas al pausar.
- Carga asíncrona de `fruits.png` vs. `start()`/`destroy()`; el motor no avanza hasta que cargue (o dibuja fruta de respaldo si falla).
- Las frutas del atlas tienen anchos distintos (110–170 px): escalar preservando proporción dentro de la celda.
- Sin navegador (Playwright/Chrome DevTools MCP no conectaron): parte de la verificación en vivo podría quedar sin probar.
