"use client";

import { useRouter } from "next/navigation";
import type { Ticket, TicketStatus, Priority } from "@/types";

// ── Types ─────────────────────────────────────────────────────
interface Stats {
  byStatus: Partial<Record<TicketStatus, number>>;
  byPriority: Partial<Record<Priority, number>>;
  lateTickets: Ticket[];
  unassignedCount: number;
  recentActivity: Ticket[];
}

interface Props {
  stats: Stats;
}

// ── Helpers ───────────────────────────────────────────────────
function hoursSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs} h`;
  return `il y a ${Math.floor(hrs / 24)} j`;
}

// ── Données d'affichage ───────────────────────────────────────
const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Ouvert",
  IN_PROGRESS: "En cours",
  ON_HOLD: "En attente",
  RESOLVED: "Résolu",
  CLOSED: "Fermé",
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: "var(--st-open)",
  IN_PROGRESS: "var(--st-progress)",
  ON_HOLD: "var(--st-waiting)",
  RESOLVED: "var(--st-resolved)",
  CLOSED: "var(--st-closed)",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL: "Critique",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: "var(--pr-low)",
  MEDIUM: "var(--pr-medium)",
  HIGH: "var(--pr-high)",
  CRITICAL: "var(--pr-critical)",
};

const STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED"];
const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function DashboardClient({ stats }: Props) {
  const router = useRouter();

  const { byStatus, byPriority, lateTickets, unassignedCount } = stats;

  const totalActive =
    (byStatus.OPEN ?? 0) + (byStatus.IN_PROGRESS ?? 0) + (byStatus.ON_HOLD ?? 0);
  const total = STATUSES.reduce((s, k) => s + (byStatus[k] ?? 0), 0);

  const maxStatus = Math.max(...STATUSES.map((s) => byStatus[s] ?? 0), 1);
  const maxPriority = Math.max(...PRIORITIES.map((p) => byPriority[p] ?? 0), 1);

  const kpis = [
    {
      label: "Tickets actifs",
      value: totalActive,
      foot: `sur ${total} au total`,
      color: "var(--accent)",
    },
    {
      label: "En cours",
      value: byStatus.IN_PROGRESS ?? 0,
      foot: "Pris en charge",
      color: "var(--st-progress)",
    },
    {
      label: "Non assignés",
      value: unassignedCount,
      foot: "À affecter",
      color: "var(--st-open)",
    },
    {
      label: "En retard",
      value: lateTickets.length,
      foot: "> 48 h sans clôture",
      color: "oklch(60% 0.18 25)",
    },
  ];

  return (
    <div>
      {/* KPIs */}
      <div className="kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="kpi">
            <span className="k-accent" style={{ background: k.color }} />
            <div className="k-label">{k.label}</div>
            <div className="k-value">{k.value}</div>
            <div className="k-foot">{k.foot}</div>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div className="dash-grid">
        {/* Par statut */}
        <div className="card">
          <div className="card-head">
            <h3>Tickets par statut</h3>
            <span className="sub">{total} tickets</span>
          </div>
          <div className="bar-chart">
            {STATUSES.map((s) => (
              <div key={s} className="bar-row">
                <span className="name">{STATUS_LABELS[s]}</span>
                <div className="track">
                  <div
                    className="fill"
                    style={{
                      width: `${((byStatus[s] ?? 0) / maxStatus) * 100}%`,
                      background: STATUS_COLORS[s],
                    }}
                  />
                </div>
                <span className="num">{byStatus[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Par priorité */}
        <div className="card">
          <div className="card-head">
            <h3>Tickets par priorité</h3>
            <span className="sub">Charge actuelle</span>
          </div>
          <div className="bar-chart">
            {PRIORITIES.map((p) => (
              <div key={p} className="bar-row">
                <span className="name">{PRIORITY_LABELS[p]}</span>
                <div className="track">
                  <div
                    className="fill"
                    style={{
                      width: `${((byPriority[p] ?? 0) / maxPriority) * 100}%`,
                      background: PRIORITY_COLORS[p],
                    }}
                  />
                </div>
                <span className="num">{byPriority[p] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tickets en retard */}
      <div className="card">
        <div className="card-head" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h3>Tickets en retard</h3>
            <span className="sub">
              {lateTickets.length} {lateTickets.length > 1 ? "tickets" : "ticket"}
            </span>
          </div>
          <span className="muted-row">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6" />
              <path d="M8 5v3.5l2 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Seuil 48 h
          </span>
        </div>

        {lateTickets.length === 0 ? (
          <div className="empty">Aucun ticket en retard. 👌</div>
        ) : (
          <div className="overdue-list">
            {lateTickets.map((t) => (
              <div
                key={t.id}
                className="overdue-row"
                onClick={() => router.push(`/tickets/${t.id}`)}
              >
                <div>
                  <div className="ttl">{t.title}</div>
                  <div className="sub">
                    <span>{t.id.slice(0, 8)}</span>
                    <span>·</span>
                    <span>{t.client}</span>
                    <span>·</span>
                    <span>{t.assignedTo?.name ?? "Non assigné"}</span>
                  </div>
                </div>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 12.5, fontWeight: 500, color: "var(--pr-critical)",
                }}>
                  {t.priority}
                </span>
                <span className="age">{hoursSince(t.createdAt)} h</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
