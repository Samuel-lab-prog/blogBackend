import { describe, it, expect, beforeEach } from 'bun:test';
import { prisma } from '../../prisma/client';
import * as r from './repository';
import * as t from './types.ts';
import { AppError } from '../../utils/AppError.ts';

const DEFAULT_POST: t.InsertPost = {
  title: 'Default Title',
  slug: 'default-title',
  content: 'This is a sample post content.',
  excerpt: 'This is a sample excerpt.',
  status: 'published',
};

const ABSURD_ID = 10000000;

describe('Post repository', () => {
  beforeEach(async () => {
    await prisma.post.deleteMany();
    await prisma.tag.deleteMany();
  });

  it('insertPost -> Should insert a post without tags and return only the id', async () => {
    const result = await r.insertPost(DEFAULT_POST);
    expect(result.id).toBeTypeOf('number');
  });

  it('insertPost -> Should insert a post with tags and return only the id', async () => {
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

  it('insertPost -> Default status should be published if not provided', async () => {
    const result = await r.insertPost({
      title: 'No Status Post',
      slug: 'no-status-post',
      content: 'Content here',
      excerpt: 'Excerpt here',
    });

    const dbPost = await prisma.post.findUnique({ where: { id: result.id } });
    expect(dbPost?.status).toBe('published');
  });

  it('insertPost -> Should throw when inserting a post with duplicated slug', async () => {
    r.insertPost(DEFAULT_POST); // Not using await here. Couldn't find a better way to do it.
    const created = r.insertPost(DEFAULT_POST);

    expect(created).rejects.toThrow(AppError);
  });

  it('selectPosts -> Should return empty array if no posts match the filter', async () => {
    const posts = await r.selectPosts({ selectBy: { id: ABSURD_ID } });
    expect(posts).toHaveLength(0);
  });

  it('selectPosts -> Should return only drafts if configured', async () => {
    await r.insertPost({
      ...DEFAULT_POST,
      title: 'Published',
      slug: 'published',
      status: 'published',
    });
    await r.insertPost({
      ...DEFAULT_POST,
      title: 'Draft',
      slug: 'draft',
      status: 'draft',
    });
    await r.insertPost({
      ...DEFAULT_POST,
      title: 'Deleted Published',
      slug: 'deleted-published',
      deletedAt: new Date(),
    });

    const drafts = await r.selectPosts({ selectBy: 'all', deleted: 'exclude', status: 'draft' });

    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.status).toBe('draft');
  });

  it('selectPosts -> Should select only deleted posts if configured', async () => {
    const drafts = await r.selectPosts({ selectBy: 'all', deleted: 'only' });
    expect(drafts).toHaveLength(0);
  });

  it('selectPosts -> Should return a full post', async () => {
    const created = await r.insertPost(DEFAULT_POST);
    const posts = await r.selectPosts({ selectBy: { id: created.id } });

    expect(posts).not.toBeNull();
    expect(posts[0]!.title).toBe(DEFAULT_POST.title);
  });

  it('selectPostsPreviews -> Should return empty list if no published posts', async () => {
    const result = await r.selectPostsPreviews({ selectBy: 'all' });

    expect(result.items).toHaveLength(0);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeUndefined();
  });

  it('selectPostsPreviews -> Should return only published posts if configured', async () => {
    await r.insertPost({
      ...DEFAULT_POST,
      title: 'Draft',
      slug: 'draft',
      status: 'draft',
    });
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

    const result = await r.selectPostsPreviews({
      selectBy: 'all',
      deleted: 'exclude',
      status: 'published',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toBe('Published');
  });

  it('SelectPostsPreviews -> Should apply the filter by tag correctly', async () => {
    const tagName = 'javascript';
    const tag = await prisma.tag.create({
      data: { name: tagName },
    });

    await r.insertPost({
      ...DEFAULT_POST,
      title: 'With tag',
      slug: 'with-tag',
      tags: {
        connect: { id: tag.id },
      },
    });

    await r.insertPost({
      ...DEFAULT_POST,
      title: 'Without tag',
      slug: 'without-tag',
    });

    const result = await r.selectPostsPreviews(
      { selectBy: 'all', deleted: 'exclude', status: 'published' },
      tagName
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.tags.length).toBe(1);
    expect(result.items[0]?.tags[0]?.name).toBe(tagName);
  });

  it('SelectPostsPreviews -> Should return correct pagination with cursor', async () => {
    const posts = [];
    // Make 12 posts to test pagination (10 per page)
    for (let i = 0; i < 12; i++) {
      posts.push(
        r.insertPost({
          ...DEFAULT_POST,
          title: `Post ${i + 1}`,
          slug: `post-${i + 1}`,
        })
      );
    }

    await Promise.all(posts);

    const firstPage = await r.selectPostsPreviews({ selectBy: 'all' });

    expect(firstPage.items).toHaveLength(10);
    expect(firstPage.hasMore).toBe(true);
    expect(firstPage.nextCursor).toBeDefined();

    const cursor = firstPage.nextCursor;
    const secondPage = await r.selectPostsPreviews(
      { selectBy: 'all', deleted: 'exclude', status: 'published' },
      undefined,
      cursor
    );

    expect(secondPage.items.length).toBe(2);
    expect(secondPage.hasMore).toBe(false);
  });

  it('updatePost -> Should mark post as deleted (soft delete)', async () => {
    const created = await r.insertPost(DEFAULT_POST);

    await r.updatePost({ id: created.id }, { deletedAt: new Date() });

    const deletedPost = await prisma.post.findUnique({
      where: { id: created.id },
    });

    expect(deletedPost?.deletedAt).toBeInstanceOf(Date);
  });

  it('updatePost -> Should throw when deleting a non-existing post', async () => {
    expect(r.updatePost({ id: ABSURD_ID }, { deletedAt: new Date() })).rejects.toThrow(AppError);
  });

  it('updatePost -> Should throw when updating a non-existing post', async () => {
    expect(r.updatePost({ id: ABSURD_ID }, { title: 'New' })).rejects.toThrow(AppError);
  });

  it('updatePost -> Should restore a soft deleted post', async () => {
    const created = await r.insertPost({
      ...DEFAULT_POST,
      title: 'To be restored',
      slug: 'to-be-restored',
      deletedAt: new Date(),
    });

    await r.updatePost({ id: created.id }, { deletedAt: null });

    const restored = await prisma.post.findUnique({
      where: { id: created.id },
    });

    expect(restored?.deletedAt).toBeNull();
  });

  it('updatePost -> Should throw when restoring a non-existing post', async () => {
    expect(r.updatePost({ id: ABSURD_ID }, { deletedAt: null })).rejects.toThrow(AppError);
  });

  it('updatePost -> Should update post status', async () => {
    const created = await r.insertPost({
      ...DEFAULT_POST,
      title: 'Status Update',
      slug: 'status-update',
      status: 'draft',
    });
    await r.updatePost({ id: created.id }, { status: 'published' });

    const updated = await prisma.post.findUnique({
      where: { id: created.id },
    });
    expect(updated?.status).toBe('published');
  });

  it('updatePost -> Should throw when updating status of a non-existing post', async () => {
    expect(r.updatePost({ id: ABSURD_ID }, { status: 'draft' })).rejects.toThrow(AppError);
  });

  it('selectTags -> Should return tags ordered by name', async () => {
    await prisma.tag.createMany({
      data: [{ name: 'zeta' }, { name: 'alpha' }],
    });

    const tags = await r.selectTags();

    expect(tags).toHaveLength(2);
    expect(tags[0]?.name).toBe('alpha');
    expect(tags[1]?.name).toBe('zeta');
  });

  it('selectTags -> Should return empty list if no tags', async () => {
    const tags = await r.selectTags();
    expect(tags).toHaveLength(0);
  });
});
