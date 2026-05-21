import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    ticketId: string,
    dto: CreateCommentDto,
    authorId: string,
  ) {
    // Vérification que le ticket existe
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException(`Ticket ${ticketId} introuvable`);

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        ticketId,
        authorId,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async remove(
    id: string,
    currentUser: { id: string; role: Role },
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });
    if (!comment) throw new NotFoundException(`Commentaire ${id} introuvable`);

    // Seul l'auteur ou un admin peut supprimer un commentaire
    if (
      currentUser.role !== Role.ADMIN &&
      comment.authorId !== currentUser.id
    ) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres commentaires',
      );
    }

    await this.prisma.comment.delete({ where: { id } });
  }
}
