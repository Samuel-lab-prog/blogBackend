import { Elysia, t, type CookieOptions } from 'elysia';
import { appErrorSchema, loginSchema, authPlugin, SetupPlugin } from '@utils';
import { loginUser } from './services';

function setUpCookieTokenOptions(token: CookieOptions) {
	token.httpOnly = true;
	token.path = '/';
	token.maxAge = 60 * 60 * 24 * 7;
	token.secure = process.env.NODE_ENV === 'prod';
	token.sameSite = 'none';
}

export const authRouter = new Elysia().group('/auth', (app) =>
	app
		.use(SetupPlugin)
		.post(
			'/login',
			async ({ body, cookie, set, store }) => {
				const authInitiated = performance.now();
				const result = await loginUser(body.email, body.password);

				cookie.token!.value = result.token;
				setUpCookieTokenOptions(cookie.token!);

				set.status = 204;
				store.userId = result.data.id;
				store.role = 'admin';
				store.authTiming = Math.round(performance.now() - authInitiated);
			},
			{
				body: loginSchema,
				response: {
					204: t.Void(),
					400: appErrorSchema,
					401: appErrorSchema,
					422: appErrorSchema,
					500: appErrorSchema,
				},
				detail: {
					summary: 'Login',
					description:
						'Authenticates a user and returns a JWT token in an HTTP-only cookie.',
					tags: ['Auth'],
				},
			},
		)
		.use(authPlugin)
		.post(
			'',
			({ set }) => {
				set.status = 204;
			},
			{
				response: {
					204: t.Void(),
					401: appErrorSchema,
					500: appErrorSchema,
				},
				detail: {
					summary: 'Authenticated Route',
					description: 'A dummy protected route to verify authentication.',
					tags: ['Auth'],
				},
			},
		),
);
