import { ratingToFive } from "./rating";

type LibraryFilterChoice = "any" | "yes" | "no";

type LibraryFilterTag = {
    name: string;
};

type LibraryFilterEntry = {
    status: string;
    rating: number | null;
    timePlayed: number | null;
    timeFinished: number | null;
    timeMastered: number | null;
    finishedAt: Date | string | null;
    masteredAt: Date | string | null;
    tags: LibraryFilterTag[];
};

type LibraryFilters = {
    statuses: readonly string[];
    excludedStatuses: readonly string[];
    ratingMin: string;
    ratingMax: string;
    hoursMin: string;
    hoursMax: string;
    finished: LibraryFilterChoice;
    mastered: LibraryFilterChoice;
    tags: readonly string[];
    excludedTags: readonly string[];
};

function filterNumber(value: string) {
    if (value === "") return null;

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function matchesNumberRange(value: number, min: number | null, max: number | null) {
    return (min == null || value >= min) && (max == null || value <= max);
}

function matchesChoice(value: boolean, choice: LibraryFilterChoice) {
    return choice === "any" || (choice === "yes" && value) || (choice === "no" && !value);
}

function matchesTags(entryTags: Set<string>, filters: LibraryFilters) {
    return filters.tags.every((tag) => entryTags.has(tag)) && !filters.excludedTags.some((tag) => entryTags.has(tag));
}

export function advancedLibraryFilterCount(filters: LibraryFilters) {
    return filters.statuses.length +
        filters.excludedStatuses.length +
        filters.tags.length +
        filters.excludedTags.length +
        (filters.ratingMin ? 1 : 0) +
        (filters.ratingMax ? 1 : 0) +
        (filters.hoursMin ? 1 : 0) +
        (filters.hoursMax ? 1 : 0) +
        (filters.finished === "any" ? 0 : 1) +
        (filters.mastered === "any" ? 0 : 1);
}

export function matchesAdvancedLibraryFilters(entry: LibraryFilterEntry, filters: LibraryFilters) {
    if (filters.statuses.length && !filters.statuses.includes(entry.status)) return false;
    if (filters.excludedStatuses.includes(entry.status)) return false;

    const rating = ratingToFive(entry.rating ?? 0) ?? 0;
    const hours = entry.timePlayed ?? 0;

    if (!matchesNumberRange(rating, filterNumber(filters.ratingMin), filterNumber(filters.ratingMax))) return false;
    if (!matchesNumberRange(hours, filterNumber(filters.hoursMin), filterNumber(filters.hoursMax))) return false;

    const finished = Boolean(entry.finishedAt || entry.timeFinished != null);
    const mastered = Boolean(entry.masteredAt || entry.timeMastered != null);

    if (!matchesChoice(finished, filters.finished)) return false;
    if (!matchesChoice(mastered, filters.mastered)) return false;

    return matchesTags(new Set(entry.tags.map((tag) => tag.name)), filters);
}
