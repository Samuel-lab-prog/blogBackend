import type { Prisma } from '../../prisma/generated/client';
import type { UserCreateInput } from '../../prisma/generated/models';

export type InsertUser = UserCreateInput;
export type UserRow = Prisma.UserGetPayload<object>;
