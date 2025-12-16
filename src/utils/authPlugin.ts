import Elysia from 'elysia';
import { throwUnauthorizedError } from './AppError';
import { authenticate } from '../routes/auth/services';
import { SetupPlugin } from './setupPlugin';

export const authPlugin = new Elysia()
  .use(SetupPlugin)
  .onBeforeHandle({ as: 'scoped' }, async ({ cookie, store }) => {
    const authInitiatedAt = performance.now();

    try {
      const token = cookie.token?.value;

      if (!token || typeof token !== 'string') {
        throwUnauthorizedError('No token provided');
      }

      const user = await authenticate(token);

      if (!user) {
        throwUnauthorizedError('Invalid token');
      }

      store.role = 'admin'; // In a real app, derive this from user data
      store.userId = user.id;

    }
    finally {
      store.authTiming = Math.round(
        performance.now() - authInitiatedAt
      );
    }
  });
