import { Elysia, t } from 'elysia';
import { appErrorSchema, throwUnauthorizedError } from '../../utils/AppError.ts';
import { loginSchema } from '../../utils/schemas.ts';
import { authenticate, login } from './services';

export const authRouter = new Elysia()

  .group('/auth', (app) =>
    app.post(
      '/login',
      async ({ body, cookie, set }) => {
        const result = await login(body.email, body.password);

        cookie.token!.value = result.token;
        cookie.token!.httpOnly = true;
        cookie.token!.path = '/';

        set.status = 204;
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

export const authPlugin = new Elysia()
  .state('userId', null as number | null)
  .onBeforeHandle({ as: 'scoped' }, async ({ cookie, store }) => {

    const token = cookie.token?.value;
    console.log('Authenticating with token:', token);
    if (!token || typeof token !== 'string') {
      store.userId = null;
      throwUnauthorizedError('No token provided');
    }

    const user = await authenticate(token);

    if (!user) {
      store.userId = null;
      throwUnauthorizedError('Invalid token');
    }

    store.userId = user.id;
  });

