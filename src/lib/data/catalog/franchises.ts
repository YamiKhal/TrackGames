import { makeGetById, makeGetBySlug } from "@/lib/data/getter";
import db from "@/lib/db";
import { formatRawFranchise } from "@/lib/external/igdb/util";
import type { FranchiseModel } from "@/lib/generated/prisma/models/Franchise";

export type Franchise = Pick<FranchiseModel, "id" | "slug" | "name" | "games">;

const select = {
	id: true,
	slug: true,
	name: true,
	games: true,
};

const fetching = {
	endpoint: "franchises",
	body: `fields slug, name, games;`,
};

export const getFranchise = makeGetById<Franchise>(select, db.franchise, fetching, formatRawFranchise);

export const getFranchiseBySlug = makeGetBySlug<Franchise>(select, db.franchise, fetching, formatRawFranchise);
