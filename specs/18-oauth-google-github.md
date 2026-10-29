# 18 — Auth: inicio de sesión con Google y GitHub

**Estado:** Borrador
**Depende de:** SPEC 04-supabase-auth
**Fecha:** 2026-10-28

**Objetivo:** Activar los botones "GOOGLE" y "GITHUB" de `/auth` (hoy decorativos) para que cualquier jugador pueda entrar o crear su cuenta con OAuth, con un `username` generado automáticamente, sin tocar el flujo de correo y contraseña.

## Alcance

**Incluye:**

- Configuración manual (documentada aquí; los secretos los pega la persona responsable del proyecto, nunca el agente):
  - **Google Cloud Console** → APIs y servicios → Credenciales → ID de cliente OAuth (tipo "Aplicación web"). URI de redirección autorizada: `https://kmoalitinvmzauvsjpxd.supabase.co/auth/v1/callback`. Pantalla de consentimiento con los alcances `email`, `profile` y `openid`.
  - **GitHub** → Settings → Developer settings → OAuth Apps → New OAuth App. Homepage URL: la URL de producción (o `http://localhost:3000` mientras tanto). Authorization callback URL: `https://kmoalitinvmzauvsjpxd.supabase.co/auth/v1/callback`.
  - **Supabase Dashboard** → Authentication → Sign In / Providers: activar **Google** y **GitHub** con su Client ID y Client Secret.
  - **Supabase Dashboard** → Authentication → URL Configuration: `Redirect URLs` con `http://localhost:3000/auth/callback` y la URL de producción equivalente (ya existe `http://localhost:3000/**`).
- Migración `supabase/migrations/<timestamp>_oauth_username.sql`: reemplaza `public.handle_new_user()` para que, si `raw_user_meta_data->>'username'` no viene (caso OAuth), genere uno válido (`^[A-Z0-9_]{3,10}$`) y único. Si viene (registro con correo), se comporta igual que hoy.
- Ruta `app/auth/callback/route.ts` (GET): recibe `code`, llama a `supabase.auth.exchangeCodeForSession(code)` y redirige a `/biblioteca`; si falta el código o el canje falla → `/auth?error=oauth`.
- Server Action `signInWithProvider(provider)` en `app/auth/actions.ts`: llama a `supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })` con `redirectTo = <origen>/auth/callback` y hace `redirect(data.url)`.
- `components/auth/Auth.tsx`: los botones GOOGLE y GITHUB pasan a ser funcionales (estado "ENTRANDO…" mientras se redirige y deshabilitados durante el envío, igual que el resto de la tarjeta); `?error=oauth` se muestra como error inicial: "No se pudo entrar con ese proveedor. Inténtalo de nuevo."
- `proxy.ts`: `/auth/callback` no debe ser redirigido por el guard (ya excluido porque la comparación es exacta con `/auth`; se verifica y se deja comentado).
- Actualizar `CLAUDE.md` (sección Routes y Database: `/auth/callback` y el trigger `handle_new_user`).

**No incluye (fuera de alcance de este spec):**

- Pantalla para que la persona elija o cambie su `username` tras entrar con OAuth. El generado es definitivo en este spec.
- Otros proveedores (Discord, Apple, etc.), magic link, MFA.
- Confirmación de correo y recuperación de contraseña (el spec 17 quedó pausado: no se activa "Confirm email").
- Vincular o desvincular proveedores desde un perfil; edición de perfil, avatar o borrado de cuenta.
- Cambios en `scores`, `leaderboard`, `game_stats` o `games`.

## Modelo de datos

Sin tablas ni columnas nuevas. Solo cambia la función del trigger; `database.types.ts` no se regenera.

```sql
-- supabase/migrations/<timestamp>_oauth_username.sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text;
  candidate text;
begin
  candidate := upper(new.raw_user_meta_data ->> 'username');
  if candidate is null then
    -- OAuth: partir del handle/nombre del proveedor o del correo.
    base := upper(regexp_replace(
      coalesce(
        new.raw_user_meta_data ->> 'preferred_user_name',
        new.raw_user_meta_data ->> 'user_name',
        new.raw_user_meta_data ->> 'name',
        split_part(new.email, '@', 1)
      ),
      '[^A-Za-z0-9_]', '', 'g'));
    base := left(coalesce(nullif(base, ''), 'JUGADOR'), 8);
    if length(base) < 3 then base := rpad(base, 3, '_'); end if;
    candidate := base;
    -- Colisión: añadir 2 dígitos aleatorios hasta que sea único.
    while exists (select 1 from public.profiles where username = candidate) loop
      candidate := left(base, 8) || lpad((floor(random() * 100))::int::text, 2, '0');
    end loop;
  end if;
  insert into public.profiles (id, username) values (new.id, candidate);
  return new;
end;
$$;
```

Nota: con 8 caracteres de base y 2 dígitos de sufijo hay 100 variantes por base; si todas estuvieran ocupadas el bucle no terminaría. Antes de aplicar, la implementación debe acotar los intentos (por ejemplo 20) y caer en `'JUG' || <7 dígitos aleatorios>`.

```ts
// app/auth/actions.ts
export async function signInWithProvider(
  provider: "google" | "github",
): Promise<AuthResult>;
// éxito: hace redirect(url) y no devuelve; error: { ok: false, error }
```

Mensaje nuevo (español): "No se pudo entrar con ese proveedor. Inténtalo de nuevo."

## Plan de implementación

1. **Documentación.** Leer en `node_modules/next/dist/docs/` la guía de route handlers (`route.ts`), `redirect` y `proxy.ts`; y `search_docs` del MCP de Supabase para `signInWithOAuth`, `exchangeCodeForSession`, proveedores Google y GitHub y vinculación automática de identidades.
2. **Configuración manual.** Crear el cliente OAuth de Google y la OAuth App de GitHub (ver Alcance), activar ambos proveedores en Supabase con sus credenciales y añadir la Redirect URL del callback. Las credenciales las pega la persona responsable; el agente solo guía.
3. **Migración.** Escribir `<timestamp>_oauth_username.sql` con el trigger acotado (ver Modelo de datos), aplicarla con el MCP y verificar con `execute_sql` que un alta con metadata `username` sigue funcionando y que una sin ella genera uno válido y único. Ejecutar `get_advisors` (security).
4. **Callback.** Crear `app/auth/callback/route.ts` con `exchangeCodeForSession` y las redirecciones descritas.
5. **Server Action.** Añadir `signInWithProvider` con `redirectTo` construido desde los headers de la petición.
6. **Auth.tsx.** Conectar los botones, estados de envío y lectura de `?error=oauth` (la tarjeta ya lee `useSearchParams` dentro de `Suspense`). Sin cambios visuales salvo el estado deshabilitado; usar `/frontend-design` solo si hace falta ajustar los botones.
7. **Proxy y docs.** Verificar que `proxy.ts` no redirige `/auth/callback`; actualizar `CLAUDE.md` y `specs/README.md`.
8. **Verificación manual** (`npm run dev`, cuentas reales de Google y GitHub):
   - GOOGLE con una cuenta nueva → vuelve a `/biblioteca` con sesión; en `profiles` hay un `username` válido derivado del nombre.
   - GITHUB con una cuenta nueva → igual, derivado del handle.
   - Dos cuentas con el mismo nombre → la segunda recibe un sufijo numérico y no falla.
   - Cancelar el consentimiento en el proveedor → `/auth?error=oauth` con el mensaje.
   - Registro con correo y contraseña sigue funcionando con su `username` elegido.
   - Una cuenta de correo existente entra igual que antes.
   - Jugar una partida con una cuenta OAuth guarda la puntuación y aparece en el Salón.
   - `get_advisors` (security) sin avisos nuevos; `npm run check` y `npm run build` sin errores.

## Criterios de aceptación

- [ ] El botón GOOGLE inicia sesión (o crea la cuenta) y deja al usuario en `/biblioteca` con sesión.
- [ ] El botón GITHUB hace lo mismo.
- [ ] Una cuenta nueva por OAuth obtiene automáticamente un `username` que cumple `^[A-Z0-9_]{3,10}$` y es único.
- [ ] Una colisión de `username` entre dos cuentas OAuth se resuelve sin error ni bucle infinito.
- [ ] El registro con correo y contraseña conserva el `username` elegido y no cambia su comportamiento.
- [ ] Cancelar o fallar en el proveedor lleva a `/auth?error=oauth` y se muestra el mensaje en español.
- [ ] Los botones quedan deshabilitados mientras se redirige y no se pueden pulsar dos veces.
- [ ] `/auth/callback` no es redirigido por `proxy.ts` y no admite destinos arbitrarios (siempre `/biblioteca`).
- [ ] Una partida jugada con una cuenta OAuth guarda su puntuación y aparece en el leaderboard.
- [ ] Las cuentas anteriores a este spec siguen iniciando sesión sin pasos extra.
- [ ] No hay secretos de OAuth en el repositorio ni en `.env.example`.
- [ ] `npm run check` y `npm run build` completan sin errores y la consola no muestra errores en `/auth`.

## Decisiones tomadas y descartadas

- **`username` generado, sin pantalla de elección.** El trigger ya exige un `username` válido y único; generarlo allí evita estados "a medias" y mantiene el flujo en un clic. _Descartado:_ pantalla de elección tras el primer acceso (más fricción y más código: ruta, formulario, política de `UPDATE` sobre `profiles`). Puede ser el spec siguiente si hace falta.
- **Cambiar el trigger, no crear el perfil desde la app.** Mantiene una única fuente de verdad y no depende de que el cliente complete ningún paso. _Descartado:_ crear el perfil en el callback (podría quedar una cuenta sin perfil).
- **Flujo PKCE con `code` + `exchangeCodeForSession` en `/auth/callback`** (patrón SSR de Supabase), compatible con las cookies del servidor y `proxy.ts`.
- **Destino fijo `/biblioteca`** tras el callback, sin parámetro `next`, para evitar redirecciones abiertas.
- **Server Action con `redirect(url)`** en lugar de llamar a `signInWithOAuth` desde el cliente, para mantener la sesión y las cookies del lado del servidor como en el resto del módulo de auth.
- **Solo Google y GitHub.** Son los botones que ya existen en el diseño.
- **Sin "Confirm email".** Decisión tomada al pausar el spec 17: el SMTP actual no puede entregar a terceros.

## Riesgos identificados

- **Vinculación automática de identidades.** Si alguien ya tiene una cuenta con correo y contraseña y entra por OAuth con el mismo correo, Supabase puede vincular o duplicar la cuenta según su configuración. Con "Confirm email" desactivado, un correo no verificado podría vincularse a una cuenta ajena. Debe comprobarse el comportamiento real en el paso 8 y, si es inseguro, resolverse antes de abrir el registro (por ejemplo, exigir correo verificado del proveedor).
- **Bucle del trigger.** Una colisión sin límite de intentos bloquearía el alta del usuario; el trigger debe acotar los intentos y tener un último recurso aleatorio (ver Modelo de datos).
- **Trigger en producción.** El proyecto de Supabase está marcado como producción y la migración reemplaza una función crítica del alta; debe probarse con altas de prueba antes y después, y existe riesgo de romper el registro si falla.
- **Nombre de proveedor poco útil.** Nombres con solo símbolos o emojis se reducen a vacío y caen en `JUGADOR`; el `username` puede resultar poco reconocible.
- **Pantalla de consentimiento de Google.** Una app en modo "Pruebas" solo admite usuarios de prueba hasta que se publique; sin ello, otros jugadores no podrán entrar.
- **URLs de redirección.** Los proveedores exigen coincidencia exacta del callback de Supabase; un error ahí produce `redirect_uri_mismatch`.
- **Secretos.** El Client Secret solo vive en el Dashboard de Supabase; no debe aparecer en el repo, en `.env.example` ni en conversaciones.
- **Next.js 16.** `route.ts`, `redirect` y `cookies()` asíncrono deben verificarse contra `node_modules/next/dist/docs/` antes de escribir código.
