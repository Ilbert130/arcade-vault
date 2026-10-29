"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  fetchUsername,
  getCurrentUsername,
  getSupabase,
} from "@/lib/supabase/client";
import { signOut } from "@/app/auth/actions";
export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // null en el primer render (servidor y cliente) para evitar mismatch de hidratación.
  const [username, setUsername] = useState<string | null>(null);
  // Las Server Actions escriben las cookies en el servidor, así que el cliente
  // browser no emite eventos tras signIn/signUp: se relee en cada navegación.
  useEffect(() => {
    let active = true;
    getCurrentUsername().then((name) => {
      if (active) setUsername(name);
    });
    return () => {
      active = false;
    };
  }, [pathname]);
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUsername(null);
        return;
      }
      // Diferido: no llamar a Supabase dentro del callback (puede bloquear el lock de auth).
      setTimeout(async () => {
        const name = await fetchUsername(supabase, session.user.id);
        if (active) setUsername(name);
      }, 0);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  const isActive = (
    name: "home" | "biblioteca" | "salon" | "about" | "auth",
  ) => {
    if (name === "home") return pathname === "/";
    if (name === "biblioteca") return pathname === "/biblioteca";
    if (name === "salon") return pathname === "/salon";
    if (name === "about") return pathname === "/about";
    return pathname === "/auth";
  };
  const close = () => setOpen(false);
  const logout = async () => {
    await signOut();
    setUsername(null);
    router.refresh();
  };
  return (
    <>
      <nav className="av-nav">
        <Link className="logo" href="/" onClick={close}>
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link className={isActive("home") ? "active" : ""} href="/">
            Inicio
          </Link>
          <Link
            className={isActive("biblioteca") ? "active" : ""}
            href="/biblioteca"
          >
            Biblioteca
          </Link>
          <Link className={isActive("salon") ? "active" : ""} href="/salon">
            Salón de la Fama
          </Link>
          <Link className={isActive("about") ? "active" : ""} href="/about">
            Acerca de
          </Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {username ? (
          <div className="session-box">
            <span className="btn auth-btn">{username}</span>
            <button className="btn ghost" onClick={logout}>
              Salir
            </button>
          </div>
        ) : (
          // Sin prefetch: con sesión, proxy.ts redirige /auth y el prefetch RSC
          // redirigido falla con 404 (ruido en consola) mientras el Nav aún no
          // ha leído el username.
          <Link className="btn auth-btn" href="/auth" prefetch={false}>
            Iniciar Sesión
          </Link>
        )}
        <button
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>
      <div
        className={"av-mobile-backdrop" + (open ? " open" : "")}
        onClick={close}
      ></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div
          className="pixel neon-cyan"
          style={{ fontSize: 11, marginBottom: 16 }}
        >
          MENÚ
        </div>
        <Link
          className={isActive("home") ? "active" : ""}
          href="/"
          onClick={close}
        >
          Inicio
        </Link>
        <Link
          className={isActive("biblioteca") ? "active" : ""}
          href="/biblioteca"
          onClick={close}
        >
          Biblioteca
        </Link>
        <Link
          className={isActive("salon") ? "active" : ""}
          href="/salon"
          onClick={close}
        >
          Salón de la Fama
        </Link>
        <Link
          className={isActive("about") ? "active" : ""}
          href="/about"
          onClick={close}
        >
          Acerca de
        </Link>
        {username ? (
          <div className="session-box">
            <span className={isActive("auth") ? "active" : ""}>{username}</span>
            <button
              className="btn ghost"
              onClick={() => {
                logout();
                close();
              }}
            >
              Salir
            </button>
          </div>
        ) : (
          <Link
            className={isActive("auth") ? "active" : ""}
            href="/auth"
            prefetch={false}
            onClick={close}
          >
            Iniciar Sesión
          </Link>
        )}
        <div style={{ flex: 1 }}></div>
        <div
          className="pixel"
          style={{
            fontSize: 9,
            color: "var(--ink-faint)",
            letterSpacing: "0.16em",
          }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
