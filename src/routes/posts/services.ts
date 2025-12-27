import {
	insertPost,
	selectPost,
	selectPosts,
	updatePost,
	selectTags,
} from './repository';

import type {
	FullPost,
	PostSearchOptions,
	PaginatedPostsPreview,
	PaginatedMinimalPosts,
	PostUniqueKey,
	PostNewPost,
	PatchPost,
	TagFilter,
	TagType,
	SelectPostsFilter,
	UpdatePost,
} from './model/types';

import { throwNotFoundError } from '@utils';
import slugify from 'slugify';

export async function registerPost(body: PostNewPost): Promise<{ id: number }> {
	const slug = slugify(body.title, { lower: true, strict: true });
	const { tags, ...postData } = body;

	const normalizedTags = tags
		?.map((tag) => tag.trim())
		.filter(Boolean)
		.map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase());

	return insertPost({
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

export async function fetchPost(key: PostUniqueKey): Promise<FullPost> {
	const post = await selectPost({ selectBy: key });
	if (!post) {
		throwNotFoundError('Post not found');
	}
	return post;
}

// Only allowing tags here. User shoud not be able to filter by draft/deleted/status
// These filters will be used only in the admin routes
export async function fetchPostsPreviews(
	filter: { tag?: string },
	searchOptions: PostSearchOptions,
): Promise<PaginatedPostsPreview> {
	return await selectPosts({
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
	filter: SelectPostsFilter,
	searchOptions: PostSearchOptions,
): Promise<PaginatedMinimalPosts> {
	const data = await selectPosts({
		filter,
		searchOptions,
		dataType: 'minimal',
	});
	return data;
}

export async function modifyPost(
	key: PostUniqueKey,
	data: PatchPost,
): Promise<{ id: number }> {
	const prismaData: UpdatePost = {};

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

	return updatePost(key, prismaData);
}

export async function softRemovePost(
	key: PostUniqueKey,
): Promise<{ id: number }> {
	return updatePost(key, { deletedAt: new Date() });
}

export async function restoreDeletedPost(
	key: PostUniqueKey,
): Promise<{ id: number }> {
	return updatePost(key, { deletedAt: null });
}

export async function fetchTags(filter?: TagFilter): Promise<TagType[]> {
	return selectTags(filter);
}
