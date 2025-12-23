import * as s from './schemas';
import type { Prisma, PostCreateInput, PostUpdateInput } from '@prisma';

//Schema-derived types
export type PostNewPost = (typeof s.postNewPost)['static'];
export type PatchPost = (typeof s.patchPost)['static'];

export type FullPost = (typeof s.fullPostSchema)['static'];
export type PostPreview = (typeof s.postPreviewSchema)['static'];
export type PostMinimalData = (typeof s.postMinimalSchema)['static'];

export type PaginatedFullPosts =
  (typeof s.paginatedPostsFullSchema)['static'];

export type PostStatus =
  (typeof s.fullPostSchema.properties.status)['static'];

export type TagType =
  (typeof s.fullPostSchema.properties.tags.items)['static'];


// Ordering & pagination
export type OrderBy = (typeof s.orderBySchema)['static'];
export type OrderDirection = (typeof s.orderDirectionSchema)['static'];

export type PostSearchOptions = {
  cursor?: number;
  limit?: number;
  orderBy?: OrderBy;
  orderDirection?: OrderDirection;
};

// Input aliases
export type InsertPost = PostCreateInput;
export type UpdatePost = PostUpdateInput;

//Prisma selects
export const fullPostSelect = {
  id: true,
  title: true,
  slug: true,
  content: true,
  excerpt: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  tags: {
    select: {
      id: true,
      name: true,
    },
  },
};

export const postPreviewSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  createdAt: true,
  updatedAt: true,
  tags: {
    select: {
      id: true,
      name: true,
    },
  },
};

export const postMinimalSelect = {
  id: true,
  title: true,
};

// Prisma payload types
export type FullPostRow = Prisma.PostGetPayload<{
  select: typeof fullPostSelect;
}>;

export type PostPreviewRow = Prisma.PostGetPayload<{
  select: typeof postPreviewSelect;
}>;


// Domain identifiers
export type PostUniqueKey =
  | { type: 'id'; id: number }
  | { type: 'slug'; slug: string };


// Domain filters
export type SelectPostsFilter = {
  selectBy?: PostUniqueKey;
  deleted?: 'exclude' | 'only';
  status?: 'published' | 'draft';
  tag?: string;
};

export type TagFilter = {
  nameContains?: string;
  includeFromDrafts?: boolean;
  includeFromDeleted?: boolean;
};


// High-level options
export type SelectPostsOptions = {
  filter?: SelectPostsFilter;
  searchOptions?: PostSearchOptions;
};

// Data mapping helpers
export type PostDataType = {
  full: FullPost;
  minimal: PostMinimalData;
  preview: PostPreview;
};

export type NormalizedPostsSearchOptions = Required<
  Pick<PostSearchOptions, 'limit' | 'orderBy' | 'orderDirection'>
> & Pick<PostSearchOptions, 'cursor'>;

