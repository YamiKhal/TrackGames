export default class RateLimiter {
	private readonly queue: (() => void)[] = [];
	private active = 0;

	constructor(
		private readonly maxPerSecond = 3,
		private readonly intervalMs = 1000,
	) {
		setInterval(() => this.release(), intervalMs);
	}

	private release() {
		this.active = 0;

		while (this.active < this.maxPerSecond && this.queue.length > 0) {
			this.active++;
			this.queue.shift()?.();
		}
	}

	async run<T>(task: () => Promise<T>): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.queue.push(() => {
				task().then(resolve).catch(reject);
			});
		});
	}
}
