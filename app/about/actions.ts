"use server";

import { Resend } from "resend";

export type ContactPayload = { name: string; email: string; message: string };
export type ContactResult = { ok: true } | { ok: false; error: string };

const CONTACT_TO = "ilbertca27@gmail.com";
const CONTACT_FROM = "onboarding@resend.dev";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendContactMessage(
  payload: ContactPayload
): Promise<ContactResult> {
  const name = payload.name?.trim() ?? "";
  const email = payload.email?.trim() ?? "";
  const message = payload.message?.trim() ?? "";

  if (!name || !email || !message) {
    return { ok: false, error: "Completa todos los campos antes de enviar." };
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
