import { prisma, type PostWhereInput, type PostSelect, } from '@prisma';
import { withPrismaErrorHandling } from '@utils';
import * as t from './types.ts';

export async function insertPost(data: t.InsertPost): Promise<{ id: number }> {
  return withPrismaErrorHandling<{ id: number }>(() =>
    prisma.post.create({
      data,
      select: { id: true },
    })
  );
}

// You don't need to explicitly pass the T parameter, TS will infer it from the options
export async function selectPosts<T extends keyof t.PostDataType>(
  options: t.SelectPostsOptions & { dataType: T }
): Promise<{
  posts: t.PostDataType[T][];
  nextCursor?: number;
  hasMore: boolean;
}> {

  const { cursor, limit, orderBy, orderDirection } = normalizeSearchOptions(options.searchOptions);
  const where = buildPostsWhereClause(options.filter);

  const posts = await withPrismaErrorHandling(() =>
    prisma.post.findMany({
      where,
      select: postSelectMap[options.dataType] as PostSelect, // Using alias here is necessary for TS to infer correctly
      orderBy: { [orderBy]: orderDirection },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
  );

  const hasMore = posts.length > limit;
  if (hasMore) posts.pop();

  return {
    posts,
    nextCursor: hasMore ? posts.at(-1)?.id : undefined,
    hasMore,
  };
}

// Need to refactor this later
export function selectTags(tagFilter?: t.TagFilter): Promise<t.TagType[]> {
  const nameContains = tagFilter?.nameContains ?? undefined;
  const includeFromDrafts = tagFilter?.includeFromDrafts ?? false;
  const includeFromDeleted = tagFilter?.includeFromDeleted ?? false;

  return withPrismaErrorHandling<t.TagType[]>(() =>
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

export async function updatePost(
  key: t.PostUniqueKey,
  data: t.UpdatePost
): Promise<{ id: number }> {

  return withPrismaErrorHandling<{ id: number }>(() =>
    prisma.post.update({
      where: {
        ...(key.type === 'id' ? { id: key.id } : { slug: key.slug }),
      },
      data,
      select: { id: true },
    })
  );

}

function buildPostsWhereClause(filter: t.SelectPostsFilter = {}): PostWhereInput {
  const where: PostWhereInput = {};

  if (filter.selectBy) {
    switch (filter.selectBy.type) {
      case 'id':
        where.id = filter.selectBy.id;
        break;

      case 'slug':
        where.slug = filter.selectBy.slug;
        break;
    }
  }

  if (filter.deleted === 'exclude') {
    where.deletedAt = null;
  }

  if (filter.deleted === 'only') {
    where.deletedAt = { not: null };
  }

  if (filter.status) {
    where.status = filter.status;
  }

  if (filter.tag) {
    where.tags = {
      some: {
        name: filter.tag,
      },
    };
  }

  return where;
}

const postSelectMap = {
  preview: t.postPreviewSelect,
  minimal: t.postMinimalSelect,
  full: t.fullPostSelect,
} satisfies Record<keyof t.PostDataType, PostSelect>;

function normalizeSearchOptions(options: t.PostSearchOptions = {}): t.NormalizedPostsSearchOptions {
  return {
    cursor: options.cursor,
    limit: options.limit ?? 10,
    orderBy: options.orderBy ?? 'createdAt',
    orderDirection: options.orderDirection ?? 'desc',
  };
}