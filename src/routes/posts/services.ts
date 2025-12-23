import * as r from './repository';
import * as t from './types';
import { throwNotFoundError } from '@utils';
import slugify from 'slugify';

/* ----------------------------- CREATE ----------------------------- */

export async function registerPost(body: t.PostNewPost): Promise<{ id: number }> {
  const slug = slugify(body.title, { lower: true, strict: true });
  const { tags, ...postData } = body;

  const normalizedTags = tags
    ?.map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase());

  return r.insertPost({
    ...postData,
    slug,
    tags: normalizedTags?.length
      ? {
          connectOrCreate: normalizedTags.map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        }
      : undefined,
  });
}

/* ----------------------------- READ ------------------------------ */

export async function fetchPost(key: t.PostUniqueKey): Promise<t.FullPost> {
  const { posts } = await r.selectPosts({
    filter: { selectBy: key },
    dataType: 'full',
  });

  if (!posts[0]) {
    throwNotFoundError('Post not found');
  }

  return posts[0];
}

export async function fetchAllVisiblePostsPreviews(
  filter: { tag?: string },
  searchOptions: t.PostSearchOptions
): Promise<{
  items: t.PostPreview[];
  nextCursor?: number;
  hasMore: boolean;
}> {
  const { posts, nextCursor, hasMore } = await r.selectPosts({
    filter: {
      deleted: 'exclude',
      status: 'published',
      ...filter,
    },
    searchOptions,
    dataType: 'preview',
  });

  return {
    items: posts,
    nextCursor,
    hasMore,
  };
}

export async function fetchAllDrafts(): Promise<t.FullPost[]> {
  const { posts } = await r.selectPosts({
    filter: {
      deleted: 'exclude',
      status: 'draft',
    },
    dataType: 'full',
  });

  return posts;
}

export async function fetchAllDeletedPosts(): Promise<t.FullPost[]> {
  const { posts } = await r.selectPosts({
    filter: { deleted: 'only' },
    searchOptions: {
      orderBy: 'createdAt',
      orderDirection: 'desc',
    },
    dataType: 'full',
  });

  return posts;
}

/* ----------------------------- UPDATE ----------------------------- */

export async function softRemovePost(key: t.PostUniqueKey): Promise<{ id: number }> {
  return r.updatePost(key, { deletedAt: new Date() });
}

export async function restoreDeletedPost(key: t.PostUniqueKey): Promise<{ id: number }> {
  return r.updatePost(key, { deletedAt: null });
}

export async function modifyPost(key: t.PostUniqueKey, data: t.PatchPost): Promise<{ id: number }> {
  const prismaData: Partial<t.UpdatePost> = {};

  if (data.title) {
    prismaData.title = data.title;
    prismaData.slug = slugify(data.title, {
      lower: true,
      strict: true,
    });
  }

  if (data.excerpt) prismaData.excerpt = data.excerpt;
  if (data.content) prismaData.content = data.content;

  if (data.tags) {
    const normalizedTags = [
      ...new Set(
        data.tags.map(
          (tag) => tag.trim().charAt(0).toUpperCase() + tag.trim().slice(1).toLowerCase()
        )
      ),
    ];

    prismaData.tags = {
      set: [],
      connectOrCreate: normalizedTags.map((tag) => ({
        where: { name: tag },
        create: { name: tag },
      })),
    };
  }

  return r.updatePost(key, prismaData);
}

export async function modifyPostStatus(
  key: t.PostUniqueKey,
  status: t.PostStatus
): Promise<{ id: number }> {
  return r.updatePost(key, { status });
}

/* ----------------------------- TAGS ------------------------------ */

export async function fetchTags(filter?: t.TagFilter): Promise<t.TagType[]> {
  return r.selectTags(filter);
}
