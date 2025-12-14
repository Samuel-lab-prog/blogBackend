import { prisma } from '../../prisma/client.ts';
import { withPrismaErrorHandling } from '../../utils/AppError.ts';
import type { UserRow } from './types.ts';

export function selectUserByEmail(email: string): Promise<UserRow | null> {
  return withPrismaErrorHandling<UserRow | null>(() =>
    prisma.user.findFirst({
      where: { email },
    })
  );
}
prisma.user.create({
  data: {
    email: 'martinsmiranha@gmail.com',
    password: '$2b$10$8sDqN.ba5SQB4xNh4wXP.eFkC3gCfd2JhyOj1bue/Fd7lQxpJDCjW'
  }
})