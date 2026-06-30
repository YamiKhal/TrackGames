export async function getOwnedGames(steamId: string) {
	const response = await fetch(
		`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true`,
		{
			next: {
				revalidate: 3600, // cache for 1 hour (optional)
			},
		},
	);

	if (!response.ok) {
		throw new Error(`Steam API request failed: ${response.status}`);
	}

	const data = await response.json();

	return data.response.games;
}

export async function getSteamProfile(steamId: string) {
	const response = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`);

	if (!response.ok) {
		throw new Error("Failed to fetch Steam profile");
	}

	const data = await response.json();

	return data.response.players[0];
}
