import * as s from './schemas';
import type { Prisma } from '../../prisma/generated/browser';
import type { PostCreateInput } from '../../prisma/generated/models';

export type PostNewPost = (typeof s.postNewPost)['static'];
export type FullPost = (typeof s.fullPostSchema)['static'];
export type PostPreview = (typeof s.postPreviewSchema)['static'];
export type InsertPost = PostCreateInput;

export const fullPostRowInclude = {
    tags: {
      select: {
        name: true, id: true
      }
    }
}
export type PostFullRow =
  Prisma.PostGetPayload<{include: typeof fullPostRowInclude}>;

// We are not sending content in previews for performance reasons
export const postPreviewSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  createdAt: true,
  tags: { select: { name: true, id: true } },
}
export type PostPreviewRow =
  Prisma.PostGetPayload<{ select: typeof postPreviewSelect }>;
