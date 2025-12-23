import type { Prisma, UserCreateInput } from '@prisma';

export type InsertUser = UserCreateInput;
export type UserRow = Prisma.UserGetPayload<object>;

export type UserFilter = {
  selectBy: UserUniqueKey | 'all';
};

type Without<T, U> = {
  [P in Exclude<keyof T, keyof U>]?: never;
};

type XOR<T, U> = (T & Without<U, T>) | (U & Without<T, U>);

export type UserUniqueKey = XOR<{ id: number }, { email: string }>;
