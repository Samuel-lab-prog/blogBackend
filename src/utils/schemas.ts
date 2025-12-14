import { t } from 'elysia';
import { makeValidationError } from './AppError';

//--------------------GENERAL SCHEMAS---------------------//

export const dateSchema = t.Date({
  example: '2024-01-01T12:00:00Z',
  ...makeValidationError('CreatedAt must be a valid date string'),
});
;

export const idSchema = t.Number({
  minimum: 1,
  example: 1,
  readOnly: true,
  ...makeValidationError('ID must be a positive integer'),
});

export const emailSchema = t.String({
  format: 'email',
  example: 'sg38293@example.com',
  ...makeValidationError('Email must be a valid email address'),
});

export const passwordSchema = t.String({
  minLength: 8,
  maxLength: 30,
  example: 'StrongP@ssw0rd!',
  ...makeValidationError('Password must be between 8 and 30 characters'),
});

export const loginSchema = t.Object({
  email: emailSchema,
  password: passwordSchema,
});

//--------------------POSTS SCHEMAS---------------------//

export const postStatusSchema = t.UnionEnum(['draft', 'published'], {
  example: 'draft',
  ...makeValidationError('Status must be either draft or published'),
});

export const titleSchema = t.String({
  minLength: 3,
  maxLength: 100,
  example: 'My First Blog Post',
  ...makeValidationError('Title must be between 3 and 100 characters'),
});

export const slugSchema = t.String({
  minLength: 3,
  maxLength: 150,
  readOnly: true, // Slug is generated, so it's read-only
  example: 'my-first-blog-post',
  ...makeValidationError('Slug must be between 3 and 150 characters'),
});

export const contentSchema = t.String({
  minLength: 10,
  example: 'This is the content of my first blog post.',
  ...makeValidationError('Content must be at least 10 characters long'),
});

export const excerptSchema = t.String({
  minLength: 10,
  maxLength: 200,
  example: 'This is a brief excerpt of my first blog post.',
  ...makeValidationError('Excerpt must be between 10 and 200 characters'),
});

export const tagSchema = t.String({
  minLength: 3,
  maxLength: 50,
  example: 'Technology',
  ...makeValidationError('Each tag must be between 3 and 50 characters'),
});

export const tagsSchema = t.Array(t.Object({
  name: tagSchema,
  id: idSchema,
}), {
  minItems: 0,
  maxItems: 5,
  example: [{ name: 'Technology', id: 1 }, { name: 'Programming', id: 2 }],
  ...makeValidationError('Tags must be an array with 0 to 5 items'),
});

