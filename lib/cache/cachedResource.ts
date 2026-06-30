import { readDiskCache, writeDiskCache } from "./diskCache";

export default class CachedResource<T> {
	private data: T | null = null;
	private lastUpdated = 0;
	private isUpdating = false;

	constructor(
		private readonly options: {
			name: string;
			ttlMs: number;
			fetcher: () => Promise<T>;
			fallback: T;
		},
	) {}

	public get name() {
		return this.options.name;
	}

	public get ttlMs() {
		return this.options.ttlMs;
	}

	public get isExpired() {
		return Date.now() - this.lastUpdated > this.options.ttlMs;
	}

	public async hydrateFromDisk() {
		const diskData = await readDiskCache<T>(this.options.name);

		if (diskData != null) {
			this.data = diskData;
		}
	}

	public async get(): Promise<T> {
		if (this.data === null) {
			await this.hydrateFromDisk();
		}

		if ((this.data === null || this.isExpired) && !this.isUpdating) {
			this.refresh().catch(Error);
		}

		return this.data ?? this.options.fallback;
	}

	public async refresh(): Promise<T> {
		if (this.isUpdating) {
			while (this.isUpdating) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			return this.data as T;
		}

		this.isUpdating = true;

		try {
			const freshData = await this.options.fetcher();

			this.data = freshData;
			this.lastUpdated = Date.now();

			await writeDiskCache(this.options.name, freshData);

			return freshData;
		} finally {
			this.isUpdating = false;
		}
	}
}
