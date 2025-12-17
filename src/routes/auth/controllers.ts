import { Elysia, t } from 'elysia';
import { appErrorSchema } from '../../utils/AppError.ts';
import { loginSchema } from '../../utils/schemas.ts';
import { login } from '../auth/services.ts';
import { SetupPlugin } from '../../utils/setupPlugin.ts';

export const authRouter = new Elysia().group('/auth', (app) =>
  app.use(SetupPlugin).post(
    '/login',
    async ({ body, cookie, set, store }) => {
      const authInitiated = performance.now();

      const result = await login(body.email, body.password);

      cookie.token!.value = result.token;
      cookie.token!.httpOnly = true;
      cookie.token!.path = '/';

      set.status = 204;

      store.userId = result.data.id;
      store.role = 'admin';
      store.authTiming = Math.round(performance.now() - authInitiated);

      return;
    },
    {
      body: loginSchema,
      response: {
        204: t.Void(),
        400: appErrorSchema,
        401: appErrorSchema,
        422: appErrorSchema,
        500: appErrorSchema,
      },
      detail: {
        summary: 'Login',
        description: 'Authenticates a user and returns a JWT token in an HTTP-only cookie.',
        tags: ['Auth'],
      },
    }
  )
);
