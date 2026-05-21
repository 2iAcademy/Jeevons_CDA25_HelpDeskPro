export type Role = 'ADMIN' | 'TECHNICIAN';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED' | 'CLOSED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type Category = 'NETWORK' | 'HARDWARE' | 'SOFTWARE' | 'SECURITY' | 'OTHER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: Pick<User, 'id' | 'name' | 'role'>;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  client: string;
  status: TicketStatus;
  priority: Priority;
  category: Category;
  createdAt: string;
  updatedAt: string;
  assignedTo?: Pick<User, 'id' | 'name'> | null;
  createdBy: Pick<User, 'id' | 'name'>;
  comments?: Comment[];
}

export interface DashboardStats {
  byStatus: Record<TicketStatus, number>;
  byPriority: Record<Priority, number>;
  lateTickets: Ticket[];
}
