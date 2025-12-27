import { prisma } from '@prisma/client';
import { withPrismaErrorHandling } from '@utils';
import type { PostSelect, PostWhereInput } from '@prisma/generated/models';
import type {
	SelectPostsFilter,
	SelectPostsOptions,
	NormalizedPostsSearchOptions,
	InsertPost,
	UpdatePost,
	TagFilter,
	PostDataType,
	FullPost,
	TagType,
	PostSearchOptions,
	PostUniqueKey,
} from './model/types.ts';

import {
	postCreateSelect,
	postMinimalSelect,
	postPreviewSelect,
	fullPostSelect,
} from './model/prisma.ts';

export async function insertPost(data: InsertPost): Promise<{ id: number }> {
	return withPrismaErrorHandling<{ id: number }>(() =>
		prisma.post.create({
			data,
			select: postCreateSelect,
		}),
	);
}

// You don't need to explicitly pass the T parameter, TS will infer it from the options
export async function selectPosts<T extends keyof PostDataType>(
	options: SelectPostsOptions & { dataType: T },
): Promise<{
	posts: PostDataType[T][];
	nextCursor?: number;
	hasMore: boolean;
}> {
	const { cursor, limit, orderBy, orderDirection } = normalizeSearchOptions(
		options.searchOptions,
	);
	const where = buildPostsWhereClause(options.filter);

	const posts = await withPrismaErrorHandling(() =>
		prisma.post.findMany({
			where,
			select: postSelectMap[options.dataType] as PostSelect, // Using alias here is necessary for TS to infer correctly
			orderBy: [{ [orderBy]: orderDirection }, { id: 'asc' }],
			take: limit + 1,
			...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
		}),
	);

	const hasMore = posts.length > limit;
	if (hasMore) posts.pop();

	return {
		posts,
		nextCursor: hasMore ? posts.at(-1)?.id : undefined,
		hasMore,
	};
}

export async function selectPost(
	filter: SelectPostsFilter,
): Promise<FullPost | null> {
	const where = buildPostsWhereClause(filter);
	return await withPrismaErrorHandling<FullPost | null>(() =>
		prisma.post.findFirst({
			where,
			select: postSelectMap['full'] as PostSelect,
		}),
	);
}

// Need to refactor this later
export function selectTags(tagFilter?: TagFilter): Promise<TagType[]> {
	const nameContains = tagFilter?.nameContains ?? undefined;
	const includeFromDrafts = tagFilter?.includeFromDrafts ?? false;
	const includeFromDeleted = tagFilter?.includeFromDeleted ?? false;

	return withPrismaErrorHandling<TagType[]>(() =>
		prisma.tag.findMany({
			orderBy: { name: 'asc' },
			where: {
				...(nameContains && {
					name: { contains: nameContains, mode: 'insensitive' },
				}),
				posts: {
					some: {
						...(includeFromDrafts === false && { status: 'published' }),
						...(includeFromDeleted === false && { deletedAt: null }),
					},
				},
			},
		}),
	);
}

export async function updatePost(
	key: PostUniqueKey,
	data: UpdatePost,
): Promise<{ id: number }> {
	return withPrismaErrorHandling<{ id: number }>(() =>
		prisma.post.update({
			where: {
				...(key.type === 'id' ? { id: key.id } : { slug: key.slug }),
			},
			data,
			select: { id: true },
		}),
	);
}

const postSelectMap = {
	preview: postPreviewSelect,
	minimal: postMinimalSelect,
	full: fullPostSelect,
} satisfies Record<keyof PostDataType, PostSelect>;

function buildPostsWhereClause(filter: SelectPostsFilter = {}): PostWhereInput {
	const where: PostWhereInput = {};

	if (filter.selectBy) {
		switch (filter.selectBy.type) {
			case 'id':
				where.id = filter.selectBy.id;
				break;

			case 'slug':
				where.slug = filter.selectBy.slug;
				break;
		}
	}

	if (filter.deleted === 'exclude') {
		where.deletedAt = null;
	}

	if (filter.deleted === 'only') {
		where.deletedAt = { not: null };
	}

	if (filter.status) {
		where.status = filter.status;
	}

	if (filter.tag) {
		where.tags = {
			some: {
				name: filter.tag,
			},
		};
	}

	return where;
}

function normalizeSearchOptions(
	options: PostSearchOptions = {},
): NormalizedPostsSearchOptions {
	return {
		cursor: options.cursor,
		limit: options.limit ?? 10,
		orderBy: options.orderBy ?? 'createdAt',
		orderDirection: options.orderDirection ?? 'desc',
	};
}
