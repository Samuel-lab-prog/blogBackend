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
		it('should insert a post without tags and return only the id', async () => {
			const result = await insertPost(DEFAULT_POST);
			expect(result.id).toBeTypeOf('number');
		});

		it('should insert a post with tags', async () => {
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

		it('default status should be published', async () => {
			const result = await insertPost(DEFAULT_POST);
			const dbPost = await prisma.post.findUnique({
				where: { id: result.id },
			});

			expect(dbPost?.status).toBe('published');
		});

		it('should throw on duplicated slug', async () => {
			insertPost(DEFAULT_POST);

			await expect(insertPost(DEFAULT_POST)).rejects.toThrow(AppError);
		});
	});

	describe('selectPost', () => {
		it('should return null when no post found', async () => {
			const post = await selectPost({
				selectBy: { type: 'id', id: ABSURD_ID },
			});
			expect(post).toBeNull();
		});

		it('should return a post by id', async () => {
			const created = await insertPost(DEFAULT_POST);
			const post = await selectPost({
				selectBy: { type: 'id', id: created.id },
			});

			expect(post).not.toBeNull();
			expect(post?.title).toBe(DEFAULT_POST.title);
		});

		it('should return a post by slug', async () => {
			await insertPost(DEFAULT_POST);
			const post = await selectPost({
				selectBy: { type: 'slug', slug: DEFAULT_POST.slug },
			});
			expect(post).not.toBeNull();
			expect(post?.title).toBe(DEFAULT_POST.title);
		});
	});

	describe('selectPosts', () => {
		it('should return empty array if no match', async () => {
			const result = await selectPosts({
				dataType: 'full',
				filter: { selectBy: { type: 'id', id: ABSURD_ID } },
			});

			expect(result.posts).toHaveLength(0);
		});

		it('should return only drafts when configured', async () => {
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

		it('should return only deleted posts when configured', async () => {
			const result = await selectPosts({
				dataType: 'full',
				filter: { deleted: 'only' },
			});

			expect(result.posts).toHaveLength(0);
		});

		it('should return a full post by id', async () => {
			const created = await insertPost(DEFAULT_POST);

			const result = await selectPosts({
				dataType: 'full',
				filter: { selectBy: { type: 'id', id: created.id } },
			});

			expect(result.posts[0]?.title).toBe(DEFAULT_POST.title);
		});

		it('preview -> empty when no published posts', async () => {
			const result = await selectPosts({
				dataType: 'preview',
				filter: {},
			});

			expect(result.posts).toHaveLength(0);
			expect(result.hasMore).toBe(false);
			expect(result.nextCursor).toBeUndefined();
		});

		it('preview -> should return only published posts', async () => {
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

		it('preview -> should filter by tag', async () => {
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

		it('should paginate with cursor', async () => {
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
		it('should soft delete post', async () => {
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

		it('should throw when post does not exist', async () => {
			await expect(
				updatePost({ type: 'id', id: ABSURD_ID }, { deletedAt: new Date() }),
			).rejects.toThrow(AppError);
		});

		it('should restore soft deleted post', async () => {
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

		it('should update post status', async () => {
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
	});
});
