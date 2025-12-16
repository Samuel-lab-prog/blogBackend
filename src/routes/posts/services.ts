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

export async function fetchPostBySlug(slug: string): Promise<t.FullPost> {
  return await r.selectPostBySlug(slug) ?? throwNotFoundError('Post not found');
}

export async function fetchAllPublishedPostsPreview(): Promise<t.PostPreview[]> {
  return await r.selectAllPublishedPostsPreviews();
}

export async function fetchAllDrafts(): Promise<t.FullPost[]> {
  return await r.selectAllDrafts();
}

export async function softRemovePostById(id: number): Promise<{ id: number }> {
  return await r.softDeletePostById(id);
}