import {
	postNewPost,
	patchPost,
	fullPostSchema,
	postPreviewSchema,
	minimalPostSchema,
	paginatedPostsMinimalSchema,
	paginatedPostsPreviewSchema,
	paginatedPostsFullSchema,
} from '../schemas';

import type {
	PostCreateInput,
	PostUpdateInput,
} from '@prisma/generated/models';

export type PostNewPost = (typeof postNewPost)['static'];
export type PatchPost = (typeof patchPost)['static'];

export type FullPost = (typeof fullPostSchema)['static'];
export type PostPreview = (typeof postPreviewSchema)['static'];
export type PostMinimal = (typeof minimalPostSchema)['static'];

export type PaginatedFullPosts = (typeof paginatedPostsFullSchema)['static'];
export type PaginatedPostsPreview =
	(typeof paginatedPostsPreviewSchema)['static'];
export type PaginatedMinimalPosts =
	(typeof paginatedPostsMinimalSchema)['static'];

export type PostStatus = (typeof fullPostSchema.properties.status)['static'];
export type TagType = (typeof fullPostSchema.properties.tags.items)['static'];

export type InsertPost = PostCreateInput;
export type UpdatePost = PostUpdateInput;

// Needs to match in schemas.ts
export type OrderBy = 'createdAt' | 'updatedAt' | 'title' | 'id';
export type OrderDirection = 'asc' | 'desc';

export type PostSearchOptions = {
	cursor?: number;
	limit?: number;
	orderBy?: OrderBy;
	orderDirection?: OrderDirection;
};

export type PostUniqueKey =
	| { type: 'id'; id: number }
	| { type: 'slug'; slug: string };

export function parsePostKey(idOrSlug: string | number): PostUniqueKey {
	return typeof idOrSlug === 'number'
		? { type: 'id', id: idOrSlug }
		: { type: 'slug', slug: idOrSlug };
}

export type SelectPostsFilter = {
	selectBy?: PostUniqueKey;
	deleted?: 'exclude' | 'only';
	status?: 'published' | 'draft';
	tag?: string;
};

export type TagFilter = {
	nameContains?: string;
	includeFromDrafts?: boolean;
	includeFromDeleted?: boolean;
};

export type SelectPostsOptions = {
	filter?: SelectPostsFilter;
	searchOptions?: PostSearchOptions;
};

export type PostDataType = {
	full: FullPost;
	minimal: PostMinimal;
	preview: PostPreview;
};

export type NormalizedPostsSearchOptions = Required<
	Pick<PostSearchOptions, 'limit' | 'orderBy' | 'orderDirection'>
> &
	Pick<PostSearchOptions, 'cursor'>;

export type NormalizedTagFilter = {
	nameContains?: string;
	includeFromDrafts: boolean;
	includeFromDeleted: boolean;
};
