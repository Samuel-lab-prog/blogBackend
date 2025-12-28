import type { FullPostRow, PostPreviewRow, PostMinimalRow } from './prisma.ts';
import type {
	FullPost,
	PostPreview,
	PostMinimal,
	OrderBy,
	OrderDirection,
} from './types.ts';
import { orderBySchema, orderDirectionSchema } from '../schemas.ts';

type _AssertExtends<_T extends _U, _U> = true;
type _AssertFullPostRow = _AssertExtends<FullPostRow, FullPost>;
type _AssertPostPreviewRow = _AssertExtends<PostPreviewRow, PostPreview>;
type _AsserMinimalPostRow = _AssertExtends<PostMinimalRow, PostMinimal>;

type _AssertOrderBy = _AssertExtends<(typeof orderBySchema)['static'], OrderBy>;

type _AssertOrderDirection = _AssertExtends<
	(typeof orderDirectionSchema)['static'],
	OrderDirection
>;
