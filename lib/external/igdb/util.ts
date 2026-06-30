import { GameDevStatus, GameType, PlayerPerspective } from "../../generated/prisma/enums";
import type {
	Collection,
	Company,
	Franchise,
	Game,
	Genre,
	Keyword,
	MultiplayerMode,
	Platform,
	RawCollection,
	RawCompany,
	RawFranchise,
	RawGame,
	RawGenre,
	RawKeyword,
	RawMultiplayerMode,
	RawPlatform,
	RawTheme,
	Theme,
} from "../../types";

function requireBaseEntity(entity: { id?: number; name?: string; slug?: string }, label: string) {
	if (!entity.id || !entity.name || !entity.slug) {
		throw new Error(`Cannot format an API ${label} without an id, name, and slug.`);
	}

	return {
		id: entity.id,
		name: entity.name,
		slug: entity.slug,
	};
}

function getGameType(id: number): GameType {
	switch (id) {
		case 0:
			return GameType.MAINGAME;
		case 1:
			return GameType.DLC;
		case 2:
			return GameType.EXPANSION;
		case 3:
			return GameType.BUNDLE;
		case 4:
			return GameType.STANDALONE_EXPANSION;
		case 5:
			return GameType.MOD;
		case 6:
			return GameType.EPISODE;
		case 7:
			return GameType.SEASON;
		case 8:
			return GameType.REMAKE;
		case 9:
			return GameType.REMASTER;
		case 10:
			return GameType.EXPANDED_GAME;
		case 11:
			return GameType.PORT;
		case 12:
			return GameType.FORK;
		case 13:
			return GameType.PACK;
		case 14:
			return GameType.UPDATE;
		default:
			throw new Error(`Unknown game type id: ${id}`);
	}
}

function getGameDevStatus(id: number): GameDevStatus {
	switch (id) {
		case 0:
			return GameDevStatus.RELEASED;
		case 2:
			return GameDevStatus.ALPHA;
		case 3:
			return GameDevStatus.BETA;
		case 4:
			return GameDevStatus.EARLY_ACCESS;
		case 5:
			return GameDevStatus.OFFLINE;
		case 6:
			return GameDevStatus.CANCELLED;
		case 7:
			return GameDevStatus.RUMORED;
		case 8:
			return GameDevStatus.DELISTED;
		default:
			throw new Error(`Unknown game status id: ${id}`);
	}
}

function getPlayerPerspective(slug: string): PlayerPerspective {
	switch (slug) {
		case "first-person":
			return PlayerPerspective.FIRST_PERSON;
		case "third-person":
			return PlayerPerspective.THIRD_PERSON;
		case "bird-view-slash-isometric":
			return PlayerPerspective.BIRD_VIEW__SLASH_ISOMETRIC;
		case "side-view":
			return PlayerPerspective.SIDE_VIEW;
		case "text":
			return PlayerPerspective.TEXT;
		case "auditory":
			return PlayerPerspective.AUDITORY;
		case "virtual-reality":
			return PlayerPerspective.VIRTUAL_REALITY;
		default:
			throw new Error(`Unknown player perspective slug: ${slug}`);
	}
}

export function ImageIdToURL(id?: string, type: "cover_small" | "cover" | "cover_big" | "screenshot_big" | "1080" | "720" = "cover_big"): string | null {
	if (id != null) {
		switch (type) {
			case "cover_small":
				return `https://images.igdb.com/igdb/image/upload/t_cover_small/${id}.webp`;
			case "cover_big":
				return `https://images.igdb.com/igdb/image/upload/t_cover_big/${id}.webp`;
			case "cover":
				return `https://images.igdb.com/igdb/image/upload/t_cover/${id}.webp`;
			case "screenshot_big":
				return `https://images.igdb.com/igdb/image/upload/t_screenshot_big/${id}.webp`;
			case "1080":
				return `https://images.igdb.com/igdb/image/upload/t_1080p/${id}.webp`;
			case "720":
				return `https://images.igdb.com/igdb/image/upload/t_720p/${id}.webp`;
		}
	} else {
		return null;
	}
}

export function formatRawGame(game: RawGame): Game {
	if (!game.id || !game.name || !game.slug) {
		throw new Error("Cannot format an API game without an id, name, and slug.");
	}

	return {
		id: game.id,
		slug: game.slug,
		name: game.name,
		summary: game.summary,
		totalRating: game.total_rating,
		totalRatingCount: game.total_rating_count,
		releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000) : undefined,
		cover: game.cover?.image_id,
		screenshots: game.screenshots ? game.screenshots.map((item) => item.image_id) : [],
		videos: game.videos ? game.videos.map((item) => item.video_id) : [],
		platforms: game.platforms ? game.platforms.map((item) => item.id) : [],
		developers: game.involved_companies ? game.involved_companies.filter((c) => c.developer).map((filtered) => filtered.company) : [],
		publishers: game.involved_companies ? game.involved_companies.filter((c) => c.publisher).map((filtered) => filtered.company) : [],
		genres: game.genres ? game.genres.map((item) => item.id) : [],
		franchises: game.franchises ? game.franchises.map((item) => item.id) : [],
		collections: game.collections ? game.collections.map((item) => item.id) : [],
		similarGames: game.similar_games,
		standaloneExpansions: game.standalone_expansions ?? [],
		dlcs: game.dlcs ?? [],
		expandedGames: game.expanded_games ?? [],
		expansions: game.expansions ?? [],
		themes: game.themes ?? [],
		playerPerspectives: game.player_perspectives ? game.player_perspectives.map((item) => getPlayerPerspective(item.slug)) : [],
		multiplayerModes: game.multiplayer_modes ?? [],
		keywords: game.keywords ? game.keywords : [],
		versionParent: game.version_parent,
		parentGame: game.parent_game,
		gameStatus: typeof game.game_status === "number" ? getGameDevStatus(game.game_status) : GameDevStatus.RELEASED,
		gameType: game.game_type ? getGameType(game.game_type) : undefined,
	};
}

export function formatRawCollection(collection: RawCollection): Collection {
	const base = requireBaseEntity(collection, "collection");

	return {
		...base,
		games: collection.games ?? [],
	};
}

export function formatRawFranchise(franchise: RawFranchise): Franchise {
	const base = requireBaseEntity(franchise, "franchise");

	return {
		...base,
		games: franchise.games ?? [],
	};
}

export function formatRawGenre(genre: RawGenre): Genre {
	return requireBaseEntity(genre, "genre");
}

export function formatRawPlatform(platform: RawPlatform): Platform {
	return requireBaseEntity(platform, "platform");
}

export function formatRawKeyword(keyword: RawKeyword): Keyword {
	return {
		id: keyword.id!,
		name: keyword.name!,
		slug: keyword.slug ?? "unknown",
	};
}

export function formatRawTheme(theme: RawTheme): Theme {
	return requireBaseEntity(theme, "theme");
}

export function formatRawMultiplayerMode(multiplayerMode: RawMultiplayerMode): MultiplayerMode {
	if (!multiplayerMode.id || !multiplayerMode.game || typeof multiplayerMode.platform !== "number") {
		throw new Error("Cannot format an API multiplayer mode without an id, game, and platform.");
	}

	return {
		id: multiplayerMode.id,
		game: multiplayerMode.game,
		campaignCoop: multiplayerMode.campaigncoop ?? false,
		dropIn: multiplayerMode.dropin ?? false,
		lanCoop: multiplayerMode.lancoop ?? false,
		offlineCoop: multiplayerMode.offlinecoop ?? false,
		offlineCoopMax: multiplayerMode.offlinecoopmax ?? 0,
		offlineMax: multiplayerMode.offlinemax ?? 0,
		onlineCoop: multiplayerMode.onlinecoop ?? false,
		onlineCoopMax: multiplayerMode.onlinecoopmax ?? 0,
		onlineMax: multiplayerMode.onlinemax ?? 0,
		platform: multiplayerMode.platform,
		splitscreen: multiplayerMode.splitscreen ?? false,
	};
}

export function formatRawCompany(company: RawCompany): Company {
	return {
		id: company.id!,
		name: company.name || undefined,
		slug: company.slug!,
		logo: company.logo?.image_id,
		description: company.description,
		developed: company.developed ?? [],
		published: company.published ?? [],
	};
}
