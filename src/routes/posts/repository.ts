import { prisma } from '../../prisma/client.ts';
import { withPrismaErrorHandling } from '../../utils/AppError.ts';
import * as t from './types.ts';

// Before addding or modifying functions here, make sure to add tests in repository.test.ts
// I'm also using some patterns to keep the code consistent and easy to read.

// 1. All functions are exported named functions.
// 2. All functions use withPrismaErrorHandling to wrap prisma calls (read more in AppError.ts).
// 3. All functions have explicit return types.
// 4. Function names are descriptive and follow the pattern of action + entity + additionalInfo (if needed).
// 5. Function names are using SQL terminology where applicable (e.g., select, insert, update, delete).
// 6. Functions that return lists should return empty lists instead of null.
// 7. Functions that modify data should return the modified entity's id or throw if not found.
// 8. Functions that retrieve single entities should return null if not found.

export async function insertPost(data: t.InsertPost): Promise<{ id: number }> {
  return withPrismaErrorHandling<{ id: number }>(() =>
    prisma.post.create({
      data,
      select: { id: true },
    })
  );
}

export async function selectPost(filter: t.Filter): Promise<t.PostFullRow | null> {
  return withPrismaErrorHandling<t.PostFullRow | null>(() =>
    prisma.post.findFirst({
      where: {
        ...(filter.selectBy !== 'all' && filter.selectBy),
        ...(filter.deleted === 'exclude' && { deletedAt: null }),
        ...(filter.deleted === 'only' && { deletedAt: { not: null } }),
        ...(filter.status && { status: filter.status }),
      },
      include: t.fullPostRowInclude,
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

export function updatePost(key: t.PostUniqueKey, data: t.UpdatePost): Promise<{ id: number }> {
  return withPrismaErrorHandling<{ id: number }>(() =>
    prisma.post.update({
      where: key,
      data,
      select: { id: true },
    })
  );
}

export function selectAllTags(): Promise<t.Tag[]> {
  return withPrismaErrorHandling<t.Tag[]>(() =>
    prisma.tag.findMany({
      orderBy: { name: 'asc' },
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