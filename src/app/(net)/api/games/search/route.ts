import { searchGames } from "@/lib/data/catalog/games";

export async function GET(request: Request) {
	const query = new URL(request.url).searchParams.get("q") ?? "";

	try {
		const games = await searchGames(query);

		return Response.json(games, {
			headers: {
				"Cache-Control": "private, max-age=30",
			},
		});
	} catch {
		return Response.json({ error: "Failed to search games" }, { status: 500 });
	}
}
