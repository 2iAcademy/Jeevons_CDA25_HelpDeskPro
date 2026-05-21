import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TicketStatus, Role, Priority } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';

// champs retournés sur tous les appels — on n'expose pas les id internes inutiles
const ticketSelect = {
  id: true,
  title: true,
  description: true,
  client: true,
  status: true,
  priority: true,
  category: true,
  createdAt: true,
  updatedAt: true,
  assignedTo: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true } },
  _count: { select: { comments: true } },
};

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: { status?: TicketStatus; priority?: Priority; assignedToId?: string }) {
    return this.prisma.ticket.findMany({
      where: {
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.assignedToId && { assignedToId: filters.assignedToId }),
      },
      select: ticketSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      select: {
        ...ticketSelect,
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) throw new NotFoundException(`Ticket ${id} introuvable`);
    return ticket;
  }

  async create(dto: CreateTicketDto, createdById: string) {
    // statut forcé à OPEN à la création, peu importe ce qui est passé
    return this.prisma.ticket.create({
      data: {
        ...dto,
        status: TicketStatus.OPEN,
        createdById,
      },
      select: ticketSelect,
    });
  }

  async updateStatus(id: string, dto: UpdateStatusDto, currentUser: { id: string; role: Role }) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket ${id} introuvable`);

    if (ticket.status === TicketStatus.CLOSED) {
      throw new ForbiddenException('Un ticket fermé ne peut plus être modifié');
    }

    if (dto.status === TicketStatus.IN_PROGRESS && !ticket.assignedToId) {
      throw new BadRequestException(
        'Le ticket doit être affecté à un technicien avant de passer en cours',
      );
    }

    if (currentUser.role === Role.TECHNICIAN && ticket.assignedToId !== currentUser.id) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres tickets');
    }

    return this.prisma.ticket.update({
      where: { id },
      data: { status: dto.status },
      select: ticketSelect,
    });
  }

  async assign(id: string, dto: AssignTicketDto) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket ${id} introuvable`);

    if (ticket.status === TicketStatus.CLOSED) {
      throw new ForbiddenException('Un ticket fermé ne peut plus être modifié');
    }

    return this.prisma.ticket.update({
      where: { id },
      data: { assignedToId: dto.assignedToId },
      select: ticketSelect,
    });
  }

  async remove(id: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket ${id} introuvable`);

    await this.prisma.ticket.delete({ where: { id } });
  }

  async getDashboardStats() {
    const tickets = await this.prisma.ticket.findMany({
      select: { ...ticketSelect },
    });

    const now = new Date();
    const LIMIT_MS = 48 * 60 * 60 * 1000;

    const lateTickets = tickets.filter((t) => {
      const isActive = t.status === TicketStatus.OPEN || t.status === TicketStatus.IN_PROGRESS;
      const age = now.getTime() - new Date(t.createdAt).getTime();
      return isActive && age > LIMIT_MS;
    });

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

    return { byStatus, byPriority, lateTickets };
  }
}
