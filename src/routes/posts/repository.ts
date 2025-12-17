import { prisma } from '../../prisma/client.ts';
import { withPrismaErrorHandling } from '../../utils/AppError.ts';
import * as t from './types.ts';

export async function insertPost(data: t.InsertPost): Promise<{ id: number }> {
  return withPrismaErrorHandling<{ id: number }>(() =>
    prisma.post.create({
      data,
      select: { id: true },
    })
  );
}

export async function selectPosts(filter: t.Filter): Promise<t.FullPost[]> {
  return withPrismaErrorHandling<t.FullPost[]>(() =>
    prisma.post.findMany({
      where: {
        ...(filter.selectBy !== 'all' && filter.selectBy),
        ...(filter.deleted === 'exclude' && { deletedAt: null }),
        ...(filter.deleted === 'only' && { deletedAt: { not: null } }),
        ...(filter.status && { status: filter.status }),
      },
      include: t.fullPostRowInclude,
      orderBy: { createdAt: 'desc' },
    })
  );
}

export async function selectPostsPreviews(
  filter: t.Filter,
  filterTag?: string,
  cursor: number | null = null
): Promise<{
  items: t.PostPreview[];
  nextCursor?: number;
  hasMore: boolean;
}> {
  const takeCount = 10;

  const posts = await withPrismaErrorHandling<t.PostPreview[]>(() =>
    prisma.post.findMany({
      where: {
        ...(filter.selectBy !== 'all' && filter.selectBy),
        ...(filter.deleted === 'exclude' && { deletedAt: null }),
        ...(filter.deleted === 'only' && { deletedAt: { not: null } }),
        ...(filter.status && { status: filter.status }),
        ...(filterTag && {
          tags: {
            some: {
              name: filterTag,
            },
          },
        }),
      },
      select: t.postPreviewSelect,
      orderBy: { id: 'desc' },
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
    nextCursor: hasMore ? posts.at(-1)?.id : undefined,
    hasMore,
  };
}

export function selectTags(): Promise<t.Tag[]> {
  return withPrismaErrorHandling<t.Tag[]>(() =>
    prisma.tag.findMany({
      orderBy: { name: 'asc' },
    })
  );
}

export function updatePost(key: t.PostUniqueKey, data: t.UpdatePost): Promise<{ id: number }> {
  return withPrismaErrorHandling<{ id: number }>(() =>
    prisma.post.update({
      where: key,
      data,
      select: { id: true },
    })
  );
}