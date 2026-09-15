"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUser, setUser as persistUser, type SessionUser } from "@/lib/session";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, [pathname]);

  const isActive = (name: "biblioteca" | "salon" | "auth") => {
    if (name === "biblioteca") return pathname === "/" || pathname.startsWith("/juegos");
    if (name === "salon") return pathname === "/salon";
    return pathname === "/auth";
  };

  const close = () => setOpen(false);

  const handleSignOut = () => {
    persistUser(null);
    setUser(null);
    router.push("/");
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
          <Link className={isActive("biblioteca") ? "active" : ""} href="/">
            Biblioteca
          </Link>
          <Link className={isActive("salon") ? "active" : ""} href="/salon">
            Salón de la Fama
          </Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button className="btn ghost auth-btn" onClick={handleSignOut}>
            {user.name} ▾
          </button>
        ) : (
          <Link className="btn auth-btn" href="/auth">
            Iniciar Sesión
          </Link>
        )}
        <button className="btn ghost hamburger" onClick={() => setOpen(true)} aria-label="Menú">
          ≡
        </button>
      </nav>

      <div className={"av-mobile-backdrop" + (open ? " open" : "")} onClick={close}></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENÚ
        </div>
        <Link className={isActive("biblioteca") ? "active" : ""} href="/" onClick={close}>
          Biblioteca
        </Link>
        <Link className={isActive("salon") ? "active" : ""} href="/salon" onClick={close}>
          Salón de la Fama
        </Link>
        <Link className={isActive("auth") ? "active" : ""} href="/auth" onClick={close}>
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>
        <div style={{ flex: 1 }}></div>
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
