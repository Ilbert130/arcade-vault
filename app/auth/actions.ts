"use server";
import { createClient } from "@/lib/supabase/server";
export type AuthResult = { ok: true } | { ok: false; error: string };
const USERNAME_RE = /^[A-Z0-9_]{3,10}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;
const ERR = {
  credentials: "Correo o contraseña incorrectos",
  usernameTaken: "Ese usuario ya existe",
  emailTaken: "Ese correo ya está registrado",
  weakPassword: "La contraseña debe tener al menos 6 caracteres",
  invalidUsername: "Usuario inválido: 3–10 caracteres, letras, números o _",
  invalidEmail: "Ingresa un correo electrónico válido.",
  generic: "No se pudo conectar. Inténtalo de nuevo.",
} as const;
// Traduce los códigos de error de Supabase Auth a los mensajes del spec.
// Cualquier otro (p. ej. "Database error saving new user" por colisión de
// username en carrera, rate limits o red) cae en el genérico.
function mapAuthError(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return ERR.credentials;
    case "user_already_exists":
    case "email_exists":
      return ERR.emailTaken;
    case "weak_password":
      return ERR.weakPassword;
    case "email_address_invalid":
      return ERR.invalidEmail;
    default:
      return ERR.generic;
  }
}
export async function signUp(input: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const username = input.username?.trim().toUpperCase() ?? "";
  const email = input.email?.trim() ?? "";
  const password = input.password ?? "";
  if (!USERNAME_RE.test(username)) {
    return { ok: false, error: ERR.invalidUsername };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: ERR.invalidEmail };
  }
  if (password.length < MIN_PASSWORD) {
    return { ok: false, error: ERR.weakPassword };
  }
  try {
    const supabase = await createClient();
    const { data: existing, error: lookupError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (lookupError) return { ok: false, error: ERR.generic };
    if (existing) return { ok: false, error: ERR.usernameTaken };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) return { ok: false, error: mapAuthError(error.code) };
    return { ok: true };
  } catch {
    return { ok: false, error: ERR.generic };
  }
}
export async function signIn(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const email = input.email?.trim() ?? "";
  const password = input.password ?? "";
  if (!email || !password) {
    return { ok: false, error: ERR.credentials };
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { ok: false, error: mapAuthError(error.code) };
    return { ok: true };
  } catch {
    return { ok: false, error: ERR.generic };
  }
}
export async function signOut(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Sin conexión o sin configuración: no hay sesión que cerrar en servidor.
  }
}
