import { t } from 'elysia';
import {
	titleSchema,
	excerptSchema,
	contentSchema,
	tagNameSchema,
	postStatusSchema,
	idSchema,
	slugSchema,
	tagSchema,
	dateSchema,
	makeValidationError,
} from '@utils';

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
		deleted: t.Boolean(),
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
]);
