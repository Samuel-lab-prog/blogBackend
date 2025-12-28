import { t } from 'elysia';
import type { OrderBy, OrderDirection } from './model/types';
import { idSchema, dateSchema, makeValidationError } from '@utils';

export const postStatusSchema = t.UnionEnum(['published', 'draft'], {
	example: 'published',
	...makeValidationError('Status must be either draft or published'),
});

export const titleSchema = t.String({
	minLength: 3,
	maxLength: 100,
	example: 'My First Blog Post',
	...makeValidationError('Title must be between 3 and 100 characters'),
});

export const slugSchema = t.String({
	minLength: 3,
	maxLength: 150,
	readOnly: true, // Slug is generated, so it's read-only
	example: 'my-first-blog-post',
	...makeValidationError('Slug must be between 3 and 150 characters'),
});

export const contentSchema = t.String({
	minLength: 10,
	example: 'This is the content of my first blog post.',
	...makeValidationError('Content must be at least 10 characters long'),
});

export const excerptSchema = t.String({
	minLength: 10,
	maxLength: 200,
	example: 'This is a brief excerpt of my first blog post.',
	...makeValidationError('Excerpt must be between 10 and 200 characters'),
});

export const tagNameSchema = t.String({
	minLength: 3,
	maxLength: 50,
	example: 'Technology',
	...makeValidationError('Each tag must be between 3 and 50 characters'),
});

export const tagSchema = t.Object({
	name: tagNameSchema,
	id: idSchema,
});

export const tagsSchema = t.Array(tagSchema, {
	minItems: 1,
	maxItems: 5,
	example: [
		{ id: 1, name: 'Technology' },
		{ id: 2, name: 'Programming' },
	],
	...makeValidationError('Tags must be an array with 1 to 5 tag objects'),
});

export const postNewPost = t.Object({
	title: titleSchema,
	excerpt: excerptSchema,
	content: contentSchema,
	tags: t.Optional(t.Array(tagNameSchema)),
	status: t.Optional(postStatusSchema),
});

export const patchPost = t.Partial(
	t.Object({
		title: titleSchema,
		excerpt: excerptSchema,
		content: contentSchema,
		tags: t.Array(tagNameSchema),
		status: postStatusSchema,
	}),
	{
		minProperties: 1,
		...makeValidationError(
			'At least one field must be provided to update the post',
		),
	},
);

export const fullPostSchema = t.Object({
	title: titleSchema,
	slug: slugSchema,
	content: contentSchema,
	excerpt: excerptSchema,
	tags: t.Array(tagSchema),
	status: postStatusSchema,
	id: idSchema,
	createdAt: dateSchema,
	updatedAt: dateSchema,
});

export const minimalPostSchema = t.Object({
	id: idSchema,
	title: titleSchema,
});

export const postPreviewSchema = t.Object({
	title: titleSchema,
	slug: slugSchema,
	excerpt: excerptSchema,
	tags: t.Array(tagSchema),
	id: idSchema,
	updatedAt: dateSchema,
	createdAt: dateSchema,
});

export const paginatedPostsFullSchema = t.Object({
	posts: t.Array(fullPostSchema),
	nextCursor: t.Optional(idSchema),
	hasMore: t.Boolean(),
});

export const paginatedPostsPreviewSchema = t.Object({
	posts: t.Array(postPreviewSchema),
	nextCursor: t.Optional(idSchema),
	hasMore: t.Boolean(),
});

export const paginatedPostsMinimalSchema = t.Object({
	posts: t.Array(minimalPostSchema),
	nextCursor: t.Optional(idSchema),
	hasMore: t.Boolean(),
});

export const orderDirectionSchema = t.Union([
	t.Literal('asc'),
	t.Literal('desc'),
]);

export const orderBySchema = t.Union([
	t.Literal('createdAt'),
	t.Literal('updatedAt'),
	t.Literal('id'),
	t.Literal('title'),
]);
type _AssertExtends<_T extends _U, _U> = true;

type _AssertOrderBy = _AssertExtends<(typeof orderBySchema)['static'], OrderBy>;

type _AssertOrderDirection = _AssertExtends<
	(typeof orderDirectionSchema)['static'],
	OrderDirection
>;
