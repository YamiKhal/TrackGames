import { makeGetById, makeGetBySlug } from "@/lib/data/getter";
import db from "@/lib/db";
import { formatRawTheme } from "@/lib/external/igdb/util";
import type { ThemeModel } from "@/lib/generated/prisma/models/Theme";

export type Theme = Pick<ThemeModel, "id" | "slug" | "name">;

const select = {
	id: true,
	slug: true,
	name: true,
};

const fetching = {
	endpoint: "themes",
	body: `fields slug, name;`,
};

export const getTheme = makeGetById<Theme>(select, db.theme, fetching, formatRawTheme);

export const getThemeBySlug = makeGetBySlug<Theme>(select, db.theme, fetching, formatRawTheme);

/** Lists themes for the filter picker, optionally narrowed by a case-insensitive name query. */
export async function listThemes(query?: string): Promise<Theme[]> {
	return db.theme.findMany({
		where: query ? { name: { contains: query.trim(), mode: "insensitive" } } : undefined,
		select,
		orderBy: { name: "asc" },
		take: 50,
	});
}
