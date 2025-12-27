/* eslint-disable @typescript-eslint/no-unused-vars */

import type { FullPostRow, PostPreviewRow, PostMinimalRow } from './prisma.ts';
import type { FullPost, PostPreview, PostMinimal } from './types.ts';

export type AssertExtends<T extends U, U> = true;
type _AssertFullPostRow = AssertExtends<FullPostRow, FullPost>;
type _AssertPostPreviewRow = AssertExtends<PostPreviewRow, PostPreview>;
type _AsserMinimalPostRow = AssertExtends<PostMinimalRow, PostMinimal>;
