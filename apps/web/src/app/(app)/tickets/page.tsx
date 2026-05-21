import { auth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { Ticket, User } from "@/types";
import TicketsClient from "@/components/organisms/TicketsClient";

export default async function TicketsPage() {
  const session = await auth();

  const [tickets, users] = await Promise.all([
    apiFetch<Ticket[]>("/tickets"),
    apiFetch<User[]>("/users"),
  ]);

  const technicians = users.filter((u) => u.role === "TECHNICIAN");

  return (
    <div className="main">
      <header className="page-header">
        <div>
          <h1 className="page-title">Tickets</h1>
          <span className="page-sub">{tickets.length} tickets au total</span>
        </div>
      </header>

      <div className="page-content">
        <TicketsClient
          tickets={tickets}
          technicians={technicians}
          role={session!.user.role}
        />
      </div>
    </div>
  );
}
