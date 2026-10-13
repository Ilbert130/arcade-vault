import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
export async function proxy(request: NextRequest) {
  const { response, hasSession } = await updateSession(request);
  // Único guard: con sesión, /auth no tiene sentido → /biblioteca.
  if (hasSession && request.nextUrl.pathname === "/auth") {
    const redirect = NextResponse.redirect(new URL("/biblioteca", request.url));
    // Conservar las cookies de sesión refrescadas por updateSession.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }
  return response;
}
export const config = {
  matcher: [
    /*
     * Todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - imágenes (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
