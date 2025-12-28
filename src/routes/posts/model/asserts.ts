import type { FullPostRow, PostPreviewRow, PostMinimalRow } from './prisma.ts';
import type { FullPost, PostPreview, PostMinimal } from './types.ts';

type _AssertExtends<_T extends _U, _U> = true;
type _AssertFullPostRow = _AssertExtends<FullPostRow, FullPost>;
type _AssertPostPreviewRow = _AssertExtends<PostPreviewRow, PostPreview>;
type _AsserMinimalPostRow = _AssertExtends<PostMinimalRow, PostMinimal>;
