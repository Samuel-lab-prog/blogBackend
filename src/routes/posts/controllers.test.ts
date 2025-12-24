import { Elysia } from 'elysia';
import { describe, it, beforeEach, expect } from 'bun:test';
import { prisma } from '@prisma/client';
import { server } from '../../server.ts';
import * as t from './types.ts';

const PREFIX = 'http://localhost/api/v1/posts';

function createApp() {
  return new Elysia().use(server);
}

function jsonRequest(url: string, options: Omit<RequestInit, 'body'> & { body?: unknown } = {}) {
  return new Request(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

let postCounter = 0;

function postFactory(overrides?: Partial<Parameters<typeof prisma.post.create>[0]['data']>) {
  postCounter++;

  return {
    title: `Post ${postCounter}`,
    slug: `post-${postCounter}-${Date.now()}`,
    content: 'Default content',
    excerpt: 'Default excerpt',
    status: 'published' as const,
    ...overrides,
  };
}

async function createPost(overrides?: Partial<Parameters<typeof prisma.post.create>[0]['data']>) {
  return prisma.post.create({
    data: postFactory(overrides),
  });
}

async function createPublishedPosts(count: number) {
  const posts = Array.from({ length: count }, () => postFactory());
  await prisma.post.createMany({ data: posts });
}

describe('Post controllers tests', () => {
  beforeEach(async () => {
    postCounter = 0;
    await prisma.tag.deleteMany();
    await prisma.post.deleteMany();
  });

  it('GET /posts -> should return empty list when no posts exist', async () => {
    const resp = await createApp().handle(new Request(PREFIX));
    const body = (await resp.json()) as t.PaginatedFullPosts;

    expect(resp.status).toBe(200);
    expect(body).toMatchObject({
      posts: [],
      hasMore: false,
    });
    expect(body.nextCursor).toBeUndefined();
  });

  it('GET /posts -> should return 422 when cursor is invalid', async () => {
    const resp = await createApp().handle(new Request(`${PREFIX}?cursor=abc`));

    expect(resp.status).toBe(422);
  });

  it('GET /posts -> should return next page using cursor', async () => {
    await createPublishedPosts(12);
    const app = createApp();

    const firstResp = await app.handle(new Request(PREFIX));
    const firstBody = (await firstResp.json()) as t.PaginatedFullPosts;

    expect(firstBody.hasMore).toBe(true);
    expect(firstBody.nextCursor).toBeDefined();

    const secondResp = await app.handle(new Request(`${PREFIX}?cursor=${firstBody.nextCursor}`));
    const secondBody = (await secondResp.json()) as t.PaginatedFullPosts;

    expect(secondResp.status).toBe(200);
    expect(secondBody.posts).toHaveLength(2);

    const firstIds = firstBody.posts.map((p) => p.id);
    const secondIds = secondBody.posts.map((p) => p.id);

    for (const id of secondIds) {
      expect(firstIds).not.toContain(id);
    }
  });

  it('GET /posts -> should filter posts by tag', async () => {
    const tag = await prisma.tag.create({ data: { name: 'elysia' } });

    await createPost({
      title: 'Tagged post',
      tags: { connect: { id: tag.id } },
    });

    await createPost({
      title: 'Untagged post',
    });

    const resp = await createApp().handle(new Request(`${PREFIX}?tag=elysia`));
    const body = (await resp.json()) as t.PaginatedFullPosts;

    expect(resp.status).toBe(200);
    expect(body.posts).toHaveLength(1);
    expect(body.posts[0]!.title).toBe('Tagged post');
  });

  it('GET /posts -> should return empty list when tag does not exist', async () => {
    await createPublishedPosts(5);

    const resp = await createApp().handle(new Request(`${PREFIX}?tag=nonexistent`));
    const body = (await resp.json()) as t.PaginatedFullPosts;

    expect(resp.status).toBe(200);
    expect(body.posts).toHaveLength(0);
    expect(body.hasMore).toBe(false);
  });

  it('GET /posts/:slug -> should return a published post', async () => {
    const post = await createPost();

    const resp = await createApp().handle(new Request(`${PREFIX}/${post.slug}`));
    const body = (await resp.json()) as t.FullPost;

    expect(resp.status).toBe(200);
    expect(body.id).toBe(post.id);
    expect(body.title).toBe(post.title);
  });

  it('GET /posts/:slug -> should return 404 when post does not exist', async () => {
    const resp = await createApp().handle(new Request(`${PREFIX}/nonexistent-slug`));

    expect(resp.status).toBe(404);
  });

  it('POST /posts -> should create a post', async () => {
    const resp = await createApp().handle(
      jsonRequest(PREFIX, {
        method: 'POST',
        body: {
          title: 'New post title',
          content: 'content really good',
          excerpt: 'excerpt here',
          status: 'published',
        } satisfies t.PostNewPost,
      })
    );

    expect(resp.status).toBe(201);

    const body = (await resp.json()) as { id: number };
    const postInDb = await prisma.post.findUnique({
      where: { id: body.id },
    });

    expect(postInDb).not.toBeNull();
  });

  it('POST /posts -> should return 422 when body is invalid', async () => {
    const resp = await createApp().handle(
      jsonRequest(PREFIX, {
        method: 'POST',
        body: {
          title: 'no',
          content: 'content',
          excerpt: 'excerpt',
          status: 'published',
        },
      })
    );

    expect(resp.status).toBe(422);
  });

  it('POST /posts -> should return 409 when slug already exists', async () => {
    await createPost({ slug: 'duplicated' });

    const resp = await createApp().handle(
      jsonRequest(PREFIX, {
        method: 'POST',
        body: {
          title: 'Duplicated',
          content: 'content nice',
          excerpt: 'excerpt bad',
          status: 'published',
        },
      })
    );

    expect(resp.status).toBe(409);
  });

  it('GET /posts/drafts -> should return only draft posts', async () => {
    await createPost({ status: 'draft' });
    await createPost({ status: 'published' });

    const resp = await createApp().handle(new Request(`${PREFIX}/drafts`));
    const body = (await resp.json()) as t.FullPost[];

    expect(resp.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0]!.status).toBe('draft');
  });

  it('DELETE /posts/:id -> should soft delete a post', async () => {
    const post = await createPost();

    const resp = await createApp().handle(
      new Request(`${PREFIX}/${post.id}`, { method: 'DELETE' })
    );
    const body = (await resp.json()) as { id: number };

    expect(resp.status).toBe(200);
    expect(body.id).toBe(post.id);

    const deleted = await prisma.post.findUnique({
      where: { id: post.id },
    });

    expect(deleted?.deletedAt).not.toBeNull();
  });

  it('DELETE /posts/:id -> Should delete even when post is already deleted', async () => {
    const post = await createPost();

    await prisma.post.update({
      where: { id: post.id },
      data: { deletedAt: new Date() },
    });

    const resp = await createApp().handle(
      new Request(`${PREFIX}/${post.id}`, { method: 'DELETE' })
    );

    expect(resp.status).toBe(200);
  });

  it('PATCH /posts/:id -> should return 400 when body is empty', async () => {
    const post = await createPost();

    const resp = await createApp().handle(
      jsonRequest(`${PREFIX}/${post.id}`, {
        method: 'PATCH',
        body: {},
      })
    );

    expect(resp.status).toBe(422);
  });

  it('PATCH /posts/:id -> should return 404 when post does not exist', async () => {
    const resp = await createApp().handle(
      jsonRequest(`${PREFIX}/999999`, {
        method: 'PATCH',
        body: { title: 'Updated' },
      })
    );

    expect(resp.status).toBe(404);
  });

  it('PATCH /posts/:id -> should update a post', async () => {
    const post = await createPost();

    const resp = await createApp().handle(
      jsonRequest(`${PREFIX}/${post.id}`, {
        method: 'PATCH',
        body: { title: 'Updated title' },
      })
    );

    expect(resp.status).toBe(200);

    const updated = await prisma.post.findUnique({
      where: { id: post.id },
    });

    expect(updated?.title).toBe('Updated title');
  });

  it('GET /posts/deleted -> should return deleted posts', async () => {
    const post = await createPost();

    await prisma.post.update({
      where: { id: post.id },
      data: { deletedAt: new Date() },
    });

    const resp = await createApp().handle(new Request(`${PREFIX}/deleted`));
    const body = (await resp.json()) as t.FullPost[];

    expect(resp.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0]!.id).toBe(post.id);
  });

  it('PATCH /posts/:id/restore -> Should restore even when post is not deleted', async () => {
    const post = await createPost();

    const resp = await createApp().handle(
      new Request(`${PREFIX}/${post.id}/restore`, { method: 'PATCH' })
    );

    expect(resp.status).toBe(200);
  });

  it('PATCH /posts/:id/restore -> should restore a deleted post', async () => {
    const post = await createPost();

    await prisma.post.update({
      where: { id: post.id },
      data: { deletedAt: new Date() },
    });

    const resp = await createApp().handle(
      new Request(`${PREFIX}/${post.id}/restore`, { method: 'PATCH' })
    );

    expect(resp.status).toBe(200);

    const restored = await prisma.post.findUnique({
      where: { id: post.id },
    });

    expect(restored?.deletedAt).toBeNull();
  });
  it('PATCH /posts/:id/status -> should return 404 when post does not exist', async () => {
    const resp = await createApp().handle(
      jsonRequest(`${PREFIX}/999999/status`, {
        method: 'PATCH',
        body: { status: 'draft' },
      })
    );
    expect(resp.status).toBe(404);
  });

  it('PATCH /posts/:id/status -> should update post status', async () => {
    const post = await createPost({ status: 'draft' });
    const resp = await createApp().handle(
      jsonRequest(`${PREFIX}/${post.id}/status`, {
        method: 'PATCH',
        body: { status: 'published' },
      })
    );
    expect(resp.status).toBe(200);
    const updated = await prisma.post.findUnique({
      where: { id: post.id },
    });
    expect(updated?.status).toBe('published');
  });
});
