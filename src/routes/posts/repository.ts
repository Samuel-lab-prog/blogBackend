import { prisma } from '../../prisma/client.ts';
import { withPrismaErrorHandling } from '../../utils/AppError.ts';
import * as t from './types.ts';

export function insertPost(
  data: t.InsertPost
): Promise<{ id: number }> {
  return withPrismaErrorHandling<{ id: number }>(() =>
    prisma.post.create({
      data,
      select: { id: true },
    })
  );
}

export function selectPostById(id: number): Promise<t.PostFullRow | null> {
  return withPrismaErrorHandling<t.PostFullRow | null>(() =>
    prisma.post.findFirst({
      where: { id },
      include: t.fullPostRowInclude,
    })
  );
}

export function selectAllPostsPreviews(): Promise<t.PostPreview[]> {
  return withPrismaErrorHandling(() =>
    prisma.post.findMany({
      select: t.postPreviewSelect,
      orderBy: { createdAt: 'desc' },
    })
  );
}


