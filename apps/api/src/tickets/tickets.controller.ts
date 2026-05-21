import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role, TicketStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // GET /tickets — liste avec filtres optionnels (admin + technicien)
  @Get()
  findAll(
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: string,
    @Query('assignedToId') assignedToId?: string,
  ) {
    return this.ticketsService.findAll({ status, priority, assignedToId });
  }

  // GET /tickets/stats — tableau de bord (admin uniquement)
  @Get('stats')
  @Roles(Role.ADMIN)
  getDashboardStats() {
    return this.ticketsService.getDashboardStats();
  }

  // GET /tickets/:id — détail d'un ticket avec commentaires
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.findOne(id);
  }

  // POST /tickets — création (admin uniquement, règle 2)
  @Post()
  @Roles(Role.ADMIN)
  create(
    @Body() dto: CreateTicketDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.ticketsService.create(dto, user.id);
  }

  // PATCH /tickets/:id/status — changement de statut (règles 3, 4)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.ticketsService.updateStatus(id, dto, user);
  }

  // PATCH /tickets/:id/assign — affectation technicien (admin uniquement)
  @Patch(':id/assign')
  @Roles(Role.ADMIN)
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTicketDto,
  ) {
    return this.ticketsService.assign(id, dto);
  }

  // DELETE /tickets/:id — suppression (admin uniquement)
  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.remove(id);
  }
}
