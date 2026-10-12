# NN — <TÍTULO DEL JUEGO>: <resumen de una línea>

**Estado:** Borrador
**Depende de:** SPEC 05-asteroides-rocas, SPEC 06-leaderboard-tabla-juegos
**Fecha:** <YYYY-MM-DD>

**Objetivo:** <una frase: portar/crear <juego> como motor TS jugable en el CRT de `/juegos/<id>/jugar` y activar su leaderboard (`playable = true`).>

## Alcance

**Incluye:**

- Motor `lib/games/<slug>/` (types, constants, entities, engine) con contrato `{ start, pause, resume, reset, destroy }` y callbacks `onHud`/`onGameOver`.
- Componente `components/games/<Name>Canvas.tsx`.
- Entrada `<id>` en el registry de `GamePlayer` (controles, HUD, overlay de inicio).
- Migración `supabase/migrations/<timestamp>_<slug>_playable.sql` (`playable = true`; insert si el juego es nuevo), aplicada con el MCP de Supabase.
- Estilos del juego en `app/globals.css` (diseñados con `/frontend-design`).
- <Controles, reglas y puntuación del juego.>

**No incluye:**

- <Sonido / multijugador / anti-trampas / otros juegos…>

## Modelo de datos

- Fila en `public.games`: `id = '<id>'`, <ya sembrada | nueva con cat/cover/color/sort_order>.
- HUD: `{ score, <lives|level|lines> }`. Puntuación enviada: entero 0–99.999.999.

## Archivos

```
lib/games/<slug>/{types,constants,entities,engine}.ts   nuevo
components/games/<Name>Canvas.tsx                       nuevo
components/games/registry.tsx                           entrada nueva
app/globals.css                                         estilos del juego
public/games/<slug>/                                    assets (si aplica)
supabase/migrations/<timestamp>_<slug>_playable.sql     nuevo
```

## Plan de implementación

1. Documentación de Next 16.3.3 y lectura de la referencia (`references/started-games/<carpeta>` si existe).
2. (Si falta) refactor de `GamePlayer` a registry sin cambio de comportamiento.
3. Tipos y constantes.
4. Entidades.
5. Motor.
6. Componente canvas.
7. Integración en el registry + diseño (`/frontend-design`).
8. Migración `playable` + `get_advisors`.
9. Verificación manual (invitado, con sesión, detalle, Salón, simulados intactos) y `npm run build` / `npm run lint`.

## Criterios de aceptación

- [ ] El juego no arranca hasta pulsar EMPEZAR/Espacio; pausa (P/Esc/botón y automática) y fin funcionan.
- [ ] `onHud` solo al cambiar valores; `onGameOver` una vez.
- [ ] Sin `any`/`@ts-ignore`, sin globals mutables, sin acceso a DOM/`window` en el cuerpo del módulo.
- [ ] Sin rAF ni listeners residuales al salir de la página; canvas 4:3 nítido en HiDPI.
- [ ] `games.playable = true` para `<id>` en el proyecto remoto; `get_advisors` sin avisos nuevos.
- [ ] Invitado: "INICIA SESIÓN PARA GUARDAR TU MARCA" → `/auth`. Con sesión: se guarda y aparece en `/juegos/<id>` y `/salon?juego=<id>`.
- [ ] Los demás juegos simulados y ROCAS no cambian.
- [ ] `npm run build` y `npm run lint` sin errores; consola sin errores.

## Decisiones tomadas y descartadas

- **<Decisión>.** <Motivo>. _Descartado:_ <alternativa>.

## Riesgos identificados

- StrictMode (doble montaje), Espacio compartido con la página, foco en botones, callbacks obsoletos, rendimiento de `shadowBlur`, teclas pegadas al pausar.
- <Riesgos propios: assets, escalado de ratón, fidelidad al original…>
