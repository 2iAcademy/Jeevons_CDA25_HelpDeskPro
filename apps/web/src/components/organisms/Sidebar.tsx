"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Role } from "@/types";

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
    role: Role;
  };
}

// Initiales depuis le nom complet
function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrateur",
  TECHNICIAN: "Technicien",
};

export default function Sidebar({ user }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside className="sidebar">
      {/* Bloc brand */}
      <div className="brand">
        <div className="brand-mark">H</div>
        <div>
          <div className="brand-name">HelpDesk Pro</div>
          <div className="brand-sub">MicroSoft Solutions</div>
        </div>
      </div>

      {/* Navigation principale */}
      <nav className="nav-section">
        <div className="nav-label">Pilotage</div>

        {user.role === "ADMIN" && (
          <Link
            href="/dashboard"
            className={`nav-item${isActive("/dashboard") ? " active" : ""}`}
          >
            <svg
              className="icon"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="1" y="1" width="6" height="6" rx="1.5" />
              <rect x="9" y="1" width="6" height="6" rx="1.5" />
              <rect x="1" y="9" width="6" height="6" rx="1.5" />
              <rect x="9" y="9" width="6" height="6" rx="1.5" />
            </svg>
            Dashboard
          </Link>
        )}

        <Link
          href="/tickets"
          className={`nav-item${isActive("/tickets") ? " active" : ""}`}
        >
          <svg
            className="icon"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M2 4h12M2 8h8M2 12h5" strokeLinecap="round" />
          </svg>
          Tickets
        </Link>
      </nav>

      {/* Bloc utilisateur */}
      <div className="sidebar-user">
        <div className="avatar">{initials(user.name)}</div>
        <div className="who">
          <span className="name">{user.name ?? user.email}</span>
          <span className="role">{ROLE_LABELS[user.role]}</span>
        </div>
        <button
          className="logout"
          title="Se déconnecter"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"
              strokeLinecap="round"
            />
            <path
              d="M11 11l3-3-3-3M14 8H6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </aside>
  );
}
