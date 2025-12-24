import { describe, it, expect, beforeEach } from 'bun:test';
import { AppError } from '@utils';
import { prisma } from '@prisma/client';
import * as r from './repository';
import * as t from './types';

const DEFAULT_POST: t.InsertPost = {
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

  it('insertPost -> should insert a post without tags and return only the id', async () => {
    const result = await r.insertPost(DEFAULT_POST);
    expect(result.id).toBeTypeOf('number');
  });

  it('insertPost -> should insert a post with tags', async () => {
    const result = await r.insertPost({
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

  it('insertPost -> default status should be published', async () => {
    const result = await r.insertPost(DEFAULT_POST);
    const dbPost = await prisma.post.findUnique({ where: { id: result.id } });

    expect(dbPost?.status).toBe('published');
  });

  it('insertPost -> should throw on duplicated slug', async () => {
    r.insertPost(DEFAULT_POST);

    await expect(r.insertPost(DEFAULT_POST)).rejects.toThrow(AppError);
  });

  it('selectPosts -> should return empty array if no match', async () => {
    const result = await r.selectPosts({
      dataType: 'full',
      filter: { selectBy: { type: 'id', id: ABSURD_ID } },
    });

    expect(result.posts).toHaveLength(0);
  });

  it('selectPosts -> should return only drafts when configured', async () => {
    await r.insertPost({ ...DEFAULT_POST, title: 'Published', slug: 'pub', status: 'published' });
    await r.insertPost({ ...DEFAULT_POST, title: 'Draft', slug: 'draft', status: 'draft' });
    await r.insertPost({
      ...DEFAULT_POST,
      title: 'Deleted',
      slug: 'deleted',
      deletedAt: new Date(),
    });

    const result = await r.selectPosts({
      dataType: 'full',
      filter: { deleted: 'exclude', status: 'draft' },
    });

    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]?.status).toBe('draft');
  });

  it('selectPosts -> should return only deleted posts', async () => {
    const result = await r.selectPosts({
      dataType: 'full',
      filter: { deleted: 'only' },
    });

    expect(result.posts).toHaveLength(0);
  });

  it('selectPosts -> should return a full post', async () => {
    const created = await r.insertPost(DEFAULT_POST);

    const result = await r.selectPosts({
      dataType: 'full',
      filter: { selectBy: { type: 'id', id: created.id } },
    });

    expect(result.posts[0]?.title).toBe(DEFAULT_POST.title);
  });

  it('selectPosts (preview) -> empty when no published posts', async () => {
    const result = await r.selectPosts({
      dataType: 'preview',
      filter: {},
    });

    expect(result.posts).toHaveLength(0);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeUndefined();
  });

  it('selectPosts (preview) -> should return only published posts', async () => {
    await r.insertPost({ ...DEFAULT_POST, title: 'Draft', slug: 'draft', status: 'draft' });
    await r.insertPost({
      ...DEFAULT_POST,
      title: 'Deleted',
      slug: 'deleted',
      deletedAt: new Date(),
    });
    await r.insertPost({
      ...DEFAULT_POST,
      title: 'Published',
      slug: 'published',
      status: 'published',
    });

    const result = await r.selectPosts({
      dataType: 'preview',
      filter: { deleted: 'exclude', status: 'published' },
    });

    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]?.title).toBe('Published');
  });

  it('selectPosts (preview) -> should filter by tag', async () => {
    const tag = await prisma.tag.create({ data: { name: 'javascript' } });

    await r.insertPost({
      ...DEFAULT_POST,
      title: 'With tag',
      slug: 'with-tag',
      tags: { connect: { id: tag.id } },
    });

    await r.insertPost({
      ...DEFAULT_POST,
      title: 'Without tag',
      slug: 'without-tag',
    });

    const result = await r.selectPosts({
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

  it('selectPosts -> should paginate with cursor', async () => {
    const POSTS_COUNT = 15;
    const LIMIT = 5;

    await Promise.all(
      Array.from({ length: POSTS_COUNT }, (_, i) =>
        r.insertPost({
          ...DEFAULT_POST,
          title: `Post ${i + 1}`,
          slug: `post-${i + 1}`,
        })
      )
    );

    const first = await r.selectPosts({
      dataType: 'preview',
      searchOptions: { limit: LIMIT },
    });

    expect(first.posts).toHaveLength(LIMIT);
    expect(first.hasMore).toBe(true);

    const second = await r.selectPosts({
      dataType: 'preview',
      filter: { deleted: 'exclude', status: 'published' },
      searchOptions: { cursor: first.nextCursor, limit: LIMIT },
    });

    expect(second.posts.length).toBe(LIMIT);
  });

  it('updatePost -> should soft delete post', async () => {
    const created = await r.insertPost(DEFAULT_POST);

    await r.updatePost({ type: 'id', id: created.id }, { deletedAt: new Date() });

    const post = await prisma.post.findUnique({ where: { id: created.id } });
    expect(post?.deletedAt).toBeInstanceOf(Date);
  });

  it('updatePost -> should throw when post does not exist', async () => {
    await expect(
      r.updatePost({ type: 'id', id: ABSURD_ID }, { deletedAt: new Date() })
    ).rejects.toThrow(AppError);
  });

  it('updatePost -> should restore soft deleted post', async () => {
    const created = await r.insertPost({
      ...DEFAULT_POST,
      deletedAt: new Date(),
    });

    await r.updatePost({ type: 'id', id: created.id }, { deletedAt: null });

    const post = await prisma.post.findUnique({ where: { id: created.id } });
    expect(post?.deletedAt).toBeNull();
  });

  it('updatePost -> should update post status', async () => {
    const created = await r.insertPost({
      ...DEFAULT_POST,
      status: 'draft',
    });

    await r.updatePost({ type: 'id', id: created.id }, { status: 'published' });

    const post = await prisma.post.findUnique({ where: { id: created.id } });
    expect(post?.status).toBe('published');
  });

  it('selectTags -> should return empty list when no tags', async () => {
    const tags = await r.selectTags();
    expect(tags).toHaveLength(0);
  });
});
