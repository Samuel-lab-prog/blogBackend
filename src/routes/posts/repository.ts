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
// No need for pagination here as this will be used only in admin interfaces
export async function selectPosts(filter: t.Filter): Promise<t.FullPost[]> {
  return withPrismaErrorHandling<t.FullPost[]>(() =>
    prisma.post.findMany({
      where: {
        ...(filter.selectBy !== 'all' && filter.selectBy),
        ...(filter.deleted === 'exclude' && { deletedAt: null }),
        ...(filter.deleted === 'only' && { deletedAt: { not: null } }),
        ...(filter.status && { status: filter.status }),
        ...(filter.tag && {
          tags: {
            some: {
              name: filter.tag,
            },
          },
        }),
      },
      include: t.fullPostRowInclude,
      orderBy: { createdAt: 'desc' },
    })
  );
}

export async function selectPostsPreviews(
  filter: t.Filter,
  searchOptions: t.SearchOptions = {}
): Promise<{
  items: t.PostPreview[];
  nextCursor?: number;
  hasMore: boolean;
}> {
  const limit = searchOptions.limit ?? t.defaultTakeCount;
  const cursor = searchOptions.cursor ?? undefined;
  const orderBy = searchOptions.orderBy ?? 'createdAt';
  const orderDirection = searchOptions.orderDirection ?? 'desc';

  const posts = await withPrismaErrorHandling<t.PostPreview[]>(() =>
    prisma.post.findMany({
      where: {
        ...(filter.selectBy !== 'all' && filter.selectBy),
        ...(filter.deleted === 'exclude' && { deletedAt: null }),
        ...(filter.deleted === 'only' && { deletedAt: { not: null } }),
        ...(filter.status && { status: filter.status }),
        ...(filter.tag && {
          tags: {
            some: {
              name: filter.tag,
            },
          },
        }),
      },
      select: t.postPreviewSelect,
      take: limit + 1, // To check if there's more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { [orderBy]: orderDirection },
    })
  );

  const hasMore = posts.length > limit;
  if (hasMore) posts.pop();

  return {
    items: posts,
    nextCursor: hasMore ? posts.at(-1)?.id : undefined,
    hasMore,
  };
}

export function selectTags(tagFilter?: t.TagFilter): Promise<t.Tag[]> {
  const nameContains = tagFilter?.nameContains ?? undefined;
  const includeFromDrafts = tagFilter?.includeFromDrafts ?? false;
  const includeFromDeleted = tagFilter?.includeFromDeleted ?? false;

  return withPrismaErrorHandling<t.Tag[]>(() =>
    prisma.tag.findMany({
      orderBy: { name: 'asc' },
      where: {
        ...(nameContains && { name: { contains: nameContains, mode: 'insensitive' } }),
        posts: {
          some: {
            ...(includeFromDrafts === false && { status: 'published' }),
            ...(includeFromDeleted === false && { deletedAt: null }),
          },
        },
      },
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
