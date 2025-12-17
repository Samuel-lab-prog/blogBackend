import { Elysia, t } from 'elysia';
import { appErrorSchema } from '../../utils/AppError.ts';
import { idSchema } from '../../utils/schemas.ts';

import * as services from './services.ts';
import * as schemas from './schemas.ts';
import { authPlugin } from '../../utils/authPlugin.ts';

export const postsRouter = new Elysia({ prefix: '/posts' })
  .as('scoped')
  .get(
    '/',
    async ({ query }) => {
      return await services.fetchAllPostsPreviews(
        query.cursor ?? undefined,
        query.tag ?? undefined
      );
    },
    {
      response: {
        200: t.Object({
          items: t.Array(schemas.postPreviewSchema),
          nextCursor: t.Optional(idSchema),
          hasMore: t.Boolean(),
        }),
        500: appErrorSchema,
      },
      query: t.Object({
        cursor: t.Optional(idSchema),
        tag: t.Optional(t.String()),
      }),
      detail: {
        summary: 'Get all previews',
        tags: ['Posts'],
      },
    }
  )
  .get(
    '/:id',
    async ({ params }) => {
      return await services.fetchPostById(params.id);
    },
    {
      params: t.Object({
        id: idSchema,
      }),
      response: {
        200: schemas.fullPostSchema,
        404: appErrorSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Get a post by its ID',
        tags: ['Posts'],
      },
    }
  )
  .use(authPlugin)
  .post(
    '/',
    async ({ body, set }) => {
      set.status = 201;
      return await services.registerPost(body);
    },
    {
      body: schemas.postNewPost,
      response: {
        201: t.Object({
          id: idSchema,
        }),
        400: appErrorSchema,
        401: appErrorSchema,
        422: appErrorSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Create',
        tags: ['Posts'],
      },
    }
  )
  .get(
    '/drafts',
    async () => {
      return await services.fetchAllDrafts();
    },
    {
      response: {
        200: t.Array(schemas.fullPostSchema),
        401: appErrorSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Get all drafts',
        tags: ['Posts'],
      },
    }
  )
  .delete(
    '/:id',
    async ({ params, set }) => {
      const result = await services.softRemovePostById(params.id);
      set.status = 200;
      return result;
    },
    {
      params: t.Object({
        id: idSchema,
      }),
      response: {
        200: t.Object({
          id: idSchema,
        }),
        401: appErrorSchema,
        404: appErrorSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Soft delete a post by its ID',
        tags: ['Posts'],
      },
    }
  )
  .patch(
    '/:id',
    async ({ params, body }) => {
      return await services.modifyPostById(params.id, body);
    },
    {
      params: t.Object({
        id: idSchema,
      }),
      body: schemas.patchPost,
      response: {
        200: t.Object({
          id: idSchema,
        }),
        400: appErrorSchema,
        401: appErrorSchema,
        404: appErrorSchema,
        409: appErrorSchema,
        422: appErrorSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Update a post by its ID',
        tags: ['Posts'],
      },
    }
  )
  .get(
    '/deleted',
    async () => {
      return await services.fetchAllDeletedPosts();
    },
    {
      response: {
        200: t.Array(schemas.fullPostSchema),
        401: appErrorSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Get all deleted posts',
        tags: ['Posts'],
      },
    }
  )
  .patch(
    '/:id/restore',
    async ({ params }) => {
      return await services.restoreDeletedPostById(params.id);
    },
    {
      params: t.Object({
        id: idSchema,
      }),
      response: {
        200: t.Object({
          id: idSchema,
        }),
        401: appErrorSchema,
        404: appErrorSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Restore a deleted post by its ID',
        tags: ['Posts'],
      },
    }
  )
  .patch(
    '/:id/status',
    async ({ params, body }) => {
      return await services.modifyPostStatusById(params.id, body.status);
    },
    {
      params: t.Object({
        id: idSchema,
      }),
      body: t.Object({
        status: schemas.fullPostSchema.properties.status,
      }),
      response: {
        200: t.Object({
          id: idSchema,
        }),
        400: appErrorSchema,
        401: appErrorSchema,
        404: appErrorSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Update post status by its ID',
        tags: ['Posts'],
      },
    }
  );
