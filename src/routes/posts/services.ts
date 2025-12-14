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
      tag => tag.name
        .charAt(0)
        .toUpperCase()
        + tag.name.slice(1)
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

export async function fetchAllPostsPreview(): Promise<t.PostPreview[]> {
  return await r.selectAllPostsPreviews();
}
