import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TicketStatus, Priority, Category, Role } from '@prisma/client';
import { TicketsService } from './tickets.service';

// On crée un faux PrismaService pour ne pas toucher à la vraie base de données
const mockPrisma = {
  ticket: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

// Ticket de base réutilisé dans les tests
const baseTicket = {
  id: 'ticket-123',
  title: 'Écran noir au démarrage',
  description: 'Le poste du service comptabilité ne démarre plus.',
  client: 'Dupont & Associés',
  status: TicketStatus.OPEN,
  priority: Priority.HIGH,
  category: Category.HARDWARE,
  assignedToId: null,
  createdById: 'user-admin',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TicketsService — règles métier', () => {
  let service: TicketsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TicketsService(mockPrisma as any);
  });

  // ─────────────────────────────────────────────────────────────
  // Règle 2 : à la création, le statut est toujours OPEN
  // ─────────────────────────────────────────────────────────────
  it('R2 — crée un ticket avec le statut OPEN, quelle que soit la demande', async () => {
    const dto = {
      title: 'Écran noir au démarrage',
      description: 'Le poste du service comptabilité ne démarre plus.',
      client: 'Dupont & Associés',
      priority: Priority.HIGH,
      category: Category.HARDWARE,
    };

    mockPrisma.ticket.create.mockResolvedValue({ ...baseTicket, status: TicketStatus.OPEN });

    await service.create(dto, 'user-admin');

    // Vérification : peu importe ce qu'on passe, le status doit être OPEN
    expect(mockPrisma.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: TicketStatus.OPEN }),
      }),
    );
  });

  // ─────────────────────────────────────────────────────────────
  // Règle 3 : impossible de passer en IN_PROGRESS sans technicien
  // ─────────────────────────────────────────────────────────────
  it("R3 — refuse le passage en IN_PROGRESS si aucun technicien n'est affecté", async () => {
    // Le ticket n'a pas de technicien (assignedToId = null)
    mockPrisma.ticket.findUnique.mockResolvedValue({ ...baseTicket, assignedToId: null });

    await expect(
      service.updateStatus(
        'ticket-123',
        { status: TicketStatus.IN_PROGRESS },
        { id: 'user-admin', role: Role.ADMIN },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // ─────────────────────────────────────────────────────────────
  // Règle 4 : un ticket CLOSED ne peut plus être modifié
  // ─────────────────────────────────────────────────────────────
  it('R4 — refuse toute modification de statut sur un ticket fermé', async () => {
    // Le ticket est déjà fermé
    mockPrisma.ticket.findUnique.mockResolvedValue({
      ...baseTicket,
      status: TicketStatus.CLOSED,
    });

    await expect(
      service.updateStatus(
        'ticket-123',
        { status: TicketStatus.RESOLVED },
        { id: 'user-admin', role: Role.ADMIN },
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
