import type { UserLibraryEntryWithTags } from "@/lib/data/gamelist/library";
import { GameStatus } from "@/lib/generated/prisma/enums";
import { advancedFilterCount, matchesAdvancedFilters } from "@/lib/util/filtering";

const emptyFilters = {
	statuses: [],
	excludedStatuses: [],
	ratingMin: "",
	ratingMax: "",
	hoursMin: "",
	hoursMax: "",
	finished: "any",
	mastered: "any",
	tags: [],
	excludedTags: [],
} as const;

function mockEntry(overrides: Partial<UserLibraryEntryWithTags> = {}): UserLibraryEntryWithTags {
	return {
		status: GameStatus.PLAYING,
		rating: null,
		timePlayed: null,
		finishedAt: null,
		timeFinished: null,
		masteredAt: null,
		timeMastered: null,
		tags: [],
		...overrides,
	} as UserLibraryEntryWithTags;
}

describe("advancedFilterCount", () => {
	it("is zero when no filters are set", () => {
		expect(advancedFilterCount({ ...emptyFilters })).toBe(0);
	});

	it("counts each active filter dimension", () => {
		expect(
			advancedFilterCount({
				...emptyFilters,
				statuses: [GameStatus.PLAYING],
				excludedStatuses: [GameStatus.DROPPED],
				ratingMin: "3",
				ratingMax: "5",
				hoursMin: "1",
				hoursMax: "10",
				finished: "yes",
				mastered: "no",
				tags: ["a", "b"],
				excludedTags: ["c"],
			}),
		).toBe(11);
	});
});

describe("matchesAdvancedFilters", () => {
	it("matches everything when no filters are set", () => {
		expect(matchesAdvancedFilters(mockEntry(), emptyFilters)).toBe(true);
	});

	it("filters by included status", () => {
		const filters = { ...emptyFilters, statuses: [GameStatus.COMPLETED] };
		expect(matchesAdvancedFilters(mockEntry({ status: GameStatus.COMPLETED }), filters)).toBe(true);
		expect(matchesAdvancedFilters(mockEntry({ status: GameStatus.PLAYING }), filters)).toBe(false);
	});

	it("filters by excluded status", () => {
		const filters = { ...emptyFilters, excludedStatuses: [GameStatus.DROPPED] };
		expect(matchesAdvancedFilters(mockEntry({ status: GameStatus.DROPPED }), filters)).toBe(false);
		expect(matchesAdvancedFilters(mockEntry({ status: GameStatus.PLAYING }), filters)).toBe(true);
	});

	it("filters by rating range, treating a null rating as 0", () => {
		const filters = { ...emptyFilters, ratingMin: "3" };
		expect(matchesAdvancedFilters(mockEntry({ rating: null }), filters)).toBe(false);
		expect(matchesAdvancedFilters(mockEntry({ rating: 80 }), filters)).toBe(true);
	});

	it("filters by hours played range", () => {
		const filters = { ...emptyFilters, hoursMin: "10", hoursMax: "20" };
		expect(matchesAdvancedFilters(mockEntry({ timePlayed: 5 }), filters)).toBe(false);
		expect(matchesAdvancedFilters(mockEntry({ timePlayed: 15 }), filters)).toBe(true);
		expect(matchesAdvancedFilters(mockEntry({ timePlayed: 25 }), filters)).toBe(false);
	});

	it("filters by finished state via either finishedAt or timeFinished", () => {
		const filters = { ...emptyFilters, finished: "yes" } as const;
		expect(matchesAdvancedFilters(mockEntry(), filters)).toBe(false);
		expect(matchesAdvancedFilters(mockEntry({ finishedAt: new Date() }), filters)).toBe(true);
		expect(matchesAdvancedFilters(mockEntry({ timeFinished: 12 }), filters)).toBe(true);
	});

	it("filters by unfinished state", () => {
		const filters = { ...emptyFilters, finished: "no" } as const;
		expect(matchesAdvancedFilters(mockEntry(), filters)).toBe(true);
		expect(matchesAdvancedFilters(mockEntry({ finishedAt: new Date() }), filters)).toBe(false);
	});

	it("filters by mastered state via either masteredAt or timeMastered", () => {
		const filters = { ...emptyFilters, mastered: "yes" } as const;
		expect(matchesAdvancedFilters(mockEntry(), filters)).toBe(false);
		expect(matchesAdvancedFilters(mockEntry({ masteredAt: new Date() }), filters)).toBe(true);
		expect(matchesAdvancedFilters(mockEntry({ timeMastered: 30 }), filters)).toBe(true);
	});

	it("requires every included tag to be present", () => {
		const filters = { ...emptyFilters, tags: ["co-op", "indie"] };
		expect(matchesAdvancedFilters(mockEntry({ tags: [{ id: "1", name: "co-op" }] }), filters)).toBe(false);
		expect(
			matchesAdvancedFilters(
				mockEntry({
					tags: [
						{ id: "1", name: "co-op" },
						{ id: "2", name: "indie" },
					],
				}),
				filters,
			),
		).toBe(true);
	});

	it("excludes entries carrying any excluded tag", () => {
		const filters = { ...emptyFilters, excludedTags: ["spoiler"] };
		expect(matchesAdvancedFilters(mockEntry({ tags: [{ id: "1", name: "spoiler" }] }), filters)).toBe(false);
		expect(matchesAdvancedFilters(mockEntry({ tags: [{ id: "1", name: "co-op" }] }), filters)).toBe(true);
	});

	it("combines all filter dimensions with AND semantics", () => {
		const filters = {
			...emptyFilters,
			statuses: [GameStatus.COMPLETED],
			ratingMin: "4",
			finished: "yes",
			tags: ["indie"],
		} as const;

		const matching = mockEntry({
			status: GameStatus.COMPLETED,
			rating: 90,
			finishedAt: new Date(),
			tags: [{ id: "1", name: "indie" }],
		});

		expect(matchesAdvancedFilters(matching, filters)).toBe(true);
		expect(matchesAdvancedFilters({ ...matching, rating: 50 }, filters)).toBe(false);
	});
});
