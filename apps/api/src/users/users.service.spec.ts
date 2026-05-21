import { ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(mockPrisma as unknown as PrismaService);
  });

  it("lève ConflictException si l'email existe déjà", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });

    await expect(
      service.create({
        email: 'test@test.com',
        name: 'Test',
        password: 'password123',
        role: Role.TECHNICIAN,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("lève NotFoundException si l'utilisateur est introuvable", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(service.findOne('id-inexistant')).rejects.toBeInstanceOf(NotFoundException);
  });
});
