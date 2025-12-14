import pino from 'pino';
import type { Context } from 'elysia';

export const log = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'mm-dd HH:MM:ss',
      singleLine: false,
    },
  },
});

export const logOnRequest = (request: Request, reqId: string) => {
  log.info(
    {
      reqId,
      method: request.method,
      url: request.url,
    },
    'Incoming request:'
  );
};

export const logOnAfterResponse = (
  ctx: Context,
  reqId: string,
  reqStartedAt: number,
  response: unknown,
) => {
  const reqEndedAt = performance.now();

  log.info(
    {
      reqId,
      status: ctx.status ?? ctx.set?.status ?? 200,
      headersSent: true,
      durationMs: (reqEndedAt - reqStartedAt).toFixed(0),
      size: getResponseSize(response),
      statusCode: ctx.set.status
    },
    'Response sent:'
  );
};

export const logOnError = (message: string, statusCode: number, stack?: string, reqId?: string) => {
  log.error(
    {
      reqId,
      statusCode,
      message,
      stack: stack ?? 'No stack trace',
    },
    'Error occurred:'
  );
};

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
