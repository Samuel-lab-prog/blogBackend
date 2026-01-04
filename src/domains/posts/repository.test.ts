import { describe, it, expect, beforeEach } from 'bun:test';
import { AppError } from '@utils';
import { prisma } from '@prisma/client';
import {
	insertPost,
	selectPosts,
	selectTags,
	updatePost,
	selectPost,
} from './repository';
import { type InsertPost } from './model/types';

const DEFAULT_POST: InsertPost = {
	title: 'Default Title',
	slug: 'default-title',
	content: 'This is a sample post content.',
	excerpt: 'This is a sample excerpt.',
};

const ABSURD_ID = 10_000_000;

describe('Post repository', () => {
	beforeEach(async () => {
		await prisma.tag.deleteMany();
		await prisma.post.deleteMany();
	});

	describe('insertPost', () => {
		it('Should insert a post without tags and return only an object with an id', async () => {
			const result = await insertPost(DEFAULT_POST);
			expect(result.id).toBeTypeOf('number');
		});

		it('Should insert a post with tags and return only an object with an id', async () => {
			const result = await insertPost({
				...DEFAULT_POST,
				tags: {
					connectOrCreate: [
						{ where: { name: 'Tag1' }, create: { name: 'Tag1' } },
						{ where: { name: 'Tag2' }, create: { name: 'Tag2' } },
					],
				},
			});

			expect(result.id).toBeTypeOf('number');
		});

		it('Default status should be published if not specified', async () => {
			const result = await insertPost(DEFAULT_POST);
			const dbPost = await prisma.post.findUnique({
				where: { id: result.id },
			});

			expect(dbPost?.status).toBe('published');
		});

		it('Should throw when inserting a post with a duplicated slug', async () => {
			insertPost(DEFAULT_POST);

			await expect(insertPost(DEFAULT_POST)).rejects.toThrow(AppError);
		});
	});

	describe('selectPost', () => {
		it('Should return null when no post found', async () => {
			const post = await selectPost({
				selectBy: { type: 'id', id: ABSURD_ID },
			});
			expect(post).toBeNull();
		});

		it('Should return a post by id correctly', async () => {
			const created = await insertPost(DEFAULT_POST);
			const post = await selectPost({
				selectBy: { type: 'id', id: created.id },
			});

			expect(post).not.toBeNull();
			expect(post?.title).toBe(DEFAULT_POST.title);
		});

		it('Should return a post by slug correctly', async () => {
			await insertPost(DEFAULT_POST);
			const post = await selectPost({
				selectBy: { type: 'slug', slug: DEFAULT_POST.slug },
			});
			expect(post).not.toBeNull();
			expect(post?.title).toBe(DEFAULT_POST.title);
		});
	});

	describe('selectPosts', () => {
		it('Should return empty array if no match', async () => {
			const result = await selectPosts({
				dataType: 'full',
				filter: { selectBy: { type: 'id', id: ABSURD_ID } },
			});

			expect(result.posts).toHaveLength(0);
		});

		it('Should return only drafts when configured', async () => {
			await insertPost({
				...DEFAULT_POST,
				title: 'Published',
				slug: 'pub',
				status: 'published',
			});
			await insertPost({
				...DEFAULT_POST,
				title: 'Draft',
				slug: 'draft',
				status: 'draft',
			});
			await insertPost({
				...DEFAULT_POST,
				title: 'Deleted',
				slug: 'deleted',
				deletedAt: new Date(),
			});

			const result = await selectPosts({
				dataType: 'full',
				filter: { deleted: 'exclude', status: 'draft' },
			});

			expect(result.posts).toHaveLength(1);
			expect(result.posts[0]?.status).toBe('draft');
		});

		it('Should return only deleted posts when configured', async () => {
			const result = await selectPosts({
				dataType: 'full',
				filter: { deleted: 'only' },
			});

			expect(result.posts).toHaveLength(0);
		});

		it('Should return a full post by id', async () => {
			const created = await insertPost(DEFAULT_POST);

			const result = await selectPosts({
				dataType: 'full',
				filter: { selectBy: { type: 'id', id: created.id } },
			});

			expect(result.posts[0]?.title).toBe(DEFAULT_POST.title);
		});

		it('Preview -> empty when no published posts', async () => {
			const result = await selectPosts({
				dataType: 'preview',
				filter: {},
			});

			expect(result.posts).toHaveLength(0);
			expect(result.hasMore).toBe(false);
			expect(result.nextCursor).toBeUndefined();
		});

		it('Should return only published posts if configured', async () => {
			await insertPost({
				...DEFAULT_POST,
				title: 'Draft',
				slug: 'draft',
				status: 'draft',
			});
			await insertPost({
				...DEFAULT_POST,
				title: 'Deleted',
				slug: 'deleted',
				deletedAt: new Date(),
			});
			await insertPost({
				...DEFAULT_POST,
				title: 'Published',
				slug: 'published',
				status: 'published',
			});

			const result = await selectPosts({
				dataType: 'preview',
				filter: { deleted: 'exclude', status: 'published' },
			});

			expect(result.posts).toHaveLength(1);
			expect(result.posts[0]?.title).toBe('Published');
		});

		it('Should filter by tag correctly', async () => {
			const tag = await prisma.tag.create({
				data: { name: 'javascript' },
			});

			await insertPost({
				...DEFAULT_POST,
				title: 'With tag',
				slug: 'with-tag',
				tags: { connect: { id: tag.id } },
			});

			await insertPost({
				...DEFAULT_POST,
				title: 'Without tag',
				slug: 'without-tag',
			});

			const result = await selectPosts({
				dataType: 'preview',
				filter: {
					tag: 'javascript',
					deleted: 'exclude',
					status: 'published',
				},
			});

			expect(result.posts).toHaveLength(1);
			expect(result.posts[0]?.tags[0]?.name).toBe('javascript');
		});

		it('Should paginate with cursor correctly', async () => {
			const POSTS_COUNT = 15;
			const LIMIT = 5;

			await Promise.all(
				Array.from({ length: POSTS_COUNT }, (_, i) =>
					insertPost({
						...DEFAULT_POST,
						title: `Post ${i + 1}`,
						slug: `post-${i + 1}`,
					}),
				),
			);

			const first = await selectPosts({
				dataType: 'preview',
				searchOptions: { limit: LIMIT },
			});

			expect(first.posts).toHaveLength(LIMIT);
			expect(first.hasMore).toBe(true);

			const second = await selectPosts({
				dataType: 'preview',
				filter: { deleted: 'exclude', status: 'published' },
				searchOptions: {
					cursor: first.nextCursor,
					limit: LIMIT,
				},
			});

			expect(second.posts).toHaveLength(LIMIT);
		});
	});

	describe('updatePost', () => {
		it('Should soft delete post', async () => {
			const created = await insertPost(DEFAULT_POST);

			await updatePost(
				{ type: 'id', id: created.id },
				{ deletedAt: new Date() },
			);

			const post = await prisma.post.findUnique({
				where: { id: created.id },
			});

			expect(post?.deletedAt).toBeInstanceOf(Date);
		});

		it('Should throw when post does not exist', async () => {
			await expect(
				updatePost({ type: 'id', id: ABSURD_ID }, { deletedAt: new Date() }),
			).rejects.toThrow(AppError);
		});

		it('Should restore soft deleted post', async () => {
			const created = await insertPost({
				...DEFAULT_POST,
				deletedAt: new Date(),
			});

			await updatePost({ type: 'id', id: created.id }, { deletedAt: null });

			const post = await prisma.post.findUnique({
				where: { id: created.id },
			});

			expect(post?.deletedAt).toBeNull();
		});

		it('Should update post status correctly', async () => {
			const created = await insertPost({
				...DEFAULT_POST,
				status: 'draft',
			});

			await updatePost({ type: 'id', id: created.id }, { status: 'published' });

			const post = await prisma.post.findUnique({
				where: { id: created.id },
			});

			expect(post?.status).toBe('published');
		});
	});

	describe('selectTags', () => {
		it('should return empty list when no tags', async () => {
			const tags = await selectTags();
			expect(tags).toHaveLength(0);
		});

		it('Should return all tags', async () => {
			await insertPost({
				...DEFAULT_POST,
				title: 'Post with tags',
				slug: 'post-with-tags',
				tags: {
					connectOrCreate: [
						{ where: { name: 'Tag1' }, create: { name: 'Tag1' } },
						{ where: { name: 'Tag2' }, create: { name: 'Tag2' } },
					],
				},
			});
			const tags = await selectTags();
			expect(tags).toHaveLength(2);
		});
	});
});
