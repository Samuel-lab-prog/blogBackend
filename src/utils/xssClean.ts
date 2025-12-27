/* eslint-disable @typescript-eslint/no-explicit-any */
import xss from 'xss';
import type { Context } from 'elysia';

export function sanitize(value: any): any {
	if (typeof value === 'string') return xss(value);

	if (Array.isArray(value)) return value.map(sanitize);

	if (typeof value === 'object' && value !== null) {
		const result: any = {};
		for (const key in value) {
			result[key] = sanitize(value[key]);
		}
		return result;
	}

	return value;
}

export function xssClean(ctx: Context) {
	if (ctx.body) ctx.body = sanitize(ctx.body);
	if (ctx.query) ctx.query = sanitize(ctx.query);
	if (ctx.params) ctx.params = sanitize(ctx.params);
}
