import { auth } from "@/lib/auth";
import { getUserLibraryGamesByIds, searchUserLibraryGames } from "@/lib/data/gamelist/library";

export async function GET(request: Request) {
	const session = await auth();

	if (!session?.user?.id) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const params = new URL(request.url).searchParams;
	const ids = (params.get("ids") ?? "")
		.split(",")
		.map(Number)
		.filter((id) => Number.isInteger(id) && id > 0);

	try {
		const games = ids.length ? await getUserLibraryGamesByIds(session.user.id, ids) : await searchUserLibraryGames(session.user.id, params.get("q") ?? "");

		return Response.json(games, {
			headers: {
				"Cache-Control": "private, max-age=30",
			},
		});
	} catch {
		return Response.json({ error: "Failed to load library games" }, { status: 500 });
	}
}
