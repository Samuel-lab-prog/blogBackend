import { t } from 'elysia';
import * as s from '../../utils/schemas.ts';

export const postNewPost = t.Object({
  title: s.titleSchema,
  excerpt: s.excerptSchema,
  content: s.contentSchema,
  tags: t.Array(s.tagSchema),
  status: s.postStatusSchema,
});

export const fullPostSchema = t.Object({
  title: s.titleSchema,
  slug: s.slugSchema,
  content: s.contentSchema,
  excerpt: s.excerptSchema,
  tags: s.tagsSchema,
  status: s.postStatusSchema,
  
  id: s.idSchema,
  createdAt: s.dateSchema,
  updatedAt: s.dateSchema,
});

export const postPreviewSchema = t.Object({
  title: s.titleSchema,
  slug: s.slugSchema,
  excerpt: s.excerptSchema,
  tags: s.tagsSchema,
  
  id: s.idSchema,
  createdAt: s.dateSchema,
});

