type QueueItem<T> = {
    task: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (error: unknown) => void;
};

export default class RequestQueue {
    private queue: QueueItem<any>[] = [];
    private running = false;

    constructor(
        private readonly requestsPerSecond: number,
        private readonly delayMs = 1000
    ) { }

    public run<T>(task: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.process();
        });
    }

    private async process() {
        if (this.running) return;
        this.running = true;

        while (this.queue.length > 0) {
            const batch = this.queue.splice(0, this.requestsPerSecond);

            await Promise.all(
                batch.map(async item => {
                    try {
                        const result = await item.task();
                        item.resolve(result);
                    } catch (error) {
                        item.reject(error);
                    }
                })
            );

            if (this.queue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, this.delayMs));
            }
        }

        this.running = false;
    }
}