import * as s from './schemas';
import type { Prisma } from '../../prisma/generated/browser';
import type { PostCreateInput, PostUpdateInput } from '../../prisma/generated/models';

export type PostNewPost = (typeof s.postNewPost)['static'];
export type PatchPost = (typeof s.patchPost)['static'];
export type FullPost = (typeof s.fullPostSchema)['static'];
export type PaginatedPosts = (typeof s.paginatedPostsSchema)['static'];
export type PostPreview = (typeof s.postPreviewSchema)['static'];
export type PostStatus = (typeof s.fullPostSchema.properties.status)['static'];
export type Tag = (typeof s.fullPostSchema.properties.tags.items)['static'];
export type InsertPost = PostCreateInput;
export type UpdatePost = PostUpdateInput;

export const fullPostRowInclude = {
  tags: {
    select: {
      name: true,
      id: true,
    },
  },
};
export type PostFullRow = Prisma.PostGetPayload<{ include: typeof fullPostRowInclude }>;

// We are not sending content in previews for performance reasons
export const postPreviewSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  createdAt: true,
  updatedAt: true,
  tags: { select: { name: true, id: true } },
};
export type PostPreviewRow = Prisma.PostGetPayload<{ select: typeof postPreviewSelect }>;

type Without<T, U> = {
  [P in Exclude<keyof T, keyof U>]?: never;
};

type XOR<T, U> = (T & Without<U, T>) | (U & Without<T, U>);

export type PostUniqueKey = XOR<{ id: number }, { slug: string }>;

export type Filter = {
  selectBy: PostUniqueKey | 'all';
  deleted?: 'exclude' | 'only';
  status?: 'published' | 'draft';
  tag?: string;
};

export type SearchOptions = {
  cursor?: number;
  limit?: number;
};

export const defaultTakeCount = 10;
