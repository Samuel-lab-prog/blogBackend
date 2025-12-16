/* eslint-disable @typescript-eslint/no-explicit-any */
import { t } from 'elysia';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

export type AppErrorType = {
  statusCode?: number;
  errorMessages?: string[];
  origin?: string;
  originalError?: Error;
};

export const appErrorSchema = t.Object({
  errorMessages: t.Array(t.String()),
  statusCode: t.Number({
    minimum: 400,
    maximum: 599,
    errorMessage: 'Error status code must be between 400 and 599',
  }),
});

export class AppError extends Error {
  public statusCode: number;
  public errorMessages: string[];
  public originalError?: Error;

  constructor({
    statusCode = 500,
    errorMessages = ['Application Error'],
    originalError,
  }: AppErrorType = {}) {
    super(errorMessages.join(', '));

    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorMessages = errorMessages;
    this.originalError = originalError;

    Error.captureStackTrace?.(this, AppError);
  }
}

function createAppError(statusCode: number, prefix: string, message: string): never {
  throw new AppError({
    statusCode,
    errorMessages: [`${prefix}: ${message}`],
  });
}

export function throwBadRequestError(message: string = 'Bad request'): never {
  createAppError(400, 'Bad Request', message);
}

export function throwUnauthorizedError(message: string = 'Unauthorized access'): never {
  createAppError(401, 'Unauthorized', message);
}

export function throwForbiddenError(message: string = 'Access is forbidden'): never {
  createAppError(403, 'Forbidden', message);
}

export function throwNotFoundError(message: string = 'The resource was not found'): never {
  createAppError(404, 'Not found', message);
}

export function throwConflictError(message: string = 'The resource already exists'): never {
  createAppError(409, 'Conflict', message);
}

export function throwGoneError(message: string = 'The resource has been deleted'): never {
  createAppError(410, 'Resource deleted', message);
}

export function throwUnprocessableEntityError(message: string = 'Unprocessable entity'): never {
  createAppError(422, 'Unprocessable Entity', message);
}

export function throwDatabaseError(message: string = 'A database error occurred'): never {
  createAppError(500, 'Database error', message);
}

export function throwServerError(): never {
  createAppError(500, 'Server error', 'An unexpected error occurred');
}

export function makeValidationError(message: string) {
  return {
    error() {
      throwUnprocessableEntityError(message);
    },
  };
}

export function makeBadRequestError(message: string) {
  return {
    error() {
      throwBadRequestError(message);
    },
  };
}

// -----------------------------------------------
// PRISMA ERROR HANDLING
// -----------------------------------------------

function extractUniqueFields(error: PrismaClientKnownRequestError): string[] {
  const originalMsg = (error.meta as any)?.driverAdapterError?.cause?.originalMessage || '';

  const matches = [...originalMsg.matchAll(/"(?:.+_)?([a-zA-Z0-9_]+)_key"/g)];

  if (matches.length === 0) return [];

  return matches.map((m) => m[1]);
}

function handlePrismaError<T>(error: PrismaClientKnownRequestError, data?: T): never {
  const table = (error.meta as any)?.modelName || 'unknown';
  switch (error.code) {
    case 'P2002':
      {
        let fields = extractUniqueFields(error) || (error.meta as any)?.target || [];

        if (!Array.isArray(fields) || fields.length === 0) fields = ['field'];

        const record = data && typeof data === 'object' ? (data as Record<string, any>) : null;

        const messages = fields.map((f) =>
          record && f in record ? `${f} = ${String(record[f])}` : f
        );

        throwConflictError(`unique ${messages.join(', ')} already exists in ${table}`);
      }
      break;

    case 'P2003':
      {
        const fkField = (error.meta as any)?.field_name || 'foreign key';
        throwConflictError(`foreign key constraint failed on ${fkField} in ${table}`);
      }
      break;

    case 'P2025':
      {
        throwNotFoundError(`${table} not found`);
      }
      break;
    default:
      throw error;
  }
}
export async function withPrismaErrorHandling<T>(callback: () => Promise<T>): Promise<T> {
  try {
    return await callback();
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      handlePrismaError<T>(error);
    }

    throwDatabaseError((error as Error).message);
  }
}
