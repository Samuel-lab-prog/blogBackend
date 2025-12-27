import { prisma } from '@prisma/client';
import { withPrismaErrorHandling } from '@utils';
import * as t from './types.ts';

export function selectUser(
	identifier: t.UserUniqueKey,
): Promise<t.UserRow | null> {
	return withPrismaErrorHandling<t.UserRow | null>(() =>
		prisma.user.findUnique({
			where: { ...identifier },
		}),
	);
}
