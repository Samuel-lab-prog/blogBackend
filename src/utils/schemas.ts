import { t } from 'elysia';
import { makeValidationError } from './AppError';

//--------------------GENERAL SCHEMAS---------------------//

export const dateSchema = t.Date({
	example: '2024-01-01T12:00:00Z',
	...makeValidationError('CreatedAt must be a valid date string'),
});

export const idSchema = t.Number({
	minimum: 1,
	example: 1,
	readOnly: true,
	...makeValidationError('ID must be a positive integer'),
});

export const emailSchema = t.String({
	format: 'email',
	example: 'sg38293@example.com',
	...makeValidationError('Email must be a valid email address'),
});

export const passwordSchema = t.String({
	minLength: 8,
	maxLength: 30,
	example: 'StrongP@ssw0rd!',
	...makeValidationError('Password must be between 8 and 30 characters'),
});

export const loginSchema = t.Object({
	email: emailSchema,
	password: passwordSchema,
});
