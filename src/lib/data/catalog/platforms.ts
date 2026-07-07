import { makeGetById, makeGetBySlug } from "@/lib/data/getter";
import db from "@/lib/db";
import { formatRawPlatform } from "@/lib/external/igdb/util";
import type { PlatformModel } from "@/lib/generated/prisma/models/Platform";

export type Platform = Pick<PlatformModel, "id" | "slug" | "name">;

const select = {
	id: true,
	slug: true,
	name: true,
};

const fetching = {
	endpoint: "platforms",
	body: `fields slug, name;`,
};

export const getPlatform = makeGetById<Platform>(select, db.platform, fetching, formatRawPlatform);

export const getPlatformBySlug = makeGetBySlug<Platform>(select, db.platform, fetching, formatRawPlatform);

/** Lists platforms for the filter picker, optionally narrowed by a case-insensitive name query. */
export async function listPlatforms(query?: string): Promise<Platform[]> {
	return db.platform.findMany({
		where: query ? { name: { contains: query.trim(), mode: "insensitive" } } : undefined,
		select,
		orderBy: { name: "asc" },
		take: 50,
	});
}
