import Elysia from 'elysia';
import { throwUnauthorizedError } from './AppError';
import { authenticate } from '../routes/auth/services';
import { SetupPlugin } from './setupPlugin';

export const authPlugin = new Elysia()
  .use(SetupPlugin)

  .onBeforeHandle({ as: 'scoped' }, async ({ cookie, store }) => {
    // Bypass auth in test environment
    if (process.env.NODE_ENV === 'test') {
      store.role = 'admin';
      store.userId = 1;
      store.authTiming = 0;
      return;
    }

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
    } finally {
      store.authTiming = Math.round(performance.now() - authInitiatedAt);
    }
  });
