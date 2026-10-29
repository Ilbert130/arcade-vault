# 14 — PERFORMANCE: aligerar los efectos de página bajo los juegos

**Estado:** Aprobado
**Depende de:** SPEC 12-controles-tactiles-movil, SPEC 13-gamepad-mk2 (y los juegos jugables: ROCAS, CAÍDA, BLOQUE BUSTER, SERPENTINA y RANARIA, esta última con `specs/15-ranaria-frogger.md`)
**Fecha:** 2026-10-27

**Objetivo:** Que los juegos jueguen a ≥55 fps estables en escritorio y móvil, eliminando el coste de repintado de los efectos de página (fondo animado, ruido SVG, scanlines con `mix-blend-mode`) que corren detrás del canvas mientras se juega, sin cambiar el aspecto del reproductor.

## Alcance

**Incluye:**

- **Línea base medida** antes de tocar nada: perfil con la pestaña Performance de Chrome DevTools (6 s de partida por juego, **en las 3 skins `clasico`, `neon` y `retro`**) en escritorio y con emulación móvil (CPU ×4 de throttling). Se anota en este spec (sección _Medición_): fps medios, frame time p95 y tiempo de Rasterize/Paint/Composite por frame.
- **Modo "reproductor"** para los efectos globales (`app/layout.tsx` pinta `.av-bg` y `.av-noise` en todas las páginas):
  - `GamePlayer` marca `document.documentElement` con `data-player` mientras está montado y lo quita al desmontar (cleanup del efecto).
  - En `app/globals.css`, bajo `html[data-player]`:
    - `.av-bg::before` (rejilla en perspectiva con `mask-image`): `animation: none`.
    - `.av-bg::after` (scanlines con `mix-blend-mode: overlay`) y `.av-noise` (ruido `feTurbulence` a pantalla completa): `display: none`.
  - `.crt-screen::after` (scanlines con `mix-blend-mode: multiply`): se sustituye por la misma trama en negro con alfa **sin** blend mode (visualmente equivalente, ya que multiplicar por negro con alfa = componer negro con alfa), en todas las páginas.
- **Auditoría del resto de capas del reproductor** con el perfil: `filter: drop-shadow` y animaciones (`pulse-led`, `blink`, `flicker`) dentro de `.av-player`, `.touch-pad` y `.crt`. Solo se cambian las que el perfil señale como coste real, manteniendo el aspecto (p. ej. `filter: drop-shadow` → `box-shadow`/`text-shadow` si es equivalente, o animar solo `opacity`/`transform`).
- **Menos estado de React y menos re-renders** en `GamePlayer.tsx` y en los Canvas de los juegos (regla: `useState` al mínimo, `useRef` siempre que el valor no deba provocar un render):
  - Los valores del HUD que cambian durante la partida (`score`, `lives`, `level`, `lines`) dejan de ser `useState`: se guardan en refs y se escriben directamente en el DOM (`ref.current.textContent`) desde `handleHud`, sin re-renderizar el reproductor entero. `scoreRef` ya existe y se reutiliza.
  - Se conserva `useState` solo para lo que cambia la estructura del árbol: `status` (overlays de inicio/pausa/fin y mando), `save` y `username`. `skin` ya va por `useSyncExternalStore` y no se toca.
  - Callbacks pasados a los Canvas (`onHud`, `onGameOver`) con identidad estable (`useCallback` o refs) para no re-ejecutar efectos ni re-renderizar hijos; los Canvas que aún no usen el patrón "callbacks en refs" de `RanariaCanvas.tsx` lo adoptan.
  - Se extrae el HUD a un componente que no se re-renderiza durante la partida (React.memo con refs/handle imperativo) si hace falta para que el DOM se actualice sin render.
  - Verificado con React DevTools Profiler (o `console.count` temporal): 0 renders de `GamePlayer` durante la partida salvo cambios de `status`.
- **Revisión de skins** (solo medir, auditar y registrar; el diseño de las skins no cambia):
  - Estado de partida: de los 5 juegos jugables, ROCAS, BLOQUE BUSTER, SERPENTINA y RANARIA tienen las 3 skins; **CAÍDA no tiene ninguna** (`lib/games/tetris/` sin `skins.ts`, `TetrisCanvas.tsx` sin prop `skin`; usa `GLOW` fijo en `engine.ts`). Se anota como hallazgo y se mide solo en su único aspecto; crear sus skins queda para `skin-designer` en otro spec.
  - Inventario del coste por skin con el perfil: `shadowBlur` de cada skin (`glow`, `hudGlow`, `fruitGlow`… en `skins.ts`; `neon` es la candidata a más coste, con glow 18–22), tinte/prerender por skin y capas CSS que dependen de la skin (`.touch-pad[data-skin]` con `--pad-glow` en `drop-shadow`, `.skin-switch`, `.skin-opt`, `.skin-led`).
  - Comprobar que `html[data-player]` y el CRT sin `mix-blend-mode` no alteran la lectura de las 3 skins (capturas antes/después por juego y skin).
  - Si el perfil señala que una skin (típicamente `neon`) incumple el presupuesto por su propio glow, **no se toca su aspecto en este spec**: se registra en _Riesgos_ con la cifra y se propone un spec aparte (límite de `shadowBlur`, glow cacheado en offscreen) para decidirlo con el usuario.
  - Cambiar de skin con `GamePlayer` montado sigue funcionando (`useSyncExternalStore` + `localStorage`) y no provoca más re-renders que los de la partida tras pasar el HUD a refs.
- **Reducir movimiento**: dentro de `html[data-player]` las animaciones decorativas respetan `prefers-reduced-motion` (ya existe un bloque a partir de la línea ~3761 de `globals.css`; se amplía, no se duplica).
- **Medición final** con el mismo procedimiento y comparación con la línea base, registrada en este spec.
- Actualizar `CLAUDE.md` (sección Styling) con la regla: los efectos globales pesados no corren bajo el reproductor (`html[data-player]`), y los nuevos efectos de página no deben usar `mix-blend-mode`, `backdrop-filter` ni animaciones de `background-position` a pantalla completa sin desactivarse allí.

**No incluye:**

- Cambios en los motores (`lib/games/*/engine.ts`, `draw.ts`, `entities.ts`): caché de fondo en canvas offscreen, límite de fps, pools de objetos o `dpr` acotado quedan para otro spec si la medición final no alcanza el objetivo.
- Cambiar el motor ni el contrato `onHud`/`onGameOver`: el HUD sigue emitiéndose igual; solo cambia cómo lo consume `GamePlayer`.
- Cambiar el diseño de las skins, crear las skins de CAÍDA, cambiar el glow del canvas (`shadowBlur`), reglas, puntuación, `saveScore` o Supabase.
- Rediseñar el CRT, el mando MK-II o el fondo de las demás páginas (siguen igual fuera del reproductor).
- Contador de FPS en pantalla ni herramientas de telemetría en producción.
- Optimizar otras páginas (Home, Biblioteca, Salón) más allá de la sustitución del `mix-blend-mode` del CRT.

## Modelo de datos

Sin cambios en base de datos, tipos ni contratos. Único cambio de "estado": un atributo de documento.

```html
<!-- Mientras GamePlayer está montado -->
<html data-player>
  …
</html>
```

```ts
// components/GamePlayer.tsx (esquema)
useEffect(() => {
  const root = document.documentElement;
  root.dataset.player = "";
  return () => {
    delete root.dataset.player;
  };
}, []);
```

## Archivos

```
components/GamePlayer.tsx     efecto html[data-player]; HUD en refs + escritura directa al DOM; callbacks estables
components/games/*Canvas.tsx  callbacks en refs (patrón de RanariaCanvas) donde falte
app/globals.css               reglas html[data-player]; scanlines del CRT sin blend mode; ajustes puntuales del perfil (incl. capas CSS por skin)
lib/games/*/skins.ts          solo lectura: inventario de glow por skin (sin cambios)
CLAUDE.md                     regla de efectos globales en la sección Styling
specs/14-performance-efectos-crt.md   este spec (con la tabla de medición)
```

## Plan de implementación

1. **Línea base.** Con `npm run dev` y Chrome DevTools (Performance, 6 s de partida por juego; escritorio y emulación móvil con CPU ×4), medir los 5 juegos en las 3 skins (CAÍDA solo en su aspecto único, sin skins). Anotar fps medios, frame time p95 y desglose Rasterize/Paint/Composite en la sección _Medición_ de este spec. Hacer capturas de referencia de cada juego y skin para la comparación visual e inventariar el `shadowBlur`/glow de cada skin en la sección _Skins_. Identificar en el perfil las capas que más cuestan (confirmar o descartar la hipótesis de las capas de página).
2. **Modo reproductor.** Añadir en `GamePlayer.tsx` el efecto de `data-player` y las reglas `html[data-player]` en `globals.css` (rejilla sin animar, ruido y scanlines globales ocultos). Comprobar que el reproductor se ve igual salvo por la rejilla quieta y la ausencia del ruido tenue.
3. **Scanlines del CRT sin blend mode.** Reemplazar `mix-blend-mode: multiply` de `.crt-screen::after` por la misma trama en negro con alfa. Comparar capturas antes/después: sin diferencia perceptible.
4. **Segunda ronda con el perfil.** Medir otra vez; si el perfil sigue señalando `drop-shadow`, animaciones o sombras grandes dentro de `.crt` / `.touch-pad`, aplicar los cambios equivalentes mínimos (ver Alcance). Si no, no tocar. Incluye las capas CSS por skin (`.touch-pad[data-skin]`, `--pad-glow`); el aspecto de las skins no se modifica.
5. **Menos estado y re-renders.** Pasar `score`/`lives`/`level`/`lines` de `GamePlayer` a refs con escritura directa al DOM, estabilizar los callbacks hacia los Canvas, y confirmar con el Profiler que no hay renders durante la partida. La puntuación final para `saveScore` sigue saliendo de `scoreRef`. Comprobar a mano: HUD correcto al empezar, al puntuar, al reiniciar ("JUGAR DE NUEVO") y en el modal de fin.
6. **Reducir movimiento.** Ampliar el bloque `prefers-reduced-motion` para las animaciones decorativas dentro del reproductor.
7. **Medición final** con el mismo procedimiento (3 skins por juego, comparación de capturas y cambio de skin en caliente); rellenar la columna "Después" y comprobar el presupuesto. Si RANARIA o algún juego sigue por debajo, anotarlo en _Riesgos_ y proponer el spec de motores o de glow de skins (fuera de este alcance).
8. **Docs y verificación.** Actualizar `CLAUDE.md` (incluida la regla de refs sobre `useState`). Ejecutar `npm run lint` y `npm run build`; revisar la consola del navegador; navegar a otras páginas desde el reproductor para comprobar que `data-player` se retira y el fondo animado vuelve.

## Criterios de aceptación

- [ ] La sección _Medición_ contiene la línea base y el resultado final de los 5 juegos (fps medios, frame time p95, desglose Rasterize/Paint/Composite) en escritorio y emulación móvil con CPU ×4.
- [ ] En escritorio, los 5 juegos en `clasico` y `retro` mantienen ≥55 fps de media y frame time p95 ≤ 20 ms durante 6 s de partida.
- [ ] En emulación móvil (CPU ×4), los 5 juegos mantienen ≥45 fps de media, y cada juego mejora respecto a su línea base.
- [ ] Cada juego con skin `neon` mantiene ≥45 fps de media en escritorio. Si alguno no llega por su propio glow, se registra en _Riesgos_ con la cifra (sin tocar su aspecto) y no bloquea el cierre del spec.
- [ ] La sección _Skins_ lista, por juego, las skins disponibles, el glow de cada una y las capturas antes/después; CAÍDA figura como "sin skins".
- [ ] Cambiar de skin con el reproductor montado funciona en los juegos con skins y no añade renders de `GamePlayer`.
- [ ] El tiempo de Paint+Rasterize por frame durante la partida baja de forma medible respecto a la línea base (el valor figura en la tabla).
- [ ] Mientras `GamePlayer` está montado, `document.documentElement` tiene `data-player`; al navegar a otra página el atributo desaparece y el fondo animado de las demás páginas se ve igual que antes.
- [ ] Bajo el reproductor no hay animación en `.av-bg::before` ni se renderizan `.av-noise` ni `.av-bg::after`; `.crt-screen::after` ya no usa `mix-blend-mode` (verificado con `getComputedStyle`).
- [ ] La comparación visual del CRT (capturas antes/después de cada juego en `clasico`, `neon` y `retro`) no muestra diferencias perceptibles en las scanlines.
- [ ] Gameplay, aspecto de las skins, mando táctil, puntuación y guardado de puntuación se comportan igual que antes en los 5 juegos.
- [ ] `npm run lint` y `npm run build` sin errores; consola del navegador sin errores.
- [ ] Durante una partida (sin cambios de `status`) `GamePlayer` no se re-renderiza: el Profiler de React muestra 0 renders del reproductor y de los Canvas mientras puntúa.
- [ ] `GamePlayer` ya no tiene `useState` para `score`, `lives`, `level` ni `lines`; el HUD se actualiza igualmente al puntuar, al reiniciar y en el modal de fin, y `saveScore` recibe la puntuación final correcta.
- [ ] `CLAUDE.md` documenta la regla de efectos globales, `html[data-player]` y la preferencia por refs sobre `useState` para valores que cambian por frame/jugada.

## Medición

Se rellena durante la implementación (pasos 1 y 7). Perfil de 6 s por juego y skin; cada celda es `antes → después`.

| Juego         | Skin      | Entorno      | fps medios  | frame p95 ms | Paint+Raster ms/frame | GPU ms/frame  |
| ------------- | --------- | ------------ | ----------- | ------------ | --------------------- | ------------- |
| ROCAS         | `clasico` | escritorio   | 56.4 → 59.9 | 33.2 → 16.8  | 0.62 → 0              | 12.49 → 5.71  |
| ROCAS         | `neon`    | escritorio   | 54.8 → 59.9 | 33.4 → 16.9  | 0.68 → 0              | 14.29 → 3.45  |
| ROCAS         | `retro`   | escritorio   | 59.9 → 59.9 | 16.9 → 16.9  | 0.6 → 0               | 8.49 → 1.66   |
| CAÍDA         | única*    | escritorio   | 59.6 → 59.9 | 16.8 → 16.9  | 0.68 → 0.02           | 10.15 → 1.19  |
| BLOQUE BUSTER | `clasico` | escritorio   | 58.3 → 59.9 | 16.9 → 16.8  | 0.68 → 0.02           | 10.37 → 0.97  |
| BLOQUE BUSTER | `neon`    | escritorio   | 59.9 → 59.9 | 16.8 → 16.8  | 0.69 → 0.02           | 9.45 → 2.18   |
| BLOQUE BUSTER | `retro`   | escritorio   | 57.6 → 59.9 | 16.9 → 16.8  | 0.81 → 0.03           | 11.37 → 1.11  |
| SERPENTINA    | `clasico` | escritorio   | 59.8 → 59.9 | 16.8 → 16.9  | 0.61 → 0              | 7.14 → 0.01   |
| SERPENTINA    | `neon`    | escritorio   | 59.8 → 59.9 | 16.9 → 16.8  | 0.6 → 0               | 7.44 → 0.01   |
| SERPENTINA    | `retro`   | escritorio   | 59.9 → 59.9 | 16.8 → 16.9  | 0.6 → 0               | 7.76 → 0.01   |
| RANARIA       | `clasico` | escritorio   | 52.1 → 59.9 | 33.4 → 16.9  | 0.8 → 0.01            | 14.43 → 1.77  |
| RANARIA       | `neon`    | escritorio   | 38.6 → 44.2 | 50.1 → 33.5  | 0.7 → 0.02            | 18.59 → 11.3  |
| RANARIA       | `retro`   | escritorio   | 58.8 → 59.9 | 16.8 → 16.8  | 0.62 → 0.01           | 10.3 → 5.01   |
| ROCAS         | `clasico` | móvil CPU ×4 | 59.6 → 59.9 | 16.8 → 16.8  | 2.15 → 0.03           | 10.23 → 5.67  |
| ROCAS         | `neon`    | móvil CPU ×4 | 55.3 → 59.8 | 33.3 → 16.8  | 2.12 → 0              | 13.65 → 8.32  |
| CAÍDA         | única*    | móvil CPU ×4 | 52.1 → 59.8 | 33.4 → 16.8  | 2.08 → 0.07           | 5.53 → 1.25   |
| BLOQUE BUSTER | `clasico` | móvil CPU ×4 | 55.9 → 58.3 | 16.8 → 16.8  | 1.93 → 0.07           | 5.66 → 0.82   |
| BLOQUE BUSTER | `neon`    | móvil CPU ×4 | 55.4 → 59.4 | 16.9 → 16.8  | 2.07 → 0.07           | 9.3 → 3.65    |
| SERPENTINA    | `clasico` | móvil CPU ×4 | 59.9 → 59.9 | 16.8 → 16.8  | 1.85 → 0              | 4.79 → 0      |
| SERPENTINA    | `neon`    | móvil CPU ×4 | 59.9 → 59.9 | 16.8 → 16.8  | 1.76 → 0              | 4 → 0         |
| RANARIA       | `clasico` | móvil CPU ×4 | 56.9 → 57.8 | 16.8 → 16.8  | 1.86 → 0.06           | 9 → 4.79      |
| RANARIA       | `neon`    | móvil CPU ×4 | 17.4 → 14.7 | 83.4 → 83.5  | 1.9 → 0.07            | 54.36 → 66.29 |

\* CAÍDA no tiene skins: se mide su único aspecto (las filas `neon`/`retro` medidas son idénticas dentro del ruido y se omiten).

### Línea base (paso 1) — método y hallazgos

- **Método:** script Playwright (`playwright-core` + Chrome estable, ventana en primer plano) contra `npm run dev`; 6 s de partida con teclas pulsadas, tras 2 s de calentamiento. Traza CDP (`devtools.timeline`, `cc`, `gpu`): fps y p95 de `requestAnimationFrame`; Paint+Raster = (`Paint` + `RasterTask`) / frames; GPU = `GPUTask` / frames. Escritorio 1366×768 dpr 1; móvil 412×915 dpr 2 con táctil y `Emulation.setCPUThrottlingRate` ×4. La CPU ×4 solo afecta al hilo principal, no a la GPU. El script vive fuera del repo.
- **Paint+Raster del hilo principal es despreciable** (≈0.6–0.8 ms escritorio, ≈2 ms móvil). El coste está en la **GPU**: 7–14 ms/frame en escritorio con `clasico`, lo bastante para perder el vsync (p95 33 ms en ROCAS y RANARIA).
- **Hipótesis de las capas de página: confirmada.** Diagnóstico sin tocar el repo (CSS inyectado: `.av-bg::before` sin animación, `.av-bg::after` y `.av-noise` ocultos, `.crt-screen::after` sin blend): ROCAS `clasico` 56.4 → 59.9 fps, p95 33.2 → 16.9 ms, GPU 12.5 → 3.9 ms; ROCAS `neon` GPU 14.3 → 4.8 ms; RANARIA `clasico` 52.1 → 59.9 fps, GPU 14.4 → 4.8 ms. Los números "después" definitivos se miden en el paso 7 con la implementación real.
- **Hallazgo de skins: RANARIA `neon` no lo arreglan las capas de página.** Con el diagnóstico sigue en 42.8 fps (GPU 12.2 ms) en escritorio y 12.5 fps en móvil CPU ×4 (línea base: 38.6 y 17.4 fps). Es el `shadowBlur` 18 por entidad de la skin. Cae en el riesgo ya previsto: se registrará y se propondrá un spec de glow, sin cambiar el aspecto aquí.
- Las demás skins `neon` (ROCAS, BLOQUE BUSTER, SERPENTINA) y todas las `retro` están en 55–60 fps en la línea base. Las medidas son de `dev`; tienen ruido de ±2 fps entre ejecuciones.

### Segunda ronda (paso 4) — con los pasos 2 y 3 aplicados

- **Móvil CPU ×4** (fps / p95 ms, `clasico` y `neon`): ROCAS 59.9 / 16.8 y 59.8 / 16.8; CAÍDA 49.8 / 33.3 y 51.8 / 33.3; BLOQUE BUSTER 53.8 / 16.9 y 55.1 / 16.9; SERPENTINA 59.9 / 16.8 y 59.8 / 16.8; RANARIA 56.3 / 16.8 y **12.3 / 133**. Todos cumplen ≥45 fps salvo RANARIA `neon` (glow de la skin).
- **Prueba de descarte:** con CSS inyectado que anula `filter`, `animation`, `box-shadow` y `text-shadow` dentro de `.av-player`, `.touch-pad` y `.crt`, CAÍDA, BLOQUE BUSTER y RANARIA `clasico` no cambian (49.9 / 55.4 / 56.4 fps; GPU idéntica). El perfil no señala `drop-shadow` ni `pulse-led`/`blink`/`flicker` como coste real, así que **no se modifica ningún estilo** (regla del paso 4). RANARIA `neon` sube de 12 a 23 fps con la prueba, sigue lejos del objetivo y dentro del ruido de su glow; no se actúa.
- **Pistas para el paso 5:** en móvil, CAÍDA y BLOQUE BUSTER muestran frames largos puntuales (máx. 117–167 ms) y mucho tiempo de script en el hilo principal (CAÍDA ≈8.5 ms/frame con CPU ×4), compatible con los re-renders de React por el HUD. Se vuelve a medir tras el paso 5.

### Medición final (paso 7)

- **Escritorio, 15 combinaciones juego/skin:** 14 de 15 en 59.9 fps con p95 16.8–16.9 ms (antes 52–60 fps, p95 hasta 33 ms). GPU por frame baja de 7–14 ms a 0–6 ms. Paint+Raster del hilo principal pasa de ≈0.6–0.8 ms a ≈0–0.03 ms.
- **Móvil CPU ×4 (`clasico` y `neon`):** todos a 58–60 fps con p95 16.8 ms, salvo RANARIA `neon`. CAÍDA pasa de 52.1 a 59.8 fps y de p95 33.4 a 16.8 ms gracias al paso 5 (HUD sin re-renders); BLOQUE BUSTER de 55.9 a 58.3.
- **Excepción: RANARIA `neon`.** Escritorio 38.6 → 44.2 fps (p95 50.1 → 33.5 ms), 0.8 fps por debajo del objetivo de 45; móvil 17.4 → 14.7 fps, sin mejora (dentro del ruido). La GPU sigue en 11 ms (escritorio) y 66 ms (móvil) por frame, así que el cuello de botella es el `shadowBlur` 18 de la skin, no las capas de página. Se registra en _Riesgos_ y no bloquea el cierre.
- **Comparación visual del CRT:** sin diferencias perceptibles. Capturas antes/después de ROCAS `neon` y SERPENTINA `retro` revisadas a ojo (misma trama, bisel y HUD), y diferencia de píxeles de las scanlines con `multiply` vs. `normal` sobre fondo colorido ≤ 1/255 (el CSS del CRT es común a las 3 skins). No se revisaron a ojo las 15 parejas: el estado de la partida difiere entre capturas.
- **Salvedades:** mediciones en `npm run dev`, ruido ≈ ±2 fps, la CPU ×4 solo afecta al hilo principal, no a la GPU. Se recomienda una prueba manual en un móvil real antes de cerrar el spec.

## Skins

Inventario en el paso 1 y verificación visual en el paso 7. Fuentes: `lib/games/*/skins.ts` y `.claude/agent-memory/skin-designer/MEMORY.md`.

| Juego         | Skins                | Glow (`clasico` / `neon` / `retro`) | Capturas antes/después               |
| ------------- | -------------------- | ----------------------------------- | ------------------------------------ |
| ROCAS         | clasico, neon, retro | 10 / 22 / 0                         | sin diferencias (ver medición final) |
| CAÍDA         | **ninguna**          | 8 fijo (`GLOW`, `constants.ts`)     | sin diferencias (ver medición final) |
| BLOQUE BUSTER | clasico, neon, retro | 0 / 20 / 0                          | sin diferencias (ver medición final) |
| SERPENTINA    | clasico, neon, retro | 12 / 26 / 0                         | sin diferencias (ver medición final) |
| RANARIA       | clasico, neon, retro | 0 / 18 / 0                          | sin diferencias (ver medición final) |

Glow confirmado leyendo cada `skins.ts` (paso 1).

## Hallazgos y soluciones aplicadas (registro de la implementación)

Resumen para consultas futuras. Los números están en _Medición_; aquí queda el porqué y el qué se hizo.

### Hallazgos

1. **El cuello de botella era la GPU, no el hilo principal.** Paint+Raster costaba ≈0.6–0.8 ms/frame (≈2 ms en móvil CPU ×4), pero la GPU gastaba 7–14 ms/frame bajo un canvas 2D sencillo, suficiente para perder el vsync (p95 33 ms, 52–56 fps en ROCAS y RANARIA). Mirar solo Paint/Raster habría descartado la hipótesis equivocadamente.
2. **Las capas de página a pantalla completa eran la causa compartida.** Con solo apagarlas, ROCAS `clasico` pasó de 56.4 a 59.9 fps y de 12.5 a 3.9 ms de GPU. Las culpables eran la rejilla `.av-bg::before` (animación de `background-position` bajo `mask-image` y `perspective`), las scanlines `.av-bg::after` (`mix-blend-mode: overlay`), el ruido SVG `feTurbulence` de `.av-noise` a pantalla completa y las scanlines del CRT con `mix-blend-mode: multiply`.
3. **`filter: drop-shadow`, `box-shadow` y las animaciones del reproductor no eran coste real.** Anularlos todos dentro de `.av-player`, `.touch-pad` y `.crt` no cambió ni los fps ni la GPU en CAÍDA, BLOQUE BUSTER y RANARIA `clasico`. Por la regla del paso 4 no se modificó ningún estilo.
4. **El HUD en `useState` causaba frames largos y trabajo de script en móvil.** `handleHud` llamaba a 4 `setState` por emisión y re-renderizaba `GamePlayer` entero (CRT, mando, SkinSwitch). En móvil CPU ×4, CAÍDA tenía ≈8.5 ms/frame de script y picos de 117–167 ms; tras el paso 5 pasó a ≈5.7 ms, 52.1 → 59.8 fps y p95 33.4 → 16.8 ms.
5. **Los 5 Canvas ya usaban el patrón "callbacks en refs".** No hizo falta tocarlos; solo estabilizar la identidad de `handleHud`/`handleGameOver` en `GamePlayer`.
6. **RANARIA `neon` tiene un coste propio que las capas de página no arreglan.** `shadowBlur` 18 por entidad: GPU 11 ms (escritorio) y 66 ms (móvil CPU ×4) por frame. 38.6 → 44.2 fps en escritorio y 17.4 → 14.7 fps en móvil. Se confirmó también con `next start` (producción): 42.6 fps escritorio y 14.9 móvil, igual que en `dev`. Sin cambiar el diseño de la skin no se puede cerrar; queda para un spec aparte.
7. **CAÍDA no tiene skins** (sin `skins.ts`, `TetrisCanvas.tsx` sin prop `skin`, `GLOW = 8` fijo en `lib/games/tetris/constants.ts`). Las otras skins `neon` tienen glow 20–26 y cumplen en escritorio; solo RANARIA `neon` incumple.
8. **El entorno de medición condiciona el método.** El MCP de Chrome DevTools no conectó. La extensión Claude-in-Chrome da fps inservibles (la pestaña que controla queda limitada a ~1–4 fps y el renderer llega a bloquearse), por lo que no sirve para medir rendimiento. Lo que funcionó fue un script Playwright (`playwright-core`) lanzando Chrome estable propio, en primer plano, con traza CDP.

### Soluciones aplicadas

| #   | Cambio                                                                                                                                                                                                                                                                                                                                                                | Dónde                                                     | Efecto                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | `useEffect` que pone `document.documentElement.dataset.player = ""` y lo borra en el cleanup                                                                                                                                                                                                                                                                          | `components/GamePlayer.tsx`                               | Modo reproductor; el atributo desaparece al navegar (verificado en `/biblioteca`)                         |
| 2   | `html[data-player] .av-bg::before { animation: none }` y `html[data-player] .av-bg::after, html[data-player] .av-noise { display: none }`                                                                                                                                                                                                                             | `app/globals.css`, antes de `/* ===== app frame ===== */` | Sin rejilla animada, sin scanlines globales ni ruido bajo el reproductor; el resto de páginas queda igual |
| 3   | Quitado `mix-blend-mode: multiply` de `.crt-screen::after` (la trama ya era negro con alfa)                                                                                                                                                                                                                                                                           | `app/globals.css`                                         | Equivalente visual (diferencia ≤ 1/255); aplica en todas las páginas                                      |
| 4   | Sin cambios (el perfil no señaló `drop-shadow` ni animaciones)                                                                                                                                                                                                                                                                                                        | —                                                         | Evita cambios cosméticos sin respaldo                                                                     |
| 5   | HUD en refs (`scoreRef`, `levelRef`, `scoreEl`, `livesEl`, `linesEl`, `levelEl`) y `paintHud` que escribe `textContent` solo si cambia; `useState` queda para `status`, `save` y `username`; `handleHud` y `handleGameOver` con `useCallback`; `restart` repinta el HUD; `submitScore` usa `scoreRef.current`; el modal pinta la puntuación final con un callback ref | `components/GamePlayer.tsx`                               | 0 renders de `GamePlayer` durante la partida (1 commit por el cambio de `status` a `over`)                |
| 6   | Ampliado el bloque `prefers-reduced-motion` existente con `html[data-player] .game-arena .grid-floor/.player-ship/.enemy { animation: none }` y `html[data-player] .toast-saved { animation: none; width: auto }`                                                                                                                                                     | `app/globals.css`, al final del bloque del mando          | Las animaciones decorativas del reproductor quedan quietas; el aviso de guardado se ve completo           |
| 8   | Sección **Performance (spec 14)** en Styling                                                                                                                                                                                                                                                                                                                          | `CLAUDE.md`                                               | Regla para futuros efectos y para refs sobre `useState`                                                   |

Detalles de implementación que conviene recordar:

- **El HUD se pinta con un valor inicial en el JSX** (`fmtScore(0)`, `fmtLives(START_LIVES)`, `fmtLevel(1)`). Como esos children nunca cambian en el árbol virtual, React no vuelve a tocar el DOM tras un re-render por `status` y el valor escrito por `paintHud` se conserva.
- **El modal de fin no lee `scoreRef` durante el render** (lo impide la regla `react-hooks/refs`): usa `ref={(el) => { if (el) el.textContent = fmtScore(scoreRef.current) }}`.
- **React Compiler está activo.** Obligó a declarar `setStatus` en las dependencias de `handleGameOver` (`[paintHud, setStatus]`) para preservar la memoización manual.
- **`data-player` se pone en un efecto de cliente**, no en el render, y `<html>` ya usa `suppressHydrationWarning`: sin aviso de hidratación.

### Cómo repetir la medición

1. `npm run dev` (o `npm run build && npx next start -p 3001` para producción).
2. Script `playwright-core` (instalado fuera del repo) que, por juego y skin: fija la skin con `addInitScript` (`localStorage["av-skin:<id>"]`), abre `/juegos/<id>/jugar` con Chrome estable (`headless: false`, `bringToFront`), pulsa EMPEZAR y espera 2 s.
3. Durante 6 s pulsa teclas (flechas y Espacio) mientras muestrea `requestAnimationFrame` (fps = 1000 / media, p95 de los intervalos) y graba una traza (`browser.startTracing` con `devtools.timeline`, `disabled-by-default-devtools.timeline`, `cc`, `gpu`). Paint+Raster = (`Paint` + `RasterTask`) / frames; GPU = `GPUTask` / frames.
4. Escritorio: 1366×768, dpr 1. Móvil: 412×915, dpr 2, `isMobile`, `hasTouch` y `Emulation.setCPUThrottlingRate` ×4.
5. Para el diagnóstico de capas: inyectar con `addStyleTag` el CSS a probar y comparar. Para el conteo de renders: `addInitScript` con un `__REACT_DEVTOOLS_GLOBAL_HOOK__` mínimo cuyo `onCommitFiberRoot` incrementa un contador.
6. Ruido esperable ≈ ±2 fps entre ejecuciones; las cifras de `dev` y producción coinciden.

### Estado respecto a los criterios de aceptación

- **Cumplidos:** medición completa; escritorio ≥55 fps y p95 ≤ 20 ms en las 3 skins de ROCAS, BLOQUE BUSTER, SERPENTINA y RANARIA `clasico`/`retro`, y en CAÍDA; móvil ≥45 fps y mejora en todos salvo RANARIA `neon`; Paint+Raster baja; `data-player` aparece y se retira; sin animación en `.av-bg::before`, sin `.av-noise` ni `.av-bg::after`, y `.crt-screen::after` sin blend (verificado con `getComputedStyle`); 0 renders durante la partida; HUD correcto al empezar, al puntuar, al reiniciar y en el modal; lint y build sin errores; consola sin errores; `CLAUDE.md` actualizado.
- **Con excepción registrada:** RANARIA `neon` (44.2 fps en escritorio, 14.7 en móvil), ver _Riesgos_.
- **Verificados solo en parte:** comparación visual de scanlines (diff de píxeles y 2 capturas a ojo, no las 15 parejas); cambio de skin en caliente (la skin se lee por `useSyncExternalStore`, sin tocar; no se midió explícitamente el contador de commits al cambiarla); el guardado de puntuación con sesión iniciada y el mando táctil en un dispositivo real no se probaron.

### Seguimiento recomendado (fuera de este spec)

1. **Spec de glow de skins** para RANARIA `neon` (y vigilar las demás `neon`): límite de `shadowBlur`, o glow prerenderizado en un canvas offscreen, decidiendo con el usuario cuánto aspecto se puede ceder.
2. **Skins de CAÍDA** con `skin-designer` (`clasico`, `neon`, `retro`).
3. **Prueba manual en un móvil real** y con sesión iniciada (guardado de puntuación).
4. Si se quiere reutilizar la medición, guardar el script de Playwright en el repo (p. ej. `scripts/perf/`) en lugar de la carpeta temporal.

## Decisiones tomadas y descartadas

- **Sí: `useRef` + escritura directa al DOM para el HUD; `useState` solo para lo que cambia la estructura (`status`, `save`, `username`).** Petición del usuario: minimizar estado y evitar re-renders. El HUD cambia con cada punto y re-renderizar todo el reproductor (CRT, mando, SkinSwitch) en cada cambio es trabajo inútil junto a un canvas a 60 fps. **No:** `useState` para todo "por comodidad" ni mover el HUD al canvas (cambiaría el diseño).
- **Sí: atacar primero los efectos de página, no los motores.** El usuario acotó el alcance a efectos CRT/fondo, y el síntoma aparece en todos los juegos (y en escritorio y móvil), lo que apunta a una causa compartida fuera de cada motor. **No:** optimizar cada motor ahora; es más trabajo y riesgo sobre el gameplay, y solo se justifica si la medición final no alcanza el presupuesto.
- **Sí: medir antes y después con DevTools Performance y un presupuesto numérico.** Evita declarar "más fluido" por impresión. **No:** contador de FPS en pantalla ni telemetría (más código en producción por un problema puntual).
- **Sí: `html[data-player]` en lugar de condicionar `layout.tsx`.** `layout.tsx` es Server Component y compartido; el atributo permite apagar capas desde CSS sin mover componentes ni recrear el árbol. **No:** retirar `.av-bg` / `.av-noise` del DOM en el reproductor (obligaría a un layout anidado o a estado cliente global).
- **Sí: quitar el fondo animado y el ruido bajo el reproductor.** Quedan tapados por el CRT y el resto de la página casi no se ve; el jugador no los echa de menos. **No:** mantenerlos animados "porque es el look del portal" fuera de un sitio donde compiten con el canvas por la GPU.
- **Sí: scanlines del CRT con alfa normal en lugar de `multiply`.** Es equivalente visualmente (el color es negro) y evita un blend con lo que hay debajo en cada frame. Se aplica en todas las páginas porque no cambia el aspecto.
- **Sí: incluir las skins en la medición y la revisión, sin cambiar su diseño.** Petición del usuario. La `neon` usa `shadowBlur` alto, un coste propio de la skin que se mide contra el de las capas de página. Se audita y se registra; si una skin incumple por su glow, se decide en otro spec. **No:** recortar el glow de `neon` aquí (cambia el diseño aprobado) ni crear las skins de CAÍDA (trabajo de `skin-designer`).
- **Sí: tocar `filter: drop-shadow` y animaciones solo si el perfil lo respalda.** Evita cambios cosméticos innecesarios. **No:** retirar glow del canvas (`shadowBlur`) ni cambiar skins: cambiaría el diseño y está fuera del alcance acordado.
- **Sí: objetivos distintos para escritorio (≥55 fps) y móvil con CPU ×4 (≥45 fps).** Realistas para un canvas 2D con CRT; el emulador de CPU no es un dispositivo real.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                   | Mitigación                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La hipótesis es errónea y las capas de página no son el cuello de botella (el coste está en el motor)                                                                                                    | La línea base y el desglose del perfil lo confirman o descartan en el paso 1; si se descarta, se detiene y se abre un spec de motores.                                                      |
| El atributo `data-player` queda puesto al salir del reproductor (fondo sin animar en otras páginas)                                                                                                      | Cleanup del efecto; criterio de aceptación que navega fuera del reproductor y verifica que el atributo desaparece.                                                                          |
| Cambio visible en las scanlines del CRT al quitar `multiply`                                                                                                                                             | Comparación de capturas en las 3 skins antes de dar el paso por bueno.                                                                                                                      |
| La skin `neon` incumple el presupuesto por su propio `shadowBlur`, no por las capas de página. **Materializado en RANARIA `neon`:** 44.2 fps en escritorio y 14.7 fps en móvil CPU ×4 tras los pasos 2–6 | Cifra registrada en _Medición_. No se toca el aspecto; se propone un spec de glow (límite de `shadowBlur`, glow cacheado en offscreen) para decidirlo con el usuario. No bloquea el cierre. |
| CAÍDA no tiene skins, así que la comparativa por skin queda incompleta                                                                                                                                   | Se mide su único aspecto y se anota como hallazgo; las skins de CAÍDA las crea `skin-designer` en otro spec.                                                                                |
| Medir en emulación (CPU ×4) no refleja un móvil real                                                                                                                                                     | Se documenta como aproximación; se recomienda una prueba manual en un móvil real antes de cerrar el spec.                                                                                   |
| El MCP de Chrome DevTools no conecta y no se puede perfilar desde la sesión                                                                                                                              | Perfilar manualmente en el navegador y copiar las cifras a la sección _Medición_.                                                                                                           |
| `html[data-player]` provoca un aviso de hidratación                                                                                                                                                      | El atributo se pone en un efecto de cliente (no en el render) y `<html>` ya usa `suppressHydrationWarning`.                                                                                 |

## Lo que **no** entra en este spec

- Optimización de los motores (fondo estático cacheado en offscreen canvas, límite de fps, pools de objetos, `dpr` acotado).
- ~~Reducción de re-renders de React por la emisión del HUD.~~ (Sí entró: se incorporó al alcance durante la aprobación; ver paso 5.)
- Cambios de glow, diseño de skins (incluidas las skins de CAÍDA) o diseño del CRT/mando.
- Contador de FPS o telemetría de rendimiento.
- Optimización de Home, Biblioteca, Salón y demás páginas.

Cada uno de esos, si hace falta, va en su propio spec.
