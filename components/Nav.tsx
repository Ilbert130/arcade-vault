"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (name: "home" | "biblioteca" | "salon" | "about" | "auth") => {
    if (name === "home") return pathname === "/";
    if (name === "biblioteca") return pathname === "/biblioteca";
    if (name === "salon") return pathname === "/salon";
    if (name === "about") return pathname === "/about";
    return pathname === "/auth";
  };

  const close = () => setOpen(false);

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
          <Link className={isActive("biblioteca") ? "active" : ""} href="/biblioteca">
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
        <Link className="btn auth-btn" href="/auth">
          Iniciar Sesión
        </Link>
        <button className="btn ghost hamburger" onClick={() => setOpen(true)} aria-label="Menú">
          ≡
        </button>
      </nav>

      <div className={"av-mobile-backdrop" + (open ? " open" : "")} onClick={close}></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENÚ
        </div>
        <Link className={isActive("home") ? "active" : ""} href="/" onClick={close}>
          Inicio
        </Link>
        <Link className={isActive("biblioteca") ? "active" : ""} href="/biblioteca" onClick={close}>
          Biblioteca
        </Link>
        <Link className={isActive("salon") ? "active" : ""} href="/salon" onClick={close}>
          Salón de la Fama
        </Link>
        <Link className={isActive("about") ? "active" : ""} href="/about" onClick={close}>
          Acerca de
        </Link>
        <Link className={isActive("auth") ? "active" : ""} href="/auth" onClick={close}>
          Iniciar Sesión
        </Link>
        <div style={{ flex: 1 }}></div>
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
