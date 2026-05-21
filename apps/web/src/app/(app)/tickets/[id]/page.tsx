import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { Ticket, Comment, User } from "@/types";
import TicketDetailClient from "@/components/organisms/TicketDetailClient";

type TicketWithComments = Ticket & { comments: Comment[] };

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  let ticket: TicketWithComments;
  try {
    ticket = await apiFetch<TicketWithComments>(`/tickets/${id}`);
  } catch {
    notFound();
  }

  const technicians = await apiFetch<User[]>("/users/technicians");

  return (
    <div className="main">
      <header className="page-header">
        <div>
          <h1 className="page-title">{ticket.title}</h1>
          <span className="page-sub">{ticket.client}</span>
        </div>
      </header>

      <div className="page-content">
        <TicketDetailClient
          ticket={ticket}
          technicians={technicians}
          currentUser={{
            id: session!.user.id,
            role: session!.user.role,
            name: session!.user.name,
          }}
        />
      </div>
    </div>
  );
}
