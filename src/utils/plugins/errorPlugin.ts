/* eslint-disable @typescript-eslint/no-explicit-any */
import Elysia from 'elysia';
import { AppError } from '../AppError.ts';
import { log } from '../logger.ts';
import { SetupPlugin } from './setupPlugin.ts';

export function handleError(
	set: any,
	error: unknown,
	code: any,
	reqId: string,
	request: Request,
) {
	const isAppError = error instanceof AppError;

	const path = request.url.substring(request.url.indexOf('/', 8));
	const method = request.method;
	let status = undefined;
	let message = undefined;

	if (isAppError) {
		status = (error as AppError).statusCode;
		message = (error as AppError).errorMessages.join('; ');
		set.status = status;

		log.error(
			{
				reqId,
				path,
				method,
				status,
				message,
			},
			'An error occurred while processing the request',
		);

		return sendAppError(error);
	}

	let normalizedCode = code;

	if (typeof normalizedCode !== 'string') {
		normalizedCode = 'UNKNOWN';
	}

	const converted = convertElysiaError(normalizedCode);
	status = converted.statusCode;
	message = converted.errorMessages.join('; ');
	set.status = status;

	log.error(
		{
			reqId,
			path,
			method,
			status,
			message,
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

function convertElysiaError(code: string): AppError {
	switch (code) {
		case 'NOT_FOUND':
			return new AppError({
				statusCode: 404,
				errorMessages: ['Not Found: resource not found'],
			});
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
			return new AppError({
				statusCode: 400,
				errorMessages: ['Bad request: invalid file type'],
			});
		case 'INTERNAL_SERVER_ERROR':
		case 'UNKNOWN':
		default:
			return new AppError({
				statusCode: 500,
				errorMessages: ['Internal server error'],
			});
	}
}

export const ErrorPlugin = new Elysia()
	.use(SetupPlugin)
	.onError({ as: 'scoped' }, ({ error, set, code, store, request }) =>
		handleError(set, error, code, store.reqId, request),
	);
