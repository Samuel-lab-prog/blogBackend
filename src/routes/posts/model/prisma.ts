import type { Prisma } from '@prisma/generated/client';

export const fullPostSelect = {
	id: true,
	title: true,
	slug: true,
	content: true,
	excerpt: true,
	status: true,
	createdAt: true,
	updatedAt: true,
	tags: {
		select: {
			id: true,
			name: true,
		},
	},
};

export const postPreviewSelect = {
	id: true,
	title: true,
	slug: true,
	excerpt: true,
	createdAt: true,
	updatedAt: true,
	tags: {
		select: {
			id: true,
			name: true,
		},
	},
};

export const postMinimalSelect = {
	id: true,
	title: true,
};

export const postCreateSelect = {
	id: true,
};

export type FullPostRow = Prisma.PostGetPayload<{
	select: typeof fullPostSelect;
}>;

export type PostPreviewRow = Prisma.PostGetPayload<{
	select: typeof postPreviewSelect;
}>;

export type PostMinimalRow = Prisma.PostGetPayload<{
	select: typeof postMinimalSelect;
}>;
