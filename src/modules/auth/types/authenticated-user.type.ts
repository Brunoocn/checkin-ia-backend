import { Role } from 'prisma/generated/client';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string | null;
}
