import { t } from 'elysia';
import * as s from '../../utils/schemas.ts';
import { makeValidationError } from '../../utils/AppError.ts';

export const tagSchema = s.tagSchema;

export const postNewPost = t.Object({
  title: s.titleSchema,
  excerpt: s.excerptSchema,
  content: s.contentSchema,
  tags: t.Optional(t.Array(s.tagNameSchema)),
  status: t.Optional(s.postStatusSchema),
});

export const patchPost = t.Object(
  {
    title: t.Optional(s.titleSchema),
    excerpt: t.Optional(s.excerptSchema),
    content: t.Optional(s.contentSchema),
    tags: t.Optional(t.Array(s.idSchema)),
  },
  {
    minProperties: 1,
    ...makeValidationError('At least one field must be provided to update the post'),
  }
);

export const fullPostSchema = t.Object({
  title: s.titleSchema,
  slug: s.slugSchema,
  content: s.contentSchema,
  excerpt: s.excerptSchema,
  tags: t.Array(s.tagSchema),
  status: s.postStatusSchema,

  id: s.idSchema,
  createdAt: s.dateSchema,
  updatedAt: s.dateSchema,
});
export const postMinimalSchema = t.Object({
  id: s.idSchema,
  title: s.titleSchema,
});

export const paginatedPostsSchema = t.Object({
  items: t.Array(fullPostSchema),
  nextCursor: t.Optional(s.idSchema),
  hasMore: t.Boolean(),
});

export const postPreviewSchema = t.Object({
  title: s.titleSchema,
  slug: s.slugSchema,
  excerpt: s.excerptSchema,
  tags: t.Array(s.tagSchema),

  id: s.idSchema,
  updatedAt: s.dateSchema,
  createdAt: s.dateSchema,
});

export const orderDirectionSchema = t.Union([t.Literal('asc'), t.Literal('desc')]);
export const orderBySchema = t.Union([
  t.Literal('createdAt'),
  t.Literal('updatedAt'),
  t.Literal('id'),
]);
