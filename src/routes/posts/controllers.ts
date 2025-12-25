import { Elysia, t } from 'elysia';
import { idSchema, appErrorSchema, tagSchema, tagNameSchema } from '@utils';
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
      query: t.Partial(t.Object({
        tag: tagNameSchema,
        cursor: idSchema,
        limit: idSchema, // ideally PositiveInteger
        orderBy: schemas.orderBySchema,
        orderDirection: schemas.orderDirectionSchema,
      })),
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
        id: idSchema
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
    '/minimal',
    async ({ query }) => {
      const { deleted, status, tag, ...rest } = query;
      if (deleted !== undefined) {
        if (deleted !== 'only' && deleted !== 'exclude') {
          throw new Error("Invalid value for 'deleted' filter. Use 'only' or 'exclude'.");
        }
      }
      if (status !== undefined) {
        if (status !== 'draft' && status !== 'published') {
          throw new Error("Invalid value for 'status' filter. Use 'draft' or 'published'.");
        }
      }
      return services.fetchPostsMinimal({ deleted, status, tag }, rest);
    },
    {
      response: {
        200: schemas.paginatedPostsMinimalSchema,
        401: appErrorSchema,
        500: appErrorSchema,
      },
      query: t.Partial(t.Object({
        deleted: t.String(),
        status: t.String(),
        tag: tagNameSchema,
        cursor: idSchema,
        limit: idSchema, // ideally PositiveInteger
        orderBy: schemas.orderBySchema,
        orderDirection: schemas.orderDirectionSchema,
      })),
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
        id: idSchema,
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
        id: idSchema,
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
        id: idSchema,
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
  );
