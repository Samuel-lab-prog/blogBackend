import * as t from '../../routes/posts/types';
import { prisma } from '../client';

const posts: t.InsertPost[] = [];
const POSTS_COUNT = 50;

for (let i = 1; i <= POSTS_COUNT; i++) {
  posts.push({
    title: `Understanding Topic ${i}`,
    slug: `understanding-topic-${i}`,
    excerpt: `A brief overview of Topic ${i}, highlighting key points and insights.`,
    content: `# Understanding Topic ${i}

Welcome to an in-depth look at Topic ${i}. In this article, we will explore its key aspects and provide examples to help you understand it better.

## Key Points

- **Point 1:** Explanation of the first important aspect.
- **Point 2:** Detailed insight on another key feature.
- **Point 3:** Additional notes and practical tips.

### Why It Matters

Understanding Topic ${i} is crucial because it allows you to improve your skills, make informed decisions, and stay ahead in your field.

### Examples

Here are some examples to illustrate the concept:

\`\`\`js
// Example code snippet
\`\`\`

We hope this article provides valuable insights into Topic ${i}. Keep exploring and experimenting to gain even deeper knowledge.
`,
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
