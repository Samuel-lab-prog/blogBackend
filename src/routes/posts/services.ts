import * as r from './repository';
import * as t from './types';
import { throwNotFoundError } from '@utils';
import slugify from 'slugify';

/* ----------------------------- CREATE ----------------------------- */

export async function registerPost(
	body: t.PostNewPost,
): Promise<{ id: number }> {
	const slug = slugify(body.title, { lower: true, strict: true });
	const { tags, ...postData } = body;

	const normalizedTags = tags
		?.map((tag) => tag.trim())
		.filter(Boolean)
		.map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase());

	return r.insertPost({
		...postData,
		slug,
		tags: normalizedTags?.length
			? {
					connectOrCreate: normalizedTags.map((tag) => ({
						where: { name: tag },
						create: { name: tag },
					})),
				}
			: undefined,
	});
}

/* ----------------------------- READ ------------------------------ */

export async function fetchPost(key: t.PostUniqueKey): Promise<t.FullPost> {
	const post = await r.selectPost({ selectBy: key });
	if (!post) {
		throwNotFoundError('Post not found');
	}
	return post;
}

// Only allowing tags here. Cliente shoud not be able to filter by draft/deleted/status
// These filters will be used only in the admin routes
export async function fetchPostsPreviews(
	filter: { tag?: string },
	searchOptions: t.PostSearchOptions,
): Promise<t.PaginatedPostsPreview> {
	return await r.selectPosts({
		filter: {
			deleted: 'exclude',
			status: 'published',
			...filter,
		},
		searchOptions,
		dataType: 'preview',
	});
}

export async function fetchPostsMinimal(
	filter: t.SelectPostsFilter,
	searchOptions: t.PostSearchOptions,
): Promise<t.PaginatedMinimalPosts> {
	const data = await r.selectPosts({
		filter,
		searchOptions,
		dataType: 'minimal',
	});
	return data;
}

/* ----------------------------- UPDATE ----------------------------- */

export async function modifyPost(
	key: t.PostUniqueKey,
	data: t.PatchPost,
): Promise<{ id: number }> {
	const prismaData: t.UpdatePost = {};

	if (data.deleted) {
		prismaData.deletedAt = data.deleted ? new Date() : null;
	}

	if (data.title) {
		prismaData.title = data.title;
		prismaData.slug = slugify(data.title, {
			lower: true,
			strict: true,
		});
	}

	if (data.excerpt) prismaData.excerpt = data.excerpt;
	if (data.content) prismaData.content = data.content;
	if (data.status) prismaData.status = data.status;

	if (data.tags) {
		const normalizedTags = [
			...new Set(
				data.tags.map(
					(tag) =>
						tag.trim().charAt(0).toUpperCase() +
						tag.trim().slice(1).toLowerCase(),
				),
			),
		];

		prismaData.tags = {
			set: [],
			connectOrCreate: normalizedTags.map((tag) => ({
				where: { name: tag },
				create: { name: tag },
			})),
		};
	}

	return r.updatePost(key, prismaData);
}

/* ----------------------------- DELETE ----------------------------- */

export async function softRemovePost(
	key: t.PostUniqueKey,
): Promise<{ id: number }> {
	return r.updatePost(key, { deletedAt: new Date() });
}

export async function restoreDeletedPost(
	key: t.PostUniqueKey,
): Promise<{ id: number }> {
	return r.updatePost(key, { deletedAt: null });
}

/* ----------------------------- TAGS ------------------------------ */

export async function fetchTags(filter?: t.TagFilter): Promise<t.TagType[]> {
	return r.selectTags(filter);
}
