import Elysia from 'elysia';
import { log } from './logger';
import { SetupPlugin } from './setupPlugin';
import { requestContext } from './requestContext';

export const LoggerPlugin = new Elysia()
  .use(SetupPlugin)

  .onStart(() => {
    log.info(`🚀 Server started at http://localhost:5000/api/v1/docs`);
  })

  .onRequest(({ store }) => {
    const reqId = crypto.randomUUID();
    store.reqId = reqId;
    store.reqInitiatedAt = performance.now();
    requestContext.run({ dbTimings: [] }, () => {});
  })

  .onAfterResponse({ as: 'scoped' }, ({ store, request, set, responseValue }) => {
    if (request.url.includes('/docs')) {
      return;
    }
    const authMs = store.authTiming || 0;
    const totalMs = Math.round(performance.now() - store.reqInitiatedAt);

    const reqId = store.reqId || 'unknown';
    const method = request.method;
    const path = request.url.substring(request.url.indexOf('/', 8));
    const statusCode = set.status || 200;
    const sizeBytes = getResponseSize(responseValue);
    const contentType = set.headers['content-type'] || 'unknown';
    const isAuthenticated = !!store.userId || false;
    const userId = store.userId || 'guest';
    const role = store.role || 'guest';

    log.info(
      {
        request: {
          reqId,
          method,
          path,
        },
        response: {
          statusCode,
          sizeBytes,
          contentType,
        },
        auth: {
          isAuthenticated,
          userId,
          role,
        },
        timings: {
          totalMs,
          authMs,
        },
      },
      'Incoming request completed'
    );
    store.authTiming = 0; // reset for next request
  });

function getResponseSize(response: unknown): number {
  if (response == null) return 0;

  if (typeof response === 'string') {
    return Buffer.byteLength(response);
  }

  if (response instanceof Uint8Array) {
    return response.byteLength;
  }

  if (response instanceof Response) {
    const len = response.headers.get('content-length');
    return len ? Number(len) : 0;
  }

  try {
    const json = JSON.stringify(response);
    return Buffer.byteLength(json);
  } catch {
    return 0;
  }
}
