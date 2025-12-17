/* eslint-disable @typescript-eslint/no-explicit-any */
import Elysia from 'elysia';
import { AppError } from '../AppError.ts';
import { log } from '../logger.ts';
import { SetupPlugin } from './setupPlugin.ts';

export function handleError(set: any, error: unknown, code: any, reqId: string) {
  if (error instanceof AppError) {
    return respondWithAppError(
      set,
      error,
      reqId,
      error instanceof Error ? error.stack : 'Not available'
    );
  }

  const normalizedCode =
    typeof code === 'string' ? code : typeof code?.type === 'string' ? code.type : 'UNKNOWN';

  const converted = convertElysiaError(normalizedCode);

  if (converted instanceof AppError) {
    return respondWithAppError(
      set,
      converted,
      reqId,
      error instanceof Error ? error.stack : undefined
    );
  }

  const statusCode = typeof set.status === 'number' && set.status >= 400 ? set.status : 500;

  set.status = statusCode;

  return {
    errorMessages: ['An unexpected error occurred'],
    statusCode,
  };
}

function respondWithAppError(set: any, err: AppError, reqId: string, stack?: string) {
  set.status = err.statusCode;

  log.error(
    {
      reqId,
      statusCode: err.statusCode,
      message: err.errorMessages.join(', '),
      stack: stack ?? err.stack,
    },
    'Error occurred:'
  );
  return {
    errorMessages: err.errorMessages,
    statusCode: err.statusCode,
  };
}

function convertElysiaError(code: string): AppError {
  switch (code) {
    case 'NOT_FOUND':
      return new AppError({ statusCode: 404, errorMessages: ['Not Found: resource not found'] });
    case 'PARSE':
      return new AppError({
        statusCode: 400,
        errorMessages: ['Bad request: failed to parse request body'],
      });
    case 'VALIDATION':
      return new AppError({
        statusCode: 422,
        errorMessages: ['Unprocessable entity: validation failed'],
      });
    case 'INVALID_COOKIE_SIGNATURE':
      return new AppError({
        statusCode: 401,
        errorMessages: ['Unauthorized: invalid cookie signature'],
      });
    case 'INVALID_FILE_TYPE':
      return new AppError({ statusCode: 400, errorMessages: ['Bad request: invalid file type'] });
    case 'INTERNAL_SERVER_ERROR':
    case 'UNKNOWN':
    default:
      return new AppError({ statusCode: 500, errorMessages: ['Internal server error'] });
  }
}

export const ErrorPlugin = new Elysia()
  .use(SetupPlugin)
  .onError({ as: 'scoped' }, ({ error, set, code, store }) =>
    handleError(set, error, code, store.reqId)
  );
