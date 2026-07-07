import { makeGetById, makeGetBySlug } from "@/lib/data/getter";
import db from "@/lib/db";
import { formatRawKeyword } from "@/lib/external/igdb/util";
import type { KeywordModel } from "@/lib/generated/prisma/models/Keyword";

export type Keyword = Pick<KeywordModel, "id" | "slug" | "name">;

const select = {
	id: true,
	slug: true,
	name: true,
};

const fetching = {
	endpoint: "keywords",
	body: `fields slug, name;`,
};

export const getKeyword = makeGetById<Keyword>(select, db.keyword, fetching, formatRawKeyword);

export const getKeywordBySlug = makeGetBySlug<Keyword>(select, db.keyword, fetching, formatRawKeyword);

export async function searchKeywords(query: string): Promise<Keyword[]> {
	const search = query.trim();

	if (search.length < 2) return [];

	const [startsWith, contains] = await Promise.all([
		db.keyword.findMany({
			where: {
				name: {
					startsWith: search,
					mode: "insensitive",
				},
			},
			select,
			orderBy: { name: "asc" },
			take: 8,
		}),
		db.keyword.findMany({
			where: {
				name: {
					contains: search,
					mode: "insensitive",
				},
			},
			select,
			orderBy: { name: "asc" },
			take: 16,
		}),
	]);

	const keywords = new Map<number, Keyword>();

	for (const keyword of [...startsWith, ...contains]) {
		keywords.set(keyword.id, keyword);
	}

	return Array.from(keywords.values()).slice(0, 12);
}
