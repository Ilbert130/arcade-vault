# 04 — Supabase: infraestructura base y autenticación real

**Estado:** Implementado
**Depende de:** SPEC 03-biblioteca-salon-auth
**Fecha:** 2026-09-29

**Objetivo:** Integrar Supabase en la app Next.js (clientes server/browser con `@supabase/ssr` y `proxy.ts` de sesión) y reemplazar la sesión falsa en `localStorage` por Supabase Auth con email + contraseña y una tabla `public.profiles` para el nombre de usuario arcade.

## Alcance

**Incluye:**

- Dependencias `@supabase/supabase-js` y `@supabase/ssr`.
- Variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, documentadas en `.env.example` (sin valores reales); valores reales en `.env.local` (ya ignorado por `.gitignore`).
- Clientes Supabase:
  - `lib/supabase/client.ts` — cliente browser (`createBrowserClient`).
  - `lib/supabase/server.ts` — cliente server (`createServerClient` con `cookies()` de `next/headers`).
  - `lib/supabase/proxy.ts` — helper `updateSession(request)` que refresca la sesión y reescribe cookies.
- `proxy.ts` en la raíz (convención de Next.js 16, sustituye a `middleware.ts`) que llama a `updateSession` y aplica el único guard: si hay sesión y la ruta es `/auth`, redirige a `/biblioteca`.
- Migración SQL versionada en `supabase/migrations/<timestamp>_profiles.sql` y aplicada al proyecto remoto con el MCP de Supabase (`apply_migration`):
  - Tabla `public.profiles` (ver modelo de datos) con RLS activado.
  - Función + trigger `on_auth_user_created` que inserta el perfil a partir de `raw_user_meta_data.username` al crearse un usuario en `auth.users`.
- Tipos generados con el MCP (`generate_typescript_types`) en `lib/supabase/database.types.ts`, usados para tipar los clientes.
- Server Actions en `app/auth/actions.ts` (`"use server"`): `signUp`, `signIn`, `signOut`, con validación server-side y errores traducidos al español.
- `/auth` (`components/Auth.tsx`):
  - Tab "Iniciar sesión": campos **Correo electrónico** + Contraseña (el campo "Usuario" desaparece de esta tab).
  - Tab "Crear cuenta": campos Usuario + Correo electrónico + Contraseña.
  - Estado "enviando" (botón deshabilitado) y mensaje de error visible en la tarjeta sin perder lo escrito.
  - Éxito en cualquiera de las dos tabs → redirige a `/biblioteca` con sesión iniciada.
  - "JUGAR COMO INVITADO" → navega a `/biblioteca` sin sesión (no crea usuario).
  - Botones Google/GitHub siguen decorativos.
- Migración de todos los consumidores de sesión a Supabase:
  - `components/Nav.tsx`: obtiene el usuario con el cliente browser, lee su `username` de `profiles`, se suscribe a `onAuthStateChange`; "Salir" llama a la Server Action `signOut` y el Nav vuelve a "Iniciar Sesión" sin recargar.
  - `components/HallOfFame.tsx`: la fila "tu mejor marca" usa el `username` de Supabase (solo si hay sesión).
  - `app/juegos/[id]/jugar/page.tsx`: el nombre por defecto es el `username` de Supabase o `"INVITADO"` si no hay sesión.
- `lib/session.ts`: se eliminan `getUser`, `setUser` y `SessionUser`. `saveScore` (localStorage) se mantiene sin cambios.
- Desactivar "Confirm email" en Supabase Dashboard → Authentication → Providers → Email (paso manual documentado).

**No incluye (fuera de alcance de este spec):**

- Puntuaciones en Supabase: tabla `scores`, Salón de la Fama con datos reales, reemplazo de `saveScore`/`seededScores` → spec futuro.
- OAuth real (Google/GitHub), magic link, login anónimo de Supabase.
- Confirmación de correo, recuperación/cambio de contraseña, edición de perfil o avatar.
- Login con nombre de usuario (solo por correo).
- Guards adicionales: `/biblioteca`, `/salon`, `/juegos/[id]` y `/juegos/[id]/jugar` siguen accesibles sin sesión.
- Supabase CLI local / Docker / branching.
- Sistema de créditos (el contador del Nav sigue decorativo).

## Modelo de datos

### Base de datos (`supabase/migrations/<timestamp>_profiles.sql`)

```sql
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null unique
             check (username ~ '^[A-Z0-9_]{3,10}$'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Lectura pública (necesaria para comprobar unicidad y, a futuro, el leaderboard)
create policy "profiles_select_all" on public.profiles
  for select to anon, authenticated using (true);

-- Sin políticas de insert/update/delete para clientes: el perfil lo crea el trigger.

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username)
  values (new.id, upper(new.raw_user_meta_data ->> 'username'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Migración adicional `supabase/migrations/<timestamp>_revoke_handle_new_user_execute.sql` (añadida durante la implementación para cumplir el criterio de `get_advisors`: lints 0028/0029 — función `security definer` invocable vía `/rest/v1/rpc`):

```sql
revoke execute on function public.handle_new_user() from public, anon, authenticated;
```

El trigger sigue funcionando: los triggers no requieren privilegio `EXECUTE`.

### TypeScript

```ts
// app/auth/actions.ts
type AuthResult = { ok: true } | { ok: false; error: string };

export async function signUp(input: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResult>;
export async function signIn(input: {
  email: string;
  password: string;
}): Promise<AuthResult>;
export async function signOut(): Promise<void>;
```

```ts
// Perfil usado por Nav / HallOfFame / jugar
type Profile = Database["public"]["Tables"]["profiles"]["Row"]; // { id, username, created_at }
```

### Variables de entorno (`.env.example`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

`SUPABASE_DB_PASSWORD` ya existe y no se usa en este spec.

## Plan de implementación

1. **Documentación.** Leer `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`, `03-api-reference/03-file-conventions/proxy.md` y `02-guides/authentication.md` antes de escribir código.
2. **Dependencias y entorno.** `npm install @supabase/supabase-js @supabase/ssr`. Añadir las dos variables a `.env.example`. Obtener URL y publishable key con el MCP (`get_project_url`, `get_publishable_keys`) y ponerlas en `.env.local`. `npm run build` sigue pasando.
3. **Migración.** Crear `supabase/migrations/<timestamp>_profiles.sql` con el SQL del modelo de datos y aplicarlo con `apply_migration`. Verificar con `list_tables` y `get_advisors` (security) que no hay avisos de RLS.
4. **Config manual de Auth.** Desactivar "Confirm email" en el dashboard del proyecto.
5. **Tipos.** Generar `lib/supabase/database.types.ts` con `generate_typescript_types`.
6. **Clientes.** Crear `lib/supabase/client.ts`, `lib/supabase/server.ts` y `lib/supabase/proxy.ts` tipados con `Database`.
7. **Proxy.** Crear `proxy.ts` en la raíz que llama a `updateSession` (usando `supabase.auth.getClaims()` para validar la sesión) con un `matcher` que excluya `_next/static`, `_next/image`, `favicon.ico` e imágenes; si hay sesión y `pathname === "/auth"`, redirigir a `/biblioteca`. La app sigue funcionando igual (aún usa localStorage).
8. **Server Actions.** Crear `app/auth/actions.ts`:
   - `signUp`: normaliza `username` a mayúsculas; valida `^[A-Z0-9_]{3,10}$`, formato de correo y contraseña ≥ 6; comprueba que el `username` no exista en `profiles`; llama a `supabase.auth.signUp({ email, password, options: { data: { username } } })`.
   - `signIn`: valida correo y contraseña no vacíos; `signInWithPassword`.
   - `signOut`: `supabase.auth.signOut()`.
   - Mapeo de errores a español: "Correo o contraseña incorrectos", "Ese usuario ya existe", "Ese correo ya está registrado", "La contraseña debe tener al menos 6 caracteres", "Usuario inválido: 3–10 caracteres, letras, números o _", y un genérico "No se pudo conectar. Inténtalo de nuevo." (incluye fallo del trigger por colisión de `username` en carrera).
9. **Auth.tsx.** Reemplazar `setUser` por las Server Actions: campos por tab según el alcance, estado `status: "idle" | "sending" | "error"` + `errorMsg`, botón deshabilitado mientras envía, bloque de error en la tarjeta; en `ok` → `router.push("/biblioteca")` + `router.refresh()`. "JUGAR COMO INVITADO" → solo `router.push("/biblioteca")`.
10. **Nav.tsx.** Sustituir `getUser/setUser` por el cliente browser: al montar, `auth.getUser()` + `select username from profiles`; suscripción a `onAuthStateChange` (con cleanup) para actualizar/limpiar el estado; "Salir" llama a `signOut()` y `router.refresh()`. Mismo comportamiento en desktop y panel móvil; estado inicial `null` para evitar mismatch de hidratación.
11. **HallOfFame.tsx y jugar/page.tsx.** Sustituir `getUser()` por la lectura del `username` vía cliente browser (mismo patrón que Nav, en `useEffect`). En `/jugar`, el nombre por defecto pasa a ser el `username` o `"INVITADO"`.
12. **lib/session.ts.** Eliminar `getUser`, `setUser` y `SessionUser`; conservar `saveScore`. Confirmar con búsqueda que no quedan referencias.
13. **Verificación manual.** `npm run dev`:
    - Crear cuenta con usuario `px_kai` → redirige a `/biblioteca`, Nav muestra `PX_KAI`; en Supabase existe la fila en `auth.users` y en `profiles` con `username = 'PX_KAI'`.
    - Intentar crear otra cuenta con `PX_KAI` → "Ese usuario ya existe". Con el mismo correo → "Ese correo ya está registrado". Con contraseña de 5 chars → error de contraseña.
    - Salir desde el Nav → vuelve a "Iniciar Sesión" sin recargar.
    - Iniciar sesión con correo/contraseña correctos → `/biblioteca`, Nav con el usuario. Con contraseña incorrecta → "Correo o contraseña incorrectos" y los campos conservan su valor.
    - Con sesión, visitar `/auth` → redirige a `/biblioteca`. Recargar cualquier página mantiene la sesión.
    - `/salon` muestra "tu mejor marca" solo con sesión; `/juegos/[id]/jugar` precarga el `username` o "INVITADO".
    - "JUGAR COMO INVITADO" → `/biblioteca` sin sesión.
    - `npm run build` y `npm run lint` sin errores.

## Criterios de aceptación

- [x] `package.json` incluye `@supabase/supabase-js` y `@supabase/ssr`.
- [x] `.env.example` documenta `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` sin valores reales.
- [x] Existen `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/proxy.ts`, `lib/supabase/database.types.ts` y `proxy.ts` en la raíz.
- [x] `supabase/migrations/<timestamp>_profiles.sql` está en el repo y la tabla `public.profiles` existe en el proyecto remoto con RLS activado.
- [x] `get_advisors` (security) no reporta avisos sobre `public.profiles` ni sobre `handle_new_user`.
- [x] Registrarse desde `/auth` crea un usuario en `auth.users` y su fila en `profiles` con el `username` en mayúsculas, y deja la sesión iniciada.
- [x] No se puede registrar un `username` repetido ni fuera de `^[A-Z0-9_]{3,10}$`; se muestra el mensaje de error correspondiente en español.
- [x] Iniciar sesión con correo + contraseña válidos redirige a `/biblioteca`; credenciales inválidas muestran "Correo o contraseña incorrectos" sin borrar los campos.
- [x] El botón de envío está deshabilitado mientras la acción está en curso.
- [x] La sesión persiste tras recargar la página (cookies gestionadas por `proxy.ts`).
- [x] Con sesión activa, `/auth` redirige a `/biblioteca`; el resto de rutas no redirige en ningún caso.
- [x] El Nav (desktop y móvil) muestra el `username` con sesión y "Iniciar Sesión" sin ella; "Salir" cierra la sesión en Supabase y actualiza el Nav sin recargar.
- [x] `/salon` muestra "tu mejor marca" solo con sesión de Supabase; `/juegos/[id]/jugar` usa el `username` o "INVITADO".
- [x] `lib/session.ts` ya no exporta `getUser`/`setUser`/`SessionUser` y no hay referencias a ellos; la clave `av_user` de `localStorage` ya no se usa.
- [x] `npm run build` y `npm run lint` completan sin errores y la consola del navegador no muestra errores en `/auth`, `/biblioteca`, `/salon`.

## Decisiones tomadas y descartadas

- **Alcance: infraestructura + Auth.** Las puntuaciones en Supabase quedan para un spec propio. _Descartado:_ "todo junto" (infra + auth + perfiles + scores) por tocar demasiadas áreas en un solo spec.
- **Solo email + contraseña.** Coincide con el formulario existente. _Descartado:_ OAuth Google/GitHub (requiere apps OAuth externas) y magic link (cambia el diseño).
- **Login por correo, no por usuario.** Supabase Auth autentica por email; el campo "Usuario" solo se pide al crear cuenta. _Descartado:_ resolver username→email en servidor (añade lógica y permite enumerar usuarios).
- **`username` en `public.profiles`, no en `user_metadata`.** Permite unicidad garantizada por la BD y consultas para el futuro leaderboard. Reglas: 3–10 caracteres `A-Z 0-9 _`, en mayúsculas (mantiene el estilo arcade actual).
- **Perfil creado por trigger `security definer`.** Evita políticas de insert para clientes y garantiza que todo usuario tenga perfil. La unicidad se comprueba antes en la Server Action para dar un error claro; el `UNIQUE` de la BD es la garantía final.
- **Confirmación de correo desactivada.** Flujo inmediato y evita el límite de envíos del SMTP por defecto de Supabase. Se puede activar en un spec futuro (requeriría ruta `/auth/confirm`).
- **Invitado = sin sesión.** _Descartado:_ anonymous sign-in de Supabase (más complejo, no necesario hasta tener puntuaciones reales).
- **Server Actions para signUp/signIn/signOut**, mismo patrón que `app/about/actions.ts` y con validación server-side. _Descartado:_ llamar a `supabase.auth.*` desde el cliente.
- **Migrar todos los consumidores de sesión (Nav, Salón, jugar)** para tener una sola fuente de verdad. `saveScore` (localStorage) se mantiene hasta el spec de puntuaciones.
- **Guard único: `/auth` con sesión → `/biblioteca`.** _Descartado:_ proteger `/jugar` (rompería el modo invitado) o ningún guard.
- **Migraciones: archivo SQL en el repo + aplicación vía MCP.** _Descartado:_ Supabase CLI local con Docker (más setup) y aplicar sin versionar.
- **`proxy.ts` en lugar de `middleware.ts`**, por la convención de Next.js 16.3.3 del proyecto.

## Riesgos identificados

- **Next.js 16 vs. ejemplos de Supabase.** La documentación de `@supabase/ssr` suele mostrar `middleware.ts`; hay que adaptarlo a `proxy.ts` y verificar la API de `cookies()` (asíncrona) en `node_modules/next/dist/docs/`.
- **Carrera en la unicidad del `username`.** Dos registros simultáneos con el mismo nombre pasan la comprobación previa; el segundo falla en el trigger y Supabase devuelve "Database error saving new user". Se muestra el error genérico y el usuario de `auth.users` no llega a crearse (el trigger aborta la transacción).
- **Hidratación.** Nav, HallOfFame y `/jugar` son client components; leer la sesión durante el render causaría mismatch. Debe inicializarse en `null` y poblarse en `useEffect`.
- **Paso manual en el dashboard.** Si no se desactiva "Confirm email", `signUp` no devuelve sesión y el usuario no queda logueado; la verificación manual debe detectarlo.
- **Límites de Auth de Supabase** (rate limit de registros/logins por IP) pueden aparecer en pruebas repetidas; se muestran como error genérico.
- **Variables de entorno ausentes.** Sin `.env.local`, los clientes lanzan error al crearse; debe fallar de forma controlada en las Server Actions (error genérico) y no romper el render del Nav.

## Notas de implementación

- **Migración extra** `revoke_handle_new_user_execute` para cumplir `get_advisors` (ver Modelo de datos).
- **Mensajes no listados en el plan:** correo con formato inválido en `signUp` → "Ingresa un correo electrónico válido." (mismo texto que el formulario de contacto); campos vacíos en `signIn` → "Correo o contraseña incorrectos".
- **Helpers compartidos** en `lib/supabase/client.ts` (`getSupabase`, `fetchUsername`, `getCurrentUsername`) usados por Nav, HallOfFame y `/jugar`.
- **`prefetch={false}` en los enlaces a `/auth` del Nav:** con sesión recién iniciada, el prefetch de `/auth` era redirigido por `proxy.ts` y Next lo rechazaba con un 404 en consola.
- **Lint:** se corrigieron errores previos en `components/Home.tsx` y `app/juegos/[id]/jugar/page.tsx` (subida de nivel sin efecto aparte) y se excluyó `references/**` de ESLint (material de referencia, no es parte de la app).
- **Pendiente para un spec futuro:** `public.rls_auto_enable()` ejecutable vía API (preexistente) y "Leaked password protection" desactivado en Auth.
