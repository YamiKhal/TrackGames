import { type UserLibraryEntryWithTags } from "@/lib/data/gamelist/library";
import { filterNumber, matchesNumberRange } from "@/lib/util/format/numbers";
import { ratingToFive } from "@/lib/util/format/rating";

type FilterChoice = "any" | "yes" | "no";

type Filters = {
	statuses: readonly string[];
	excludedStatuses: readonly string[];
	ratingMin: string;
	ratingMax: string;
	hoursMin: string;
	hoursMax: string;
	finished: FilterChoice;
	mastered: FilterChoice;
	tags: readonly string[];
	excludedTags: readonly string[];
};

function matchesChoice(value: boolean, choice: FilterChoice) {
	return choice === "any" || (choice === "yes" && value) || (choice === "no" && !value);
}

function matchesTags(entryTags: Set<string>, filters: Filters) {
	return filters.tags.every((tag) => entryTags.has(tag)) && !filters.excludedTags.some((tag) => entryTags.has(tag));
}

export function advancedFilterCount(filters: Filters) {
	return (
		filters.statuses.length +
		filters.excludedStatuses.length +
		filters.tags.length +
		filters.excludedTags.length +
		(filters.ratingMin ? 1 : 0) +
		(filters.ratingMax ? 1 : 0) +
		(filters.hoursMin ? 1 : 0) +
		(filters.hoursMax ? 1 : 0) +
		(filters.finished === "any" ? 0 : 1) +
		(filters.mastered === "any" ? 0 : 1)
	);
}

export function matchesAdvancedFilters(entry: UserLibraryEntryWithTags, filters: Filters) {
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
