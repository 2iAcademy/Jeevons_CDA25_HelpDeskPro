import type { TicketStatus } from "@/types";

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Ouvert",
  IN_PROGRESS: "En cours",
  ON_HOLD: "En attente",
  RESOLVED: "Résolu",
  CLOSED: "Fermé",
};

interface Props {
  status: TicketStatus;
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`badge status-${status}`}>
      <span className="dot" />
      {STATUS_LABELS[status]}
    </span>
  );
}
