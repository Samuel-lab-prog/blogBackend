import * as r from './repository.ts';
import * as t from './types.ts';
import { throwNotFoundError } from '../../utils/AppError.ts';
import slugify from 'slugify';

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

export async function fetchPost(identifier: t.PostUniqueKey): Promise<t.FullPost> {
  const posts = await r.selectPosts({
    selectBy: identifier,
    deleted: 'exclude',
    status: 'published',
  });
  if (!posts[0]) {
    throwNotFoundError('Post not found');
  }
  return posts[0];
}

export async function fetchAllPostsPreviews(
  cursor?: number,
  tag?: string,
  limit?: number
): Promise<{ items: t.PostPreview[]; nextCursor?: number; hasMore: boolean }> {
  return await r.selectPostsPreviews(
    { selectBy: 'all', deleted: 'exclude', status: 'published', tag },
    { cursor, limit }
  );
}

export async function fetchAllDrafts(): Promise<t.FullPost[]> {
  return await r.selectPosts({ selectBy: 'all', deleted: 'exclude', status: 'draft' });
}

export async function softRemovePost(identifier: t.PostUniqueKey): Promise<{ id: number }> {
  return await r.updatePost(identifier, { deletedAt: new Date() });
}

export async function modifyPost(
  identifier: t.PostUniqueKey,
  data: t.PatchPost
): Promise<{ id: number }> {
  const prismaData: Partial<t.UpdatePost> = {
    title: data.title,
    excerpt: data.excerpt,
    content: data.content,
  };

  if (data.title) {
    prismaData.slug = slugify(data.title, {
      lower: true,
      strict: true,
    });
  }

  if (data.tags) {
    prismaData.tags = {
      set: data.tags.map((tag) => ({ id: tag })),
    };
  }
  return await r.updatePost(identifier, prismaData);
}

export async function fetchAllDeletedPosts(): Promise<t.FullPost[]> {
  return await r.selectPosts({ selectBy: 'all', deleted: 'only' });
}

export async function restoreDeletedPost(identifier: t.PostUniqueKey): Promise<{ id: number }> {
  return await r.updatePost(identifier, { deletedAt: null });
}

export async function modifyPostStatus(
  identifier: t.PostUniqueKey,
  status: t.PostStatus
): Promise<{ id: number }> {
  return await r.updatePost(identifier, { status });
}
