# 01 — Home (landing) y Nav

**Estado:** Approved
**Depende de:** Ninguno
**Fecha:** 2026-09-17

**Objetivo:** Implementar la página de inicio (landing) y la barra de navegación de Arcade Vault en Next.js, replicando el diseño visual del template en `references/templates/home-about/` (home.jsx, nav.jsx, styles.css).

## Alcance

**Incluye:**
- Componente `Nav` (barra superior + menú móvil hamburguesa) portado de `nav.jsx`.
- Página de inicio (`/`) con las 7 secciones de `home.jsx`: Hero (con siluetas flotantes), "Por qué Arcade Vault", vista previa de juegos, estadísticas, actividad en vivo (ticker + top jugadores), precios y CTA final.
- Animación de aparición por scroll (`.reveal` → `.in` vía `IntersectionObserver`).
- Fuentes "Press Start 2P" (pixel) y "JetBrains Mono" cargadas con `next/font/google`.
- Portado del CSS del template (`styles.css`) a los estilos globales del proyecto, preservando el diseño exacto (colores, grid de fondo animado, scanlines, clases de componentes).
- Datos mock tipados (juegos destacados, actividad reciente, top jugadores) en un archivo local.
- Rutas placeholder mínimas ("Próximamente") para los destinos del Nav que aún no existen: `/biblioteca`, `/salon`, `/about`, `/auth`.
- El Nav siempre se muestra en estado "sin sesión" (botón "Iniciar Sesión" → `/auth`).
- Las tarjetas de juego (MiniCard) y los CTA de "explorar juegos" navegan a `/biblioteca`.

**No incluye (fuera de alcance de este spec):**
- La página "Acerca de" (`about.jsx`) y su formulario de contacto — spec aparte.
- Sistema de autenticación real (login/registro, sesión persistida).
- Biblioteca de juegos real, vista de detalle de un juego, o cualquier juego jugable.
- Salón de la fama / ranking real con datos en vivo o backend.
- Persistencia de cualquier tipo (no hay base de datos ni API en este spec; todo es presentacional con datos mock estáticos).

## Modelo de datos

Archivo `lib/mock-data.ts` con datos mock tipados, sin persistencia (solo se usan para renderizar la UI):

```ts
export type Game = {
  id: string;
  title: string;
  cat: string;
  cover: string; // clase CSS para el fondo de portada
};

export type ActivityEntry = {
  player: string;
  game: string;
  score: number;
  time: string;
  color: "cyan" | "magenta" | "yellow" | "green";
};

export type TopPlayer = {
  rank: number;
  player: string;
  score: number;
};

export const GAMES: Game[];
export const ACTIVITY: ActivityEntry[];
export const TOP_PLAYERS: TopPlayer[];
```

## Plan de implementación

1. **Fuentes.** En `app/layout.tsx`, cargar `Press Start 2P` y `JetBrains Mono` con `next/font/google`, exponerlas como variables CSS (`--pixel`, `--mono`) consumidas por los estilos globales.
2. **Estilos globales.** Portar `references/templates/home-about/styles.css` a `app/globals.css` (manteniendo las directivas de Tailwind al inicio), adaptando lo necesario para convivir con Tailwind v4 sin colisión de clases.
3. **Datos mock.** Crear `lib/mock-data.ts` con `GAMES`, `ACTIVITY` y `TOP_PLAYERS` tipados, traduciendo los arrays inline de `home.jsx`.
4. **Componente Nav.** Crear `components/Nav.tsx` (client component) portando `nav.jsx`: logo, links con estado activo vía `usePathname`, contador de créditos, botón "Iniciar Sesión" (siempre estado sin sesión) y panel móvil con hamburguesa, usando `next/link` para la navegación real.
5. **Componente Home.** Crear `components/Home.tsx` (client component, por el uso de `IntersectionObserver`) portando las 7 secciones de `home.jsx`, incluyendo `FloatingSilhouettes`, `MiniCard` y `FeatureIcon` como subcomponentes, y el hook de scroll-reveal.
6. **Layout raíz.** Actualizar `app/layout.tsx` para renderizar el fondo (`av-bg`: grid + scanlines), el `Nav` y `children`, aplicando las variables de fuente y el metadata del sitio.
7. **Página de inicio.** Actualizar `app/page.tsx` para renderizar `<Home />`.
8. **Rutas placeholder.** Crear `app/biblioteca/page.tsx`, `app/salon/page.tsx`, `app/about/page.tsx` y `app/auth/page.tsx` con contenido mínimo "Próximamente", usando los tokens visuales ya portados (para que no se vean rotas).
9. **Verificación manual.** Levantar `npm run dev`, revisar `/` visualmente contra el template, navegar cada link del Nav (desktop y móvil) y confirmar que ninguno da 404, y confirmar que las secciones con `.reveal` animan al hacer scroll.

## Criterios de aceptación

- [ ] `app/layout.tsx` carga "Press Start 2P" y "JetBrains Mono" vía `next/font/google` y las expone como variables CSS usadas en `globals.css`.
- [ ] `app/globals.css` contiene el tema portado del template (colores, fondo de grid animado, scanlines, fuentes pixel/mono, clases de componentes) adaptado de `styles.css`.
- [ ] `lib/mock-data.ts` exporta `GAMES`, `ACTIVITY` y `TOP_PLAYERS` tipados.
- [ ] El `Nav` se renderiza en todas las páginas con logo, links (Inicio, Biblioteca, Salón de la Fama, Acerca de), botón "Iniciar Sesión" apuntando a `/auth`, y un menú móvil hamburguesa funcional.
- [ ] La página `/` renderiza las 7 secciones del template: Hero, Por qué Arcade Vault, vista previa de juegos, estadísticas, actividad en vivo, precios y CTA final.
- [ ] La animación de scroll-reveal (`.reveal` → `.in`) funciona en las secciones de Home.
- [ ] Al hacer clic en una MiniCard o en los CTA de "explorar/ver juegos" se navega a `/biblioteca`.
- [ ] `/biblioteca`, `/salon`, `/about` y `/auth` existen como rutas placeholder y no devuelven 404.
- [ ] `npm run dev` inicia sin errores y la consola del navegador no muestra errores en `/`.
- [ ] `npm run build` completa exitosamente.

## Decisiones tomadas y descartadas

- **Alcance solo Home + Nav:** se deja `about.jsx` para un spec futuro, ya que Home depende de Nav para el layout pero no de About. *Descartado:* incluir las 3 piezas juntas (más trabajo, mezcla dos flujos distintos: landing y contacto).
- **Rutas placeholder reales** para los destinos del Nav en vez de links inertes o deshabilitados, para que la navegación se sienta completa aunque el contenido esté pendiente.
- **Datos mock en archivo tipado** (`lib/mock-data.ts`) en vez de hardcodeados inline en el componente, para mantener el componente de presentación limpio y facilitar que specs futuros reemplacen la fuente de datos.
- **CSS portado tal cual** desde el template en vez de reconstruido con utilidades Tailwind, para preservar exactamente el diseño ya validado visualmente. *Riesgo asociado:* ver sección de riesgos.
- **Nav siempre en estado "sin sesión"**, sin wiring de un sistema de auth real, ya que ese sistema no existe todavía y no es parte de este spec.
- **Fuentes vía `next/font/google`** en vez de un `<link>` a Google Fonts (como en el template original), para aprovechar la optimización de fuentes de Next.js.

## Riesgos identificados

- `styles.css` del template (~1700 líneas) fue escrito para una app React/Babel standalone, no para Next.js + Tailwind v4. Existe riesgo de colisión de nombres de clase con el reset/utilidades de Tailwind. Mitigación: revisar con cuidado durante el portado y ajustar especificidad o alcance de clases si aparece un conflicto visual.
- Next.js 16.3.3 tiene cambios importantes respecto a versiones previas (convenciones de App Router, props tipadas de layout, etc.). Antes de implementar, se debe consultar `node_modules/next/dist/docs/` (según indica `AGENTS.md`) para no aplicar patrones desactualizados.
