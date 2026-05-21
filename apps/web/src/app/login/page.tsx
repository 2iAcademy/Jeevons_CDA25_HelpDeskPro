import { LoginForm } from "@/components/organisms/LoginForm";

export default function LoginPage() {
  return (
    <div className="login-screen">
      {/* Panneau gauche — hero sombre */}
      <aside className="login-aside">
        <div className="grid-bg" />
        <div className="l-brand">
          <div className="mark">H</div>
          <span>HelpDesk Pro</span>
        </div>
        <div className="hero">
          <p className="eyebrow">MicroSoft Solutions</p>
          <h1>Support informatique, centralisé.</h1>
          <p className="lead">
            Finis les e-mails perdus et les tableurs partagés. Suivez chaque
            demande, priorisez les urgences et gardez vos clients informés —
            depuis un seul outil.
          </p>
          <div className="stats">
            <div className="stat">
              <div className="n">45</div>
              <div className="l">Collaborateurs</div>
            </div>
            <div className="stat">
              <div className="n">10+</div>
              <div className="l">Clients actifs</div>
            </div>
            <div className="stat">
              <div className="n">48h</div>
              <div className="l">SLA moyen</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Panneau droit — formulaire */}
      <main className="login-main">
        <div className="login-card">
          <h2>Connexion</h2>
          <p className="sub">Accédez à votre espace de support.</p>
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
