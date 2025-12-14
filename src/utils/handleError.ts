/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppError } from '../utils/AppError.ts';
import { logOnError } from './logger.ts';

export function handleError(set: any, error: unknown, code: any, reqId: string) {
  if (error instanceof AppError) {
    return respondWithAppError(set, error, reqId, error instanceof Error ? error.stack : undefined);
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

  logOnError(
    error instanceof Error ? error.message : String(error),
    statusCode,
    error instanceof Error ? error.stack : undefined,
    reqId
  );

  return {
    errorMessages: ['An unexpected error occurred'],
    statusCode,
  };
}

function respondWithAppError(set: any, err: AppError, reqId: string, stack?: string) {
  set.status = err.statusCode;

  logOnError(err.errorMessages.join(', '), err.statusCode, stack ?? err.stack, reqId);

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
