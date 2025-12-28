/* eslint-disable @typescript-eslint/no-explicit-any */
import Elysia from 'elysia';
import { AppError } from '../AppError.ts';
import { log } from '../logger.ts';
import { SetupPlugin, type SetupPluginType } from './setupPlugin.ts';

function handleError(
	set: any,
	error: unknown,
	code: any,
	request: Request,
	store: SetupPluginType,
) {
	const isAppError = error instanceof AppError;

	const path = request.url.substring(request.url.indexOf('/', 8));
	const method = request.method;
	const reqId = store.reqId;
	const authMs = store.authTiming;
	const userId = store.userId;
	const role = store.role;
	const isAuthenticated = !!userId;
	const totalMs = performance.now() - store.reqInitiatedAt;

	let status,
		message = undefined;

	if (isAppError) {
		status = (error as AppError).statusCode;
		message = (error as AppError).message;

		set.status = status;

		log.error(
			{
				request: {
					reqId,
					method,
					path,
				},
				response: {
					status,
					message,
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
			'An error occurred while processing the request',
		);

		return sendAppError(error);
	}

	let normalizedCode = code;

	if (typeof normalizedCode !== 'string') {
		normalizedCode = 'UNKNOWN';
	}

	const converted = convertElysiaError(normalizedCode, error);
	status = converted.statusCode;
	message = converted.message;
	set.status = status;

	log.error(
		{
			request: {
				reqId,
				method,
				path,
			},
			response: {
				status,
				message,
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
		'An error occurred while processing the request',
	);

	return sendAppError(converted);
}
function sendAppError(err: AppError) {
	return {
		errorMessages: err.errorMessages,
		statusCode: err.statusCode,
	};
}

function convertElysiaError(code: string, error: unknown): AppError {
	const originalErrorMessage =
		error instanceof Error ? error.message : 'No error message available';
	switch (code) {
		case 'NOT_FOUND':
			return new AppError({
				statusCode: 404,
				errorMessages: ['Not Found: resource not found', originalErrorMessage],
			});
		case 'PARSE':
			return new AppError({
				statusCode: 400,
				errorMessages: [
					'Bad request: failed to parse request body',
					originalErrorMessage,
				],
			});
		case 'VALIDATION':
			return new AppError({
				statusCode: 422,
				errorMessages: [
					'Unprocessable entity: validation failed',
					originalErrorMessage,
				],
			});
		case 'INVALID_COOKIE_SIGNATURE':
			return new AppError({
				statusCode: 401,
				errorMessages: [
					'Unauthorized: invalid cookie signature',
					originalErrorMessage,
				],
			});
		case 'INVALID_FILE_TYPE':
			return new AppError({
				statusCode: 400,
				errorMessages: ['Bad request: invalid file type', originalErrorMessage],
			});
		case 'INTERNAL_SERVER_ERROR':
		case 'UNKNOWN':
		default:
			return new AppError({
				statusCode: 500,
				errorMessages: ['Internal server error', originalErrorMessage],
			});
	}
}

export const ErrorPlugin = new Elysia()
	.use(SetupPlugin)
	.onError({ as: 'scoped' }, ({ error, set, code, store, request }) =>
		handleError(set, error, code, request, store),
	);
