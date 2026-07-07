import { listGenres } from "@/lib/data/catalog/genre";
import { listPlatforms } from "@/lib/data/catalog/platforms";
import { listThemes } from "@/lib/data/catalog/themes";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const type = url.searchParams.get("type");
	const query = url.searchParams.get("q") ?? "";

	try {
		const options = type === "genres" ? await listGenres(query) : type === "themes" ? await listThemes(query) : type === "platforms" ? await listPlatforms(query) : null;

		if (!options) return Response.json({ error: "Unknown option type" }, { status: 400 });

		return Response.json(options, {
			headers: {
				"Cache-Control": "private, max-age=60",
			},
		});
	} catch {
		return Response.json({ error: "Failed to load options" }, { status: 500 });
	}
}
