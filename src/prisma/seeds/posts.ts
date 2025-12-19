import * as t from '../../routes/posts/types';
import { prisma } from '../client';

const posts: t.InsertPost[] = []
const POSTS_COUNT = 10;

for (let i = 1; i <= POSTS_COUNT; i++) {
  posts.push({
    title: `Example Post ${i}`,
    slug: `example-post-${i}`,
    excerpt: `This is a brief excerpt for Example Post ${i}.`,
    content: `# Example Post ${i}\n\nThis is the content of Example Post ${i}. It contains some **Markdown** formatting!`,
    status: i % 2 === 0 ? 'published' : 'draft',
    tags: {
      connectOrCreate: [
        {
          where: { name: 'Tag1' },
          create: { name: 'Tag1' },
        },
        {
          where: { name: 'Tag2' },
          create: { name: 'Tag2' },
        },
      ],
    },
  });
}

export default async function seedPosts() {
  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: post,
    });
  }
}