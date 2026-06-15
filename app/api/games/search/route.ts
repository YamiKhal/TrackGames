import { searchGames } from "@/lib/data/games";

export async function GET(request: Request) {
    const query = new URL(request.url).searchParams.get("q") ?? "";
    const games = await searchGames(query);

    return Response.json(games, {
        headers: {
            "Cache-Control": "private, max-age=30",
        },
    });
}
