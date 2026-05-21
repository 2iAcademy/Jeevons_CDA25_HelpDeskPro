"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Ticket, Comment, TicketStatus, Role } from "@/types";
import StatusBadge from "@/components/atoms/StatusBadge";
import PriorityBadge from "@/components/atoms/PriorityBadge";

// ── Helpers ───────────────────────────────────────────────────
function shortDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs} h`;
  return `il y a ${Math.floor(hrs / 24)} j`;
}

function isOverdue(ticket: Ticket) {
  const LIMIT_MS = 48 * 60 * 60 * 1000;
  const isActive = ticket.status === "OPEN" || ticket.status === "IN_PROGRESS";
  return isActive && Date.now() - new Date(ticket.createdAt).getTime() > LIMIT_MS;
}

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const CATEGORY_LABELS: Record<string, string> = {
  NETWORK: "Réseau", HARDWARE: "Matériel", SOFTWARE: "Logiciel",
  SECURITY: "Sécurité", OTHER: "Autre",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Ouvert", IN_PROGRESS: "En cours", ON_HOLD: "En attente",
  RESOLVED: "Résolu", CLOSED: "Fermé",
};

const STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED"];

// ── Props ─────────────────────────────────────────────────────
interface CurrentUser { id: string; role: Role; name?: string | null; }
interface Technician { id: string; name: string; }

interface Props {
  ticket: Ticket & { comments: Comment[] };
  technicians: Technician[];
  currentUser: CurrentUser;
}

export default function TicketDetailClient({ ticket: initial, technicians, currentUser }: Props) {
  const router = useRouter();
  const [ticket, setTicket] = useState(initial);
  const [comments, setComments] = useState<Comment[]>(initial.comments ?? []);
  const [commentText, setCommentText] = useState("");
  const [statusMenu, setStatusMenu] = useState(false);
  const [assignMenu, setAssignMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const statusRef = useRef<HTMLDivElement>(null);
  const assignRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser.role === "ADMIN";
  const isClosed = ticket.status === "CLOSED";
  const canEdit = !isClosed && (isAdmin || ticket.assignedTo?.id === currentUser.id);

  // Fermer les menus au clic extérieur
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusMenu(false);
      if (assignRef.current && !assignRef.current.contains(e.target as Node)) setAssignMenu(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Actions ─────────────────────────────────────────────────
  function changeStatus(status: TicketStatus) {
    setStatusMenu(false);
    startTransition(async () => {
      const res = await fetch(`/api/tickets/${ticket.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTicket((t) => ({ ...t, ...updated, comments: t.comments }));
      }
    });
  }

  function assignTo(assignedToId: string | null) {
    setAssignMenu(false);
    startTransition(async () => {
      const res = await fetch(`/api/tickets/${ticket.id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTicket((t) => ({ ...t, ...updated, comments: t.comments }));
      }
    });
  }

  function submitComment(e?: React.FormEvent) {
    e?.preventDefault();
    if (!commentText.trim()) return;
    const content = commentText.trim();
    setCommentText("");
    startTransition(async () => {
      const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((c) => [...c, comment]);
      }
    });
  }

  function handleCommentKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitComment();
  }

  function deleteTicket() {
    startTransition(async () => {
      await fetch(`/api/tickets/${ticket.id}`, { method: "DELETE" });
      router.push("/tickets");
      router.refresh();
    });
  }

  // ── Statut autorisé ──────────────────────────────────────────
  function statusAllowed(s: TicketStatus) {
    if (s === ticket.status) return false;
    if (s === "IN_PROGRESS" && !ticket.assignedTo) return false;
    return true;
  }

  return (
    <div>
      {/* Retour */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <Link href="/tickets" className="btn btn-ghost btn-sm">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Tous les tickets
        </Link>
      </div>

      <div className="detail-grid">
        {/* Colonne principale */}
        <div>
          <div className="detail-head">
            <div style={{ flex: 1 }}>
              <div className="meta-row">
                <span>{ticket.id.slice(0, 8)}</span>
                <span>·</span>
                <span>{CATEGORY_LABELS[ticket.category] ?? ticket.category}</span>
                <span>·</span>
                <span>Créé {timeAgo(ticket.createdAt)}</span>
                {isOverdue(ticket) && (
                  <>
                    <span>·</span>
                    <span style={{ color: "oklch(50% 0.18 25)" }}>
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ display: "inline", marginRight: 3 }}>
                        <path d="M8 2l6 12H2L8 2z" /><path d="M8 7v3M8 12v.5" strokeLinecap="round" />
                      </svg>
                      En retard
                    </span>
                  </>
                )}
              </div>
              <h1 className="detail-title">{ticket.title}</h1>
            </div>
          </div>

          {/* Description */}
          <div className="card card-pad">
            <div className="muted-row" style={{ marginBottom: 10 }}>
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6" /><path d="M8 7v4M8 5.5v.5" strokeLinecap="round" />
              </svg>
              Description
            </div>
            <div className="detail-body">{ticket.description}</div>
          </div>

          {/* Timeline commentaires */}
          <section className="comments">
            <div className="comments-h">
              <h3>Commentaires &amp; interventions</h3>
              <span className="count">{comments.length}</span>
            </div>

            <div className="timeline">
              {/* Événement création */}
              <div className="tl-event">
                <span className="dot" style={{ background: "var(--accent)" }} />
                <div className="text">
                  <strong>Ticket créé</strong>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-4)", marginLeft: 8 }}>
                    {shortDateTime(ticket.createdAt)}
                  </span>
                </div>
              </div>

              {comments.length === 0 && !isClosed && (
                <div style={{ padding: "10px 0 18px 42px", color: "var(--ink-3)", fontSize: 13 }}>
                  Aucun commentaire pour le moment.
                </div>
              )}

              {comments.map((c) => (
                <div key={c.id} className="tl-item">
                  <div className="avatar">{initials(c.author.name)}</div>
                  <div className="bubble">
                    <div className="meta">
                      <span className="author">{c.author.name}</span>
                      <span className="role-tag">{c.author.role === "ADMIN" ? "Admin" : "Tech"}</span>
                      <span className="when">{shortDateTime(c.createdAt)}</span>
                    </div>
                    <div className="body">{c.content}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulaire commentaire */}
            {canEdit ? (
              <form className="comment-form" onSubmit={submitComment} style={{ marginTop: 8 }}>
                <div className="avatar">{initials(currentUser.name)}</div>
                <div className="box">
                  <textarea
                    placeholder="Ajouter un commentaire ou décrire votre intervention…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={handleCommentKey}
                    rows={3}
                  />
                  <div className="actions">
                    <span className="hint">Cmd / Ctrl + Entrée pour envoyer</span>
                    <button type="submit" className="btn btn-sm" style={{ background: "var(--accent)", borderColor: "var(--accent)", color: "white" }}
                      disabled={!commentText.trim() || pending}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2L2 8l4 2 6-6-6 6 2 4z" strokeLinejoin="round" />
                      </svg>
                      Publier
                    </button>
                  </div>
                </div>
              </form>
            ) : isClosed ? (
              <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: "var(--r-md)", border: "1px dashed var(--border-strong)", color: "var(--ink-3)", fontSize: 12.5, display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8" cy="8" r="6" /><path d="M8 7v4M8 5.5v.5" strokeLinecap="round" />
                </svg>
                Ce ticket est fermé. Il ne peut plus être modifié.
              </div>
            ) : (
              <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: "var(--r-md)", border: "1px dashed var(--border-strong)", color: "var(--ink-3)", fontSize: 12.5, display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8" cy="8" r="6" /><path d="M8 7v4M8 5.5v.5" strokeLinecap="round" />
                </svg>
                Ce ticket ne vous est pas affecté. Vous pouvez seulement consulter.
              </div>
            )}
          </section>
        </div>

        {/* Panneau latéral */}
        <aside className="side card card-pad">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Informations</span>
            {isAdmin && !isClosed && (
              <button className="btn btn-ghost btn-sm btn-danger" onClick={() => setConfirmDelete(true)}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-9" strokeLinecap="round" />
                </svg>
                Supprimer
              </button>
            )}
          </div>

          {/* Statut */}
          <div className="row">
            <span className="k">Statut</span>
            <span className="v" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <StatusBadge status={ticket.status} />
              {canEdit && (
                <div className="status-changer" ref={statusRef}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setStatusMenu((v) => !v)}>
                    Changer
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 6l4 4 4-4" strokeLinecap="round" />
                    </svg>
                  </button>
                  {statusMenu && (
                    <div className="status-menu">
                      <div className="menu-sub">Nouveau statut</div>
                      {STATUSES.map((s) => {
                        const disabled = !statusAllowed(s);
                        const tooltip = s === "IN_PROGRESS" && !ticket.assignedTo ? "Assignez un technicien d'abord" : undefined;
                        return (
                          <button key={s} disabled={disabled} title={tooltip} onClick={() => changeStatus(s)}>
                            <StatusBadge status={s} />
                            {s === ticket.status && (
                              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ marginLeft: "auto" }}>
                                <path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </span>
          </div>

          {/* Priorité */}
          <div className="row">
            <span className="k">Priorité</span>
            <span className="v"><PriorityBadge priority={ticket.priority} /></span>
          </div>

          {/* Catégorie */}
          <div className="row">
            <span className="k">Catégorie</span>
            <span className="v">{CATEGORY_LABELS[ticket.category] ?? ticket.category}</span>
          </div>

          {/* Client */}
          <div className="row">
            <span className="k">Client</span>
            <span className="v">{ticket.client}</span>
          </div>

          {/* Technicien */}
          <div className="row">
            <span className="k">Technicien</span>
            <span className="v" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              {ticket.assignedTo ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span className="avatar" style={{ width: 22, height: 22, fontSize: 10 }}>
                    {initials(ticket.assignedTo.name)}
                  </span>
                  {ticket.assignedTo.name}
                </span>
              ) : (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Non assigné
                </span>
              )}
              {isAdmin && !isClosed && (
                <div className="status-changer" ref={assignRef}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setAssignMenu((v) => !v)}>
                    {ticket.assignedTo ? "Réaffecter" : "Affecter"}
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 6l4 4 4-4" strokeLinecap="round" />
                    </svg>
                  </button>
                  {assignMenu && (
                    <div className="status-menu" style={{ width: 220 }}>
                      <div className="menu-sub">Affecter à</div>
                      <button onClick={() => assignTo(null)}>
                        <span style={{ color: "var(--ink-3)" }}>Non assigné</span>
                        {!ticket.assignedTo && (
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ marginLeft: "auto" }}>
                            <path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <div className="menu-divider" />
                      {technicians.map((u) => (
                        <button key={u.id} onClick={() => assignTo(u.id)}>
                          <span className="avatar" style={{ width: 22, height: 22, fontSize: 10 }}>{initials(u.name)}</span>
                          <span>{u.name}</span>
                          {u.id === ticket.assignedTo?.id && (
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ marginLeft: "auto" }}>
                              <path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </span>
          </div>

          {/* Dates */}
          <div className="row">
            <span className="k">Créé</span>
            <span className="v" style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 400 }}>
              {shortDateTime(ticket.createdAt)}
            </span>
          </div>
          <div className="row">
            <span className="k">Mis à jour</span>
            <span className="v" style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 400 }}>
              {timeAgo(ticket.updatedAt)}
            </span>
          </div>
        </aside>
      </div>

      {/* Modale confirmation suppression */}
      {confirmDelete && (
        <div className="modal-backdrop" onClick={() => setConfirmDelete(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>Supprimer ce ticket ?</h3>
                <p className="lead">
                  Cette action est définitive. Le ticket et tous ses commentaires seront supprimés.
                </p>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setConfirmDelete(false)}>Annuler</button>
              <button className="btn btn-primary" style={{ background: "oklch(50% 0.18 25)", borderColor: "oklch(50% 0.18 25)" }}
                onClick={deleteTicket} disabled={pending}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-9" strokeLinecap="round" />
                </svg>
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
