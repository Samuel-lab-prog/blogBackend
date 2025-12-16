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
      where: { id, deletedAt: null, status: 'published' },
      include: t.fullPostRowInclude,
    })
  );
}

const takeCount = 10;

export async function selectAllPublishedPostsPreviews(
  cursor: number | null = null
): Promise<{
  items: t.PostPreview[];
  nextCursor?: number;
  hasMore: boolean;
}> {
  const posts = await withPrismaErrorHandling(() =>
    prisma.post.findMany({
      where: { status: 'published', deletedAt: null },
      select: t.postPreviewSelect,
      orderBy: { createdAt: 'desc' },
      take: takeCount + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    })
  );

  const hasMore = posts.length > takeCount;
  if (hasMore) posts.pop();

  return {
    items: posts,
    nextCursor: hasMore ? posts.at(-1)!.id : undefined,
    hasMore,
  };
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

export function updatePostById(
  id: number,
  data: t.UpdatePost
): Promise<{ id: number }> {
  return withPrismaErrorHandling(() =>
    prisma.post.update({
      where: { id, deletedAt: null },
      data,
      select: { id: true },
    })
  );
}

export function selectAllDeletedPosts(): Promise<t.FullPost[]> {
  return withPrismaErrorHandling(() =>
    prisma.post.findMany({
      where: { deletedAt: { not: null } },
      include: t.fullPostRowInclude,
      orderBy: { deletedAt: 'desc' },
    })
  );
}

export function restorePostById(id: number): Promise<{ id: number }> {
  return withPrismaErrorHandling(() =>
    prisma.post.update({
      where: { id, deletedAt: { not: null } },
      data: { deletedAt: null },
      select: { id: true },
    })
  );
}