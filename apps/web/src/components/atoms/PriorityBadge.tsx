import type { Priority } from "@/types";

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL: "Critique",
};

interface Props {
  priority: Priority;
}

export default function PriorityBadge({ priority }: Props) {
  return (
    <span className={`priority priority-${priority}`}>
      <span className="bars">
        <span />
        <span />
        <span />
        <span />
      </span>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
