import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
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
