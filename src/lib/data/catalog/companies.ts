import { makeGetById, makeGetBySlug } from "@/lib/data/getter";
import db from "@/lib/db";
import { formatRawCompany } from "@/lib/external/igdb/util";
import type { CompanyModel } from "@/lib/generated/prisma/models/Company";

export type Company = Partial<Pick<CompanyModel, "id" | "slug" | "name" | "logo" | "description" | "developed" | "published">>;

const select = {
	id: true,
	slug: true,
	name: true,
	logo: true,
	description: true,
	developed: true,
	published: true,
};

const minifiedSelect = {
	id: true,
	slug: true,
	name: true,
};

const fetching = {
	endpoint: "companies",
	body: `fields slug, name, logo.image_id, description, developed, published;`,
};

export const getCompany = makeGetById<Company>(select, db.company, fetching, formatRawCompany);

export const getCompanyBySlug = makeGetBySlug<Company>(select, db.company, fetching, formatRawCompany);

export const getMinifiedCompany = makeGetById<Company>(minifiedSelect, db.company, fetching, formatRawCompany);

export const getMinifiedCompanyBySlug = makeGetBySlug<Company>(minifiedSelect, db.company, fetching, formatRawCompany);
