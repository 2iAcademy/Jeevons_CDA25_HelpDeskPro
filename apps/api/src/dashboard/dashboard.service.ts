import { Injectable } from '@nestjs/common';
import { TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const tickets = await this.prisma.ticket.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        assignedToId: true,
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    const now = new Date();
    const LIMIT_MS = 48 * 60 * 60 * 1000;

    const byStatus = tickets.reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byPriority = tickets.reduce(
      (acc, t) => {
        acc[t.priority] = (acc[t.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // tickets OPEN ou IN_PROGRESS ouverts depuis plus de 48h
    const lateTickets = tickets.filter((t) => {
      const isActive = t.status === TicketStatus.OPEN || t.status === TicketStatus.IN_PROGRESS;
      const age = now.getTime() - new Date(t.createdAt).getTime();
      return isActive && age > LIMIT_MS;
    });

    // tickets sans technicien, hors résolu/fermé
    const unassignedCount = tickets.filter(
      (t) =>
        t.assignedToId === null &&
        t.status !== TicketStatus.RESOLVED &&
        t.status !== TicketStatus.CLOSED,
    ).length;

    const recentActivity = [...tickets]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        updatedAt: t.updatedAt,
        assignedTo: t.assignedTo,
        createdBy: t.createdBy,
      }));

    return {
      byStatus,
      byPriority,
      lateTickets,
      unassignedCount,
      recentActivity,
    };
  }
}
