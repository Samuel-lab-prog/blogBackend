import { Elysia, t } from 'elysia';
import { idSchema, appErrorSchema, tagSchema } from '@utils';
import { authPlugin } from '@plugins';
import * as types from './types';
import * as services from './services';
import * as schemas from './schemas';

function parsePostKey(idOrSlug: string | number): types.PostUniqueKey {
  return typeof idOrSlug === 'number'
    ? { type: 'id', id: idOrSlug }
    : { type: 'slug', slug: idOrSlug };
}

export const postsRouter = new Elysia({ prefix: '/posts' })
  .as('scoped')
  .get(
    '/',
    async ({ query }) => {
      const { cursor, limit, orderBy, orderDirection, ...filter } = query;

      return services.fetchPostsPreviews(filter, {
        cursor,
        limit,
        orderBy,
        orderDirection,
      });
    },
    {
      query: schemas.searchQueryParamSchema,
      response: {
        200: schemas.paginatedPostsPreviewSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Get published post previews',
        tags: ['Posts'],
      },
    }
  )

  .get(
    '/:id',
    async ({ params }) => {
      return services.fetchPost(parsePostKey(params.id));
    },
    {
      params: t.Object({
        id: t.Union([idSchema, t.String()]),
      }),
      response: {
        200: schemas.fullPostSchema,
        404: appErrorSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Get a post by id or slug',
        tags: ['Posts'],
      },
    }
  )

  .get(
    '/tags',
    async ({ query }) => {
      return services.fetchTags({
        nameContains: query.nameContains,
        includeFromDeleted: query.deleted,
        includeFromDrafts: query.draft,
      });
    },
    {
      query: t.Object({
        deleted: t.Optional(t.Boolean()),
        draft: t.Optional(t.Boolean()),
        nameContains: t.Optional(t.String()),
      }),
      response: {
        200: t.Array(tagSchema),
        500: appErrorSchema,
      },
      detail: {
        summary: 'Get post tags',
        tags: ['Posts'],
      },
    }
  )
  /* ----------------------------- AUTH ------------------------------ */
  .use(authPlugin)
  .post(
    '/',
    async ({ body, set }) => {
      set.status = 201;
      return services.registerPost(body);
    },
    {
      body: schemas.postNewPost,
      response: {
        201: t.Object({ id: idSchema }),
        400: appErrorSchema,
        401: appErrorSchema,
        422: appErrorSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Create post',
        tags: ['Posts'],
      },
    }
  )
  .get(
    '/drafts',
    async () => {
      return services.fetchDrafts();
    },
    {
      response: {
        200: t.Array(schemas.fullPostSchema),
        401: appErrorSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Get drafts',
        tags: ['Posts'],
      },
    }
  )
  .get(
    '/deleted',
    async () => {
      return services.fetchDeletedPosts();
    },
    {
      response: {
        200: t.Array(schemas.fullPostSchema),
        401: appErrorSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Get deleted posts',
        tags: ['Posts'],
      },
    }
  )
  .get(
    '/minimal',
    async () => {
      return services.fetchPostsMinimal();
    },
    {
      response: {
        200: schemas.paginatedPostsMinimalSchema,
        401: appErrorSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Get all posts minimal data',
        tags: ['Posts'],
      },
    }
  )
  .delete(
    '/:id',
    async ({ params }) => {
      return services.softRemovePost(parsePostKey(params.id));
    },
    {
      params: t.Object({
        id: t.Union([idSchema, t.String()]),
      }),
      response: {
        200: t.Object({ id: idSchema }),
        401: appErrorSchema,
        404: appErrorSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Soft delete post',
        tags: ['Posts'],
      },
    }
  )
  .patch(
    '/:id',
    async ({ params, body }) => {
      return services.modifyPost(parsePostKey(params.id), body);
    },
    {
      params: t.Object({
        id: t.Union([idSchema, t.String()]),
      }),
      body: schemas.patchPost,
      response: {
        200: t.Object({ id: idSchema }),
        400: appErrorSchema,
        401: appErrorSchema,
        404: appErrorSchema,
        422: appErrorSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Update post',
        tags: ['Posts'],
      },
    }
  )
  .patch(
    '/:id/restore',
    async ({ params }) => {
      return services.restoreDeletedPost(parsePostKey(params.id));
    },
    {
      params: t.Object({
        id: t.Union([idSchema, t.String()]),
      }),
      response: {
        200: t.Object({ id: idSchema }),
        401: appErrorSchema,
        404: appErrorSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Restore deleted post',
        tags: ['Posts'],
      },
    }
  )
  .patch(
    '/:id/status',
    async ({ params, body }) => {
      return services.modifyPostStatus(parsePostKey(params.id), body.status);
    },
    {
      params: t.Object({
        id: t.Union([idSchema, t.String()]),
      }),
      body: t.Object({
        status: schemas.fullPostSchema.properties.status,
      }),
      response: {
        200: t.Object({ id: idSchema }),
        400: appErrorSchema,
        401: appErrorSchema,
        404: appErrorSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Update post status',
        tags: ['Posts'],
      },
    }
  );
