import { fetchAPI } from "./IGDBAPI";
import { Company } from "../../types";

export async function fetchCompanyById(id: number): Promise<Company | null> {
    const companies = await fetchAPI<Company[]>("companies",
        `fields slug, start_date, logo, name, description, developed, published;
        where id = ${id};
        limit 1;
        `
    );

    return companies[0] || null;
}