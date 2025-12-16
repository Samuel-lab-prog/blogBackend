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

export function selectPostBySlug(slug: string): Promise<t.PostFullRow | null> {
  return withPrismaErrorHandling<t.PostFullRow | null>(() =>
    prisma.post.findFirst({
      where: { slug, deletedAt: null, status: 'published' },
      include: t.fullPostRowInclude,
    })
  );
}

export function selectAllPublishedPostsPreviews(): Promise<t.PostPreview[]> {
  return withPrismaErrorHandling(() =>
    prisma.post.findMany({
      where: { status: 'published', deletedAt: null },
      select: t.postPreviewSelect,
      orderBy: { createdAt: 'desc' },
    })
  );
}

export function selectAllDrafts(): Promise<t.FullPost[]> {
  return withPrismaErrorHandling(() =>
    prisma.post.findMany({
      where: { status: 'draft' },
      include: t.fullPostRowInclude,
      orderBy: { createdAt: 'desc' },
    })
  );
}

export function softDeletePostById(id: number): Promise<{ id: number }> {
  return withPrismaErrorHandling(() => 
    prisma.post.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
      select: {id: true},
    })
  );
}