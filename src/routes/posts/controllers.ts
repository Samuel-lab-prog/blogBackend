import { Elysia, t } from 'elysia';
import { appErrorSchema } from '../../utils/AppError.ts';
import { idSchema } from '../../utils/schemas.ts';

import * as services from './services.ts';
import * as schemas from './schemas.ts';
import { authPlugin } from '../../utils/authPlugin.ts';

export const postsRouter = new Elysia({ prefix: '/posts' })
  .get(
    '/',
    async () => {
      return await services.fetchAllPostsPreview();
    },
    {
      response: {
        200: t.Array(schemas.postPreviewSchema),
        500: appErrorSchema,
      },
      detail: {
        summary: 'Get all previews',
        tags: ['Posts'],
      }
    }
  )
  .get(
    '/:slug',
    async ({ params }) => {
      return await services.fetchPostBySlug(params.slug);
    },
    {
      params: t.Object({
        slug: schemas.fullPostSchema.properties.slug,
      }), 
      responses: {
        200: schemas.fullPostSchema,
        404: appErrorSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Get a post by its ID',
        tags: ['Posts'],
      }
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
      }
    }
  );
