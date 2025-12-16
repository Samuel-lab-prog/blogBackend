import * as r from './repository.ts';
import * as t from './types.ts';
import { throwNotFoundError } from '../../utils/AppError.ts';
import slugify from 'slugify';

export async function registerPost(
  body: t.PostNewPost
): Promise<{ id: number }> {

  const slug = slugify(body.title, { lower: true, strict: true });
  const { tags, ...postData } = body;
  const normalizedTags = tags
    .map(
      tag => tag
        .charAt(0)
        .toUpperCase()
        + tag.slice(1)
          .toLowerCase());

  return await r.insertPost({
    ...postData,
    slug,
    tags: {
      connectOrCreate: normalizedTags.map((tag) => ({
        where: { name: tag },
        create: { name: tag },
      })),
    }
  });
}

export async function fetchPostById(id: number): Promise<t.FullPost> {
  return await r.selectPostById(id) ?? throwNotFoundError('Post not found');
}

export async function fetchAllPostsPreviews(cursor?: number, tag?: string): Promise<{items: t.PostPreview[]; nextCursor?: number; hasMore: boolean;}> {
  return await r.selectAllPublishedPostsPreviews(cursor, tag);
}

export async function fetchAllDrafts(): Promise<t.FullPost[]> {
  return await r.selectAllDrafts();
}

export async function softRemovePostById(id: number): Promise<{ id: number }> {
  return await r.softDeletePostById(id);
}

export async function modifyPostById(
  id: number,
  data: t.PatchPost
): Promise<{ id: number }> {
  const prismaData: t.UpdatePost = {
    title: data.title,
    excerpt: data.excerpt,
    content: data.content,
    status: data.status,
  };

  if (data.title) {
    prismaData.slug = slugify(data.title, {
      lower: true,
      strict: true,
    });
  }

  if (data.tags) {
    prismaData.tags = {
      set: data.tags.map(tag => ({ id: tag })),
    };
  }
  return await r.updatePostById(id, prismaData);
}

export async function fetchAllDeletedPosts(): Promise<t.FullPost[]> {
  return await r.selectAllDeletedPosts();
}

export async function restoreDeletedPostById(id: number): Promise<{ id: number }> {
  return await r.restorePostById(id);
}