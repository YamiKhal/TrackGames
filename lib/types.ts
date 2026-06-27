import type { LinkType, MarkdownAlign, WidgetType } from "./enums";
import type { GameStatus, GameType, UserRole } from "./generated/prisma/enums";

export type PopScoreEntry = {
    game_id: number;
    popularity_type: number;
    value: number;
    created_at: number;
};

export type TrendingScore = {
    game_id: number;
    wantToPlay: number;
    playing: number;
    weightedScore: number;
};

export type RawGame = {
    id?: number;
    slug?: string;
    name?: string;
    summary?: string;
    total_rating?: number;
    first_release_date?: number;
    cover?: { image_id: string };
    screenshots?: { image_id: string }[];
    videos?: { video_id: string; }[]
    platforms?: { id: number; name: string; slug: string }[];
    involved_companies?: { company: number; developer: boolean; publisher: boolean }[];
    genres?: { id: number; name: string; slug: string }[];
    franchises?: { id: number; name: string; slug: string; games: number[] }[];
    collections?: { id: number; name: string; slug: string; games: number[] }[];
    similar_games?: number[];
    keywords?: number[];
    game_type: number;
}

export type RawCollection = {
    id?: number;
    name?: string;
    slug?: string;
    games?: number[];
}

export type RawFranchise = {
    id?: number;
    name?: string;
    slug?: string;
    games?: number[];
}

export type RawGenre = {
    id?: number;
    name?: string;
    slug?: string;
}

export type RawPlatform = {
    id?: number;
    name?: string;
    slug?: string;
}

export type RawCompany = {
    id?: number;
    slug?: string;
    logo?: { image_id: string };
    name?: string;
    description?: string;
    developed?: number[];
    published?: number[];
}

export type RawKeyword = {
    id?: number;
    name?: string;
    slug?: string;
}

export type Game = {
    id?: number;
    slug?: string;
    name?: string;
    summary?: string;
    totalRating?: number;
    releaseDate?: Date;
    cover?: string;
    screenshots?: string[];
    videos?: string[]
    platforms?: number[];
    developers?: number[]; // involved_companies
    publishers?: number[]; // involved_companies
    genres?: number[];
    franchises?: number[];
    collections?: number[];
    similarGames?: number[];
    keywords?: number[];
    gameType?: GameType;
}

export type UserGameEntry = {
    id: string;
    userId: string;
    gameId: number;
    status: GameStatus;
    rating?: number;
    timePlayed?: number;
    timeMode?: string;
    timeFinished?: number;
    timeMastered?: number;
    notes?: string;
    favorite?: boolean;
    addedAt?: Date;
    startedAt?: Date;
    finishedAt?: Date;
    masteredAt?: Date;
    user: User;
    game: Game;
    userGamePlayLogs?: UserGamePlayLog[];
}

export type UserGamePlayLog = {
    id: string;
    userId: string;
    entryId: string;
    gameId: number;
    hours: number;
    note: string;
    skipRecap: boolean;
    playedAt: Date;
    createdAt: Date;
    game?: Game;
}

export type GameListEntry = {
    id: string;
    listId: string;
    gameId: number;
    position?: number | null;
    tier?: string | null;
    addedAt: Date;
    game: Game;
}

export type GameList = {
    id: string;
    userId: string;
    type: string;
    displayMode: string;
    tierLabels: string[];
    tierColors: string[];
    name: string;
    slug?: string | null;
    description?: string | null;
    image?: string | null;
    background?: string | null;
    color?: string | null;
    accentColor?: string | null;
    privacy: string;
    libraryPrivacy: string;
    logsPrivacy: string;
    activityPrivacy: string;
    commentsHidden: boolean;
    entries: GameListEntry[];
    user?: Pick<User, "id" | "name" | "image">;
    createdAt: Date;
    updatedAt: Date;
}

export type Collection = {
    id: number;
    name: string;
    slug: string;
    games: number[];
}

export type Franchise = {
    id: number;
    name: string;
    slug: string;
    games: number[];
}

export type Genre = {
    id: number;
    name: string;
    slug: string;
}

export type Platform = {
    id: number;
    name: string;
    slug: string;
}

export type Company = {
    id: number;
    slug: string;
    logo?: string;
    name?: string;
    description?: string;
    developed: number[];
    published: number[];
}

export type Keyword = {
    id: number;
    name: string;
    slug?: string;
}

export type User = {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    background?: string | null;
    bio?: string | null;
    profileColor?: string | null;
    accentColor?: string | null;
    privacy: string;
    libraryPrivacy: string;
    logsPrivacy: string;
    activityPrivacy: string;
    playlistPrivacy: string;
    socials?: string | null;
    preferences?: string | null;
    widgets?: string | null;
    commentsHidden: boolean;
    hideCommentsEverywhere: boolean;
    defaultGameListStatus: string;
    defaultGameListSort: string;
    defaultGameListView: string;
    defaultActivityFilter: string;
    siteThemeMode: string;
    siteThemeColor?: string | null;
    siteAccentColor?: string | null;
    notifyCommentReplies: boolean;
    notifyProfileComments: boolean;
    notifyLikes: boolean;
    notifyFollows: boolean;
    notifyFollowerLists: boolean;
    notifyBadges: boolean;
    roles: UserRole[];
    hasPassword: boolean;
    linkedProviders: string[];
    createdAt: string;
    updatedAt: string;
};

export type PublicUser = {
    id: string;
    name: string;
    createdAt: Date;
    image?: string;
    background?: string;
    bio?: string;
    profileColor?: string | null;
    accentColor?: string | null;
    privacy: string;
    libraryPrivacy: string;
    logsPrivacy: string;
    activityPrivacy: string;
    playlistPrivacy: string;
    socials?: string;
    widgets?: string;
    commentsHidden: boolean;
    hideCommentsEverywhere: boolean;
    roles: UserRole[];
}

export type Widget = {
    id: string;
    type: WidgetType;
    title: string;
    visible: boolean;
    content: string;
    stats: string[];
    games: number[];
}

export type SocialLink = {
    id: string;
    platform: string;
    kind: LinkType;
    value: string;
};

export type MarkdownBlock =
    | {
        type: "markdown";
        align: MarkdownAlign;
        color?: string;
        content: string;
    }
    | {
        type: "group";
        align?: MarkdownAlign;
        color?: string;
        href?: string;
        children: MarkdownBlock[];
    }
    | {
        type: "image";
        src: string;
        alt: string;
        align?: MarkdownAlign;
        width?: number;
        height?: number;
        fit?: string;
        position?: string;
        rounded?: boolean;
    }
    | {
        type: "video";
        src: string;
        poster?: string;
        align?: MarkdownAlign;
        width?: number;
        height?: number;
        rounded?: boolean;
    }
    | {
        type: "grid";
        columns: number;
        gap: number;
        cells: MarkdownBlock[][];
    };
