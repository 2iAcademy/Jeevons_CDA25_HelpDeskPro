import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { Ticket, TicketStatus, Priority } from "@/types";
import DashboardClient from "@/components/organisms/DashboardClient";

interface DashboardStats {
  byStatus: Partial<Record<TicketStatus, number>>;
  byPriority: Partial<Record<Priority, number>>;
  lateTickets: Ticket[];
  unassignedCount: number;
  recentActivity: Ticket[];
}

export default async function DashboardPage() {
  const session = await auth();

  // Dashboard réservé aux admins
  if (session?.user.role !== "ADMIN") {
    redirect("/tickets");
  }

  const stats = await apiFetch<DashboardStats>("/dashboard");

  return (
    <div className="main">
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <span className="page-sub">Vue d&apos;ensemble — MicroSoft Solutions</span>
        </div>
      </header>

      <div className="page-content">
        <DashboardClient stats={stats} />
      </div>
    </div>
  );
}
