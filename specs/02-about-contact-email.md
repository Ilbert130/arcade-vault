# 02 — About y envío de correo de contacto (Resend)

**Estado:** Implemented
**Depende de:** SPEC 01-home-landing-nav
**Fecha:** 2026-09-17

**Objetivo:** Implementar la página "Acerca de" con su formulario de contacto, replicando exactamente el diseño de `references/templates/home-about/about.jsx`, y conectar el envío del formulario a un correo real usando Resend mediante una Server Action.

## Alcance

**Incluye:**
- Página `/about` con las dos secciones de `about.jsx`: Hero "Acerca de" (kicker, título, misión, fila de 3 highlights con íconos pixel) y sección de Contacto (intro + tips + formulario), con el divisor animado entre ambas.
- Componente `About` (client component) portado de `about.jsx`, incluyendo el hook de scroll-reveal (`IntersectionObserver`) y el subcomponente `HighlightIcon`.
- Portado de las clases CSS correspondientes de `references/templates/home-about/styles.css` (`.about-hero`, `.about-title`, `.about-mission`, `.highlight-row`, `.highlight`, `.about-divider`, `.div-bar`, `.div-pixels`, `.about-contact`, `.contact-grid`, `.contact-intro`, `.contact-title`, `.contact-tips`, `.contact-form`, `.terminal-success`, `.term-bar`, `.term-body`, animaciones `shake`/`pxblink`/`blink`) a `app/globals.css`, ya que estas clases no fueron portadas en el spec 01.
- Formulario de contacto (nombre, correo electrónico, mensaje) con validación client-side de campos no vacíos (animación "shake" si falla, igual que el template).
- Envío real del formulario vía Server Action (`app/about/actions.ts`) que usa el SDK de Resend (`resend`) para enviar el correo a `ilbertca27@gmail.com`, con `from: onboarding@resend.dev`.
- Validación server-side en la Server Action (nombre/mensaje no vacíos, formato de correo válido) antes de llamar a Resend.
- Tres estados del formulario tras enviar: **enviando** (deshabilitar botón), **éxito** (terminal "MENSAJE RECIBIDO" tal como en el template, usando el nombre ingresado), **error** (mensaje de error visible en el formulario, con opción de reintentar sin perder los datos escritos).
- Instalación de la dependencia `resend` en `package.json`.
- Archivo `.env.example` documentando `RESEND_API_KEY` (sin valor real).
- Reemplazo del placeholder actual de `app/about/page.tsx` (`ComingSoon`) por la página real.

**No incluye (fuera de alcance de este spec):**
- Verificación de dominio propio en Resend o configuración de un remitente distinto a `onboarding@resend.dev`.
- Envío de un correo de confirmación al usuario que llena el formulario (solo se notifica al equipo, a `ilbertca27@gmail.com`).
- Persistencia de los mensajes de contacto en base de datos — el mensaje solo se envía por correo, no se guarda.
- Rate limiting, captcha o protección anti-spam del formulario.
- Cualquier cambio al `Nav` o a otras páginas — el link "Acerca de" ya apunta a `/about` desde el spec 01.
- Autenticación real o cualquier otra funcionalidad no relacionada con About/Contacto.

## Modelo de datos

No se introduce ningún modelo de datos persistente ni tipado nuevo en `lib/`. La única estructura es la carga (`payload`) que via la Server Action, sin persistir:

```ts
// app/about/actions.ts
type ContactPayload = { name: string; email: string; message: string };
type ContactResult = { ok: true } | { ok: false; error: string };

export async function sendContactMessage(payload: ContactPayload): Promise<ContactResult>;
```

## Plan de implementación

1. **Dependencia.** Agregar `resend` a `package.json` (`npm install resend`).
2. **Variable de entorno.** Crear `.env.example` en la raíz con `RESEND_API_KEY=` documentado (sin valor). Confirmar que `.env*.local` está ignorado por `.gitignore` (ya lo está por defecto en `create-next-app`).
3. **Estilos.** Portar a `app/globals.css` las clases de `about.jsx`/`styles.css` listadas en el alcance (secciones about-hero, highlight-row, about-divider, about-contact, contact-form, terminal-success), revisando colisiones con Tailwind igual que se hizo en el spec 01.
4. **Server Action.** Crear `app/about/actions.ts` con `"use server"`, función `sendContactMessage(payload)`: valida que `name`, `email` y `message` no estén vacíos y que `email` tenga formato válido; si falla, retorna `{ ok: false, error: "..." }`. Si pasa, instancia `new Resend(process.env.RESEND_API_KEY)` y envía el correo (`to: "ilbertca27@gmail.com"`, `from: "onboarding@resend.dev"`, asunto y cuerpo con nombre/correo/mensaje del remitente). Captura errores de Resend y retorna `{ ok: false, error: "..." }` en ese caso; retorna `{ ok: true }` si el envío fue exitoso.
5. **Componente About.** Crear `components/About.tsx` (client component) portando `about.jsx`: hero, highlights con `HighlightIcon`, divisor, sección de contacto con `contact-tips`, y el formulario controlado (`useState` para `form`, `sent`, `shake`, más un nuevo estado `status`: `"idle" | "sending" | "sent" | "error"` y `errorMsg`). El hook de scroll-reveal (`.reveal` → `.in`) se porta igual que en `Home.tsx` del spec 01.
6. **Envío del formulario.** En el `onSubmit` del formulario: si la validación client-side pasa, llamar a `sendContactMessage(form)` (importada desde `app/about/actions.ts`), mostrar estado "sending" mientras se resuelve, y según el resultado mostrar el terminal de éxito (estado existente `sent`) o un bloque de error con el mensaje devuelto y botón para reintentar.
7. **Página.** Reemplazar `app/about/page.tsx` (hoy `<ComingSoon title="ACERCA DE" />`) para renderizar `<About />`.
8. **Verificación manual.** Levantar `npm run dev`, configurar una `RESEND_API_KEY` de prueba en `.env.local`, enviar el formulario con datos válidos y confirmar que llega el correo a `ilbertca27@gmail.com`; probar envío con campos vacíos (debe hacer shake, no llamar a la Server Action); probar con una API key inválida/ausente y confirmar que se muestra el estado de error sin romper la página; confirmar que la animación de scroll-reveal funciona y que el diseño visual coincide con el template.

## Criterios de aceptación

- [x] `/about` renderiza el Hero (kicker, título, misión, 3 highlights) y la sección de Contacto (intro, tips, formulario) igual que `about.jsx`.
- [x] `app/globals.css` incluye las clases de about/contacto portadas del template, sin romper el diseño existente de Home/Nav.
- [x] El formulario no envía si `name`, `email` o `msg` están vacíos, y muestra la animación "shake".
- [x] Al enviar el formulario con datos válidos y una `RESEND_API_KEY` configurada correctamente, llega un correo real a `ilbertca27@gmail.com` con el nombre, correo y mensaje ingresados.
- [x] Tras un envío exitoso se muestra el terminal "MENSAJE RECIBIDO" con el nombre del remitente, igual que en el template, con el botón "ENVIAR OTRO MENSAJE" para reiniciar el formulario.
- [x] Si la Server Action retorna error (validación server-side o fallo de Resend), se muestra un estado de error visible en el formulario (no el terminal de éxito) y el usuario puede reintentar sin perder lo escrito.
- [x] `.env.example` documenta `RESEND_API_KEY` y no contiene ninguna clave real.
- [x] `npm run dev` inicia sin errores y la consola del navegador no muestra errores en `/about`.
- [x] `npm run build` completa exitosamente.

## Decisiones tomadas y descartadas

- **Server Action en vez de Route Handler:** se usa `app/about/actions.ts` con `"use server"` llamada directamente desde el componente cliente, evitando un endpoint API separado y el `fetch` manual. *Descartado:* `app/api/contact/route.ts` — más código para un caso de uso simple de un solo formulario.
- **Remitente `onboarding@resend.dev`:** se usa la dirección de pruebas de Resend porque el proyecto no tiene un dominio propio verificado todavía. *Riesgo asociado:* ver sección de riesgos.
- **Destinatario fijo `ilbertca27@gmail.com`:** hardcodeado en la Server Action (no es un dato configurable por el usuario final del formulario), ya que es la única bandeja de destino requerida por este spec.
- **Validación también en servidor:** aunque el template original solo valida en cliente, se agrega validación en la Server Action para no depender exclusivamente del cliente antes de gastar una llamada a Resend.
- **Estado de error visible en vez de éxito falso:** se decide no imitar el comportamiento original del template (que siempre "tiene éxito" sin backend real), porque ahora sí hay un envío real que puede fallar y el usuario debe poder saberlo y reintentar.
- **Sin correo de confirmación al remitente ni persistencia del mensaje:** fuera de alcance; el mensaje solo se envía por correo al equipo, no se guarda en ningún lado.

## Riesgos identificados

- `onboarding@resend.dev` es la dirección de pruebas de Resend; según las políticas de Resend puede tener límites de envío o restricciones de entrega distintas a un dominio verificado. Si el envío falla por esta razón, el spec ya contempla mostrar el estado de error, pero la causa raíz (falta de dominio propio) queda fuera de alcance.
- El proyecto no tiene ninguna variable de entorno configurada todavía; si `RESEND_API_KEY` no está presente en `.env.local` durante el desarrollo, la Server Action debe fallar de forma controlada (mostrando el estado de error) en vez de lanzar una excepción no manejada que rompa la página.
- Al portar las clases CSS de `about.jsx`/`styles.css`, existe el mismo riesgo de colisión de nombres con Tailwind v4 identificado en el spec 01; revisar visualmente contra el template al integrar.
