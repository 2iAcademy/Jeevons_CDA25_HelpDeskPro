"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Ticket, TicketStatus, Priority, Role } from "@/types";
import StatusBadge from "@/components/atoms/StatusBadge";
import PriorityBadge from "@/components/atoms/PriorityBadge";
import Select from "@/components/atoms/Select";

// ── Helpers ──────────────────────────────────────────────────
function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function isOverdue(ticket: Ticket) {
  const LIMIT_MS = 48 * 60 * 60 * 1000;
  const isActive =
    ticket.status === "OPEN" || ticket.status === "IN_PROGRESS";
  const age = Date.now() - new Date(ticket.createdAt).getTime();
  return isActive && age > LIMIT_MS;
}

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

// ── Modal nouveau ticket ──────────────────────────────────────
const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Basse", MEDIUM: "Moyenne", HIGH: "Haute", CRITICAL: "Critique",
};
const CATEGORIES = ["NETWORK", "HARDWARE", "SOFTWARE", "SECURITY", "OTHER"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  NETWORK: "Réseau", HARDWARE: "Matériel", SOFTWARE: "Logiciel",
  SECURITY: "Sécurité", OTHER: "Autre",
};

interface NewTicketModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function NewTicketModal({ onClose, onCreated }: NewTicketModalProps) {
  const [form, setForm] = useState({
    title: "", description: "", client: "",
    priority: "MEDIUM" as Priority,
    category: "SOFTWARE",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function update(k: string, val: string) {
    setForm((f) => ({ ...f, [k]: val }));
    setErrors((e) => ({ ...e, [k]: "" }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Le titre est requis.";
    else if (form.title.trim().length < 6) errs.title = "Minimum 6 caractères.";
    if (!form.description.trim()) errs.description = "La description est requise.";
    else if (form.description.trim().length < 12) errs.description = "Minimum 12 caractères.";
    if (!form.client.trim()) errs.client = "Le nom du client est requis.";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    startTransition(async () => {
      try {
        const res = await fetch("/api/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
        onCreated();
        onClose();
      } catch {
        setErrors({ form: "Une erreur est survenue, réessayez." });
      }
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>Nouveau ticket</h3>
            <p className="lead">Renseignez les informations transmises par le client.</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fermer">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 2l12 12M14 2L2 14" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="modal-body" noValidate>
          {errors.form && <p className="err">{errors.form}</p>}

          <div className="field">
            <label htmlFor="nt-title">Titre *</label>
            <input id="nt-title" type="text" className={`input${errors.title ? " error" : ""}`}
              placeholder="Ex. Imprimante hors-ligne sur le poste comptabilité"
              value={form.title} onChange={(e) => update("title", e.target.value)} />
            {errors.title
              ? <span className="err">{errors.title}</span>
              : <span style={{ fontSize: "11.5px", color: "var(--ink-3)" }}>Résumez le problème en une phrase claire.</span>}
          </div>

          <div className="field">
            <label htmlFor="nt-desc">Description *</label>
            <textarea id="nt-desc" className={`textarea${errors.description ? " error" : ""}`}
              placeholder="Symptômes, contexte, étapes déjà testées…"
              rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} />
            {errors.description && <span className="err">{errors.description}</span>}
          </div>

          <div className="field">
            <label htmlFor="nt-client">Client *</label>
            <input id="nt-client" type="text" className={`input${errors.client ? " error" : ""}`}
              placeholder="Raison sociale de l'entreprise cliente"
              value={form.client} onChange={(e) => update("client", e.target.value)} />
            {errors.client && <span className="err">{errors.client}</span>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field">
              <label>Priorité *</label>
              <Select
                value={form.priority}
                onChange={(v) => update("priority", v)}
                options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
              />
            </div>
            <div className="field">
              <label>Catégorie *</label>
              <Select
                value={form.category}
                onChange={(v) => update("category", v)}
                options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
              />
            </div>
          </div>

          <div style={{
            padding: "10px 12px", borderRadius: 8,
            background: "var(--surface-2)", border: "1px solid var(--border)",
            fontSize: 12.5, color: "var(--ink-3)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6" /><path d="M8 7v4M8 5.5v.5" strokeLinecap="round" />
            </svg>
            Le ticket sera créé au statut <strong style={{ color: "var(--ink-1)", fontWeight: 500 }}>Ouvert</strong> et non assigné.
          </div>
        </form>

        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>Annuler</button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={pending}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2v12M2 8h12" strokeLinecap="round" />
            </svg>
            {pending ? "Création…" : "Créer le ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────
const STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED"];
const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Ouvert", IN_PROGRESS: "En cours", ON_HOLD: "En attente",
  RESOLVED: "Résolu", CLOSED: "Fermé",
};

interface User { id: string; name: string; }

interface Props {
  tickets: Ticket[];
  technicians: User[];
  role: Role;
}

export default function TicketsClient({ tickets, technicians, role }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [newTicketOpen, setNewTicketOpen] = useState(false);

  const filtered = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (assigneeFilter === "none" && t.assignedTo) return false;
    if (assigneeFilter !== "all" && assigneeFilter !== "none" && t.assignedTo?.id !== assigneeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(t.title.toLowerCase().includes(q) || t.client.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const hasActiveFilters = statusFilter !== "all" || priorityFilter !== "all" || assigneeFilter !== "all" || search !== "";

  function resetFilters() {
    setSearch(""); setStatusFilter("all"); setPriorityFilter("all"); setAssigneeFilter("all");
  }

  return (
    <>
      {/* Barre de filtres */}
      <div className="filters">
        <div className="search">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6.5" cy="6.5" r="4.5" /><path d="M11 11l3 3" strokeLinecap="round" />
          </svg>
          <input type="text" placeholder="Rechercher par titre, client…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="filter-pill">
          <span className="label-key">Statut</span>
          <Select
            variant="inline"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as TicketStatus | "all")}
            options={[
              { value: "all", label: "Tous" },
              ...STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
            ]}
          />
        </div>

        <div className="filter-pill">
          <span className="label-key">Priorité</span>
          <Select
            variant="inline"
            value={priorityFilter}
            onChange={(v) => setPriorityFilter(v as Priority | "all")}
            options={[
              { value: "all", label: "Toutes" },
              ...PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] })),
            ]}
          />
        </div>

        <div className="filter-pill">
          <span className="label-key">Technicien</span>
          <Select
            variant="inline"
            value={assigneeFilter}
            onChange={setAssigneeFilter}
            options={[
              { value: "all", label: "Tous" },
              { value: "none", label: "Non assigné" },
              ...technicians.map((u) => ({ value: u.id, label: u.name })),
            ]}
          />
        </div>

        {hasActiveFilters && (
          <button className="btn btn-ghost btn-sm" onClick={resetFilters}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 2l12 12M14 2L2 14" strokeLinecap="round" />
            </svg>
            Réinitialiser
          </button>
        )}

        <div style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {filtered.length} / {tickets.length}
        </div>

        {role === "ADMIN" && (
          <button className="btn btn-primary" onClick={() => setNewTicketOpen(true)}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2v12M2 8h12" strokeLinecap="round" />
            </svg>
            Nouveau ticket
          </button>
        )}
      </div>

      {/* Tableau */}
      {filtered.length === 0 ? (
        <div className="card empty">Aucun ticket ne correspond à vos filtres.</div>
      ) : (
        <table className="tickets-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th>Sujet</th>
              <th style={{ width: 110 }}>Priorité</th>
              <th style={{ width: 130 }}>Statut</th>
              <th style={{ width: 180 }}>Technicien</th>
              <th style={{ width: 110 }}>Créé</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="row" onClick={() => router.push(`/tickets/${t.id}`)}>
                <td><span className="tk-id">{t.id.slice(0, 8)}</span></td>
                <td>
                  <div className="tk-title">
                    {t.title}
                    {isOverdue(t) && (
                      <span className="tk-overdue">
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M8 2l6 12H2L8 2z" /><path d="M8 7v3M8 12v.5" strokeLinecap="round" />
                        </svg>
                        En retard
                      </span>
                    )}
                  </div>
                  <div className="tk-client">{t.client} · {t.category}</div>
                </td>
                <td><PriorityBadge priority={t.priority} /></td>
                <td><StatusBadge status={t.status} /></td>
                <td>
                  {t.assignedTo ? (
                    <span className="tk-tech">
                      <span className="avatar" style={{ width: 22, height: 22, fontSize: 10 }}>
                        {initials(t.assignedTo.name)}
                      </span>
                      {t.assignedTo.name}
                    </span>
                  ) : (
                    <span className="tk-tech unassigned">Non assigné</span>
                  )}
                </td>
                <td><span className="tk-date">{shortDate(t.createdAt)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal nouveau ticket */}
      {newTicketOpen && (
        <NewTicketModal
          onClose={() => setNewTicketOpen(false)}
          onCreated={() => router.refresh()}
        />
      )}
    </>
  );
}
