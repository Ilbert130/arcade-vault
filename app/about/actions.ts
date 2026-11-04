"use server";
import { Resend } from "resend";
export type ContactPayload = {
  name: string;
  email: string;
  message: string;
  website?: string; // honeypot: siempre vacío en un envío humano
};
export type ContactResult = { ok: true } | { ok: false; error: string };
const CONTACT_TO = "ilbertca27@gmail.com";
const CONTACT_FROM = "onboarding@resend.dev";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMITS = { name: 100, email: 254, message: 2000 } as const;
export async function sendContactMessage(
  payload: ContactPayload,
): Promise<ContactResult> {
  // Honeypot: un bot lo rellena; fingimos éxito para no avisarle de que fue detectado.
  if (typeof payload.website === "string" && payload.website.trim() !== "") {
    return { ok: true };
  }
  const name = (payload.name?.trim() ?? "").replace(/[\r\n]/g, " ");
  const email = payload.email?.trim() ?? "";
  const message = payload.message?.trim() ?? "";
  if (!name || !email || !message) {
    return { ok: false, error: "Completa todos los campos antes de enviar." };
  }
  if (name.length > LIMITS.name) {
    return {
      ok: false,
      error: `El nombre no puede superar ${LIMITS.name} caracteres.`,
    };
  }
  if (email.length > LIMITS.email) {
    return {
      ok: false,
      error: `El correo no puede superar ${LIMITS.email} caracteres.`,
    };
  }
  if (message.length > LIMITS.message) {
    return {
      ok: false,
      error: `El mensaje no puede superar ${LIMITS.message} caracteres.`,
    };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Ingresa un correo electrónico válido." };
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "El servicio de correo no está configurado. Intenta más tarde.",
    };
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      to: CONTACT_TO,
      from: CONTACT_FROM,
      subject: `Nuevo mensaje de contacto — ${name}`,
      replyTo: email,
      text: `Nombre: ${name}\nCorreo: ${email}\n\n${message}`,
    });
    if (error) {
      return {
        ok: false,
        error: "No se pudo enviar el mensaje. Intenta de nuevo.",
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "No se pudo enviar el mensaje. Intenta de nuevo.",
    };
  }
}
