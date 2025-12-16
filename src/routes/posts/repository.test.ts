import { describe, it, expect, beforeEach } from 'bun:test';
import { prisma } from '../../prisma/client';
import * as r from './repository';

describe('Post repository', () => {

  beforeEach(async () => {
    await prisma.post.deleteMany();
    await prisma.tag.deleteMany();
  });

  it('insertPost -> Should insert a post and return only the id', async () => {
    const result = await r.insertPost({
      title: 'Post 1',
      slug: 'post-1',
      content: 'content',
      excerpt: 'excerpt',
      status: 'draft',
      tags: {
        create: [{ name: 'Tag1' }, { name: 'Tag2' }],
      },

    });

    expect(result.id).toBeTypeOf('number');

    const dbPost = await prisma.post.findUnique({ where: { id: result.id } });
    expect(dbPost).not.toBeNull();
  });

  it('selectPostById -> Should return null if the post does not exist', async () => {
    const post = await r.selectPostById(9999);
    expect(post).toBeNull();
  });

  it('selectPostById -> Should return null if the post is in draft', async () => {
    const created = await prisma.post.create({
      data: {
        title: 'Draft',
        slug: 'draft',
        content: '...',
        status: 'draft',
        excerpt: '...',
      },
    });

    const post = await r.selectPostById(created.id);
    expect(post).toBeNull();
  });

  it('selectPostById -> Should return null if the post is soft deleted', async () => {
    const created = await prisma.post.create({
      data: {
        title: 'Deleted',
        slug: 'deleted',
        excerpt: '...',
        content: '...',
        status: 'published',
        deletedAt: new Date(),
      },
    });

    const post = await r.selectPostById(created.id);
    expect(post).toBeNull();
  });

  it('selectPostById -> Should return the full post if published and not deleted', async () => {
    const created = await prisma.post.create({
      data: {
        title: 'Published',
        slug: 'published',
        excerpt: '...',
        content: '...',
        status: 'published',
      },
    });

    const post = await r.selectPostById(created.id);

    expect(post).not.toBeNull();
    if (post) {
      expect(post.id).toBe(created.id);
      expect(post.status).toBe('published');
    }
  });

  it('selectAllPublishedPostsPreviews -> Should return empty list if no published posts', async () => {
    const result = await r.selectAllPublishedPostsPreviews();

    expect(result.items).toHaveLength(0);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeUndefined();
  });

  it('selectAllPublishedPostsPreviews -> Should return only published posts', async () => {
    await prisma.post.createMany({
      data: [
        {
          title: 'Draft',
          slug: 'draft',
          excerpt: '...',
          content: '...',
          status: 'draft',
        },
        {
          title: 'Published',
          slug: 'published',
          excerpt: '...',
          content: '...',
          status: 'published',
        },
      ],
    });

    const result = await r.selectAllPublishedPostsPreviews();

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toBe('Published');
  });

  it('SelectAllPostsPreviews -> Should apply the filter by tag correctly', async () => {
    const tag = await prisma.tag.create({
      data: { name: 'typescript' },
    });

    await prisma.post.create({
      data: {
        title: 'Com tag',
        slug: 'com-tag',
        excerpt: '...',
        content: '...',
        status: 'published',
        tags: {
          connect: { id: tag.id },
        },
      },
    });

    await prisma.post.create({
      data: {
        title: 'Sem tag',
        slug: 'sem-tag',
        excerpt: '...',
        content: '...',
        status: 'published',
      },
    });

    const result = await r.selectAllPublishedPostsPreviews(null, 'typescript');

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toBe('Com tag');
  });

  it('SelectAllPostsPreviews -> Should return correct pagination with cursor', async () => {
    const posts = [];

    for (let i = 0; i < 12; i++) {
      posts.push(
        prisma.post.create({
          data: {
            title: `Post ${i}`,
            slug: `post-${i}`,
            content: '...',
            excerpt: '...',
            status: 'published',
          },
        })
      );
    }

    await Promise.all(posts);

    const firstPage = await r.selectAllPublishedPostsPreviews();

    expect(firstPage.items).toHaveLength(10);
    expect(firstPage.hasMore).toBe(true);
    expect(firstPage.nextCursor).toBeDefined();

    const cursor = firstPage.nextCursor;
    if (!cursor) throw new Error('Cursor should be defined');
    const secondPage = await r.selectAllPublishedPostsPreviews(cursor);

    expect(secondPage.items.length).toBe(2);
    expect(secondPage.hasMore).toBe(false);
  });


  it('selectAllDrafts -> Should return only drafts', async () => {
    await prisma.post.createMany({
      data: [
        {
          title: 'Draft',
          slug: 'draft',
          excerpt: '...',
          content: '...',
          status: 'draft',
        },
        {
          title: 'Published',
          slug: 'published',
          excerpt: '...',
          content: '...',
          status: 'published',
        },
      ],
    });

    const drafts = await r.selectAllDrafts();

    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.status).toBe('draft');
  });

  it('softDeletePostById -> Should mark post as deleted (soft delete)', async () => {
    const created = await prisma.post.create({
      data: {
        title: 'Delete me',
        slug: 'delete-me',
        excerpt: '...',
        content: '...',
        status: 'published',
      },
    });

    await r.softDeletePostById(created.id);

    const dbPost = await prisma.post.findUnique({ where: { id: created.id } });
    expect(dbPost?.deletedAt).not.toBeNull();
  });

  it('updatePostById -> Should update post if not deleted', async () => {
    const created = await prisma.post.create({
      data: {
        title: 'Old',
        slug: 'old',
        excerpt: '...',
        content: '...',
        status: 'draft',
      },
    });

    await r.updatePostById(created.id, { title: 'New' });

    const updated = await prisma.post.findUnique({ where: { id: created.id } });
    expect(updated?.title).toBe('New');
  });


  it('selectAllDeletedPosts -> Should return only deleted posts', async () => {
    await prisma.post.create({
      data: {
        title: 'Deleted',
        slug: 'deleted',
        excerpt: '...',
        content: '...',
        status: 'published',
        deletedAt: new Date(),
      },
    });

    const deleted = await r.selectAllDeletedPosts();
    expect(deleted).toHaveLength(1);
  });

  it('restorePostById -> Should restore a soft deleted post', async () => {
    const created = await prisma.post.create({
      data: {
        title: 'Restore',
        slug: 'restore',
        excerpt: '...',
        content: '...',
        status: 'published',
        deletedAt: new Date(),
      },
    });

    await r.restorePostById(created.id);

    const restored = await prisma.post.findUnique({ where: { id: created.id } });
    expect(restored?.deletedAt).toBeNull();
  });

  it('selectAllTags -> Should return tags ordered by name', async () => {
    await prisma.tag.createMany({
      data: [
        { name: 'zeta' },
        { name: 'alpha' },
      ],
    });

    const tags = await r.selectAllTags();

    expect(tags).toHaveLength(2);
    expect(tags[0]?.name).toBe('alpha');
    expect(tags[1]?.name).toBe('zeta');
  });

  it('selectAllTags -> Should return empty list if no tags', async () => {
    const tags = await r.selectAllTags();
    expect(tags).toHaveLength(0);
  });
});
