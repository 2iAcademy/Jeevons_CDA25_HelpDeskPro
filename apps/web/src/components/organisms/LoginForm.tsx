"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (!email.trim()) {
      errs.email = "L'adresse e-mail est requise.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Format d'e-mail invalide.";
    }
    if (!password) errs.password = "Le mot de passe est requis.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrors({ form: "Identifiants invalides. Vérifiez l'adresse e-mail et le mot de passe." });
      } else {
        router.push("/tickets");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("demo-helpdesk-2026");
    setErrors({});
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      {errors.form && (
        <div className="field">
          <span className="err">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {errors.form}
          </span>
        </div>
      )}

      <div className="field">
        <label htmlFor="email">Adresse e-mail</label>
        <input
          id="email"
          type="email"
          className={`input${errors.email ? " error" : ""}`}
          placeholder="vous@microsoft-solutions.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
        />
        {errors.email && (
          <span className="err">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {errors.email}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="password">Mot de passe</label>
        <div style={{ position: "relative" }}>
          <input
            id="password"
            type={showPwd ? "text" : "password"}
            className={`input${errors.password ? " error" : ""}`}
            style={{ paddingRight: 40 }}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "var(--ink-3)", padding: 4,
              display: "flex", alignItems: "center",
            }}
            aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPwd ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>
        {errors.password && (
          <span className="err">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {errors.password}
          </span>
        )}
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
        {loading ? "Connexion…" : "Se connecter"}
      </button>

      {/* Comptes de démo */}
      <div className="test-accounts">
        <div className="h">Comptes de démonstration</div>
        {[
          { name: "Marie Garnier", email: "m.garnier@microsoft-solutions.fr", role: "admin" },
          { name: "Thomas Lefèvre", email: "t.lefevre@microsoft-solutions.fr", role: "admin" },
          { name: "Sophie Bonnet", email: "s.bonnet@microsoft-solutions.fr", role: "technicien" },
        ].map((u) => (
          <button
            key={u.email}
            type="button"
            className="acc"
            onClick={() => fillDemo(u.email)}
          >
            <span>{u.name}</span>
            <span className={`role-pill${u.role === "admin" ? " admin" : ""}`}>{u.role}</span>
          </button>
        ))}
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--font-mono)" }}>
          Mot de passe : demo-helpdesk-2026
        </div>
      </div>
    </form>
  );
}
