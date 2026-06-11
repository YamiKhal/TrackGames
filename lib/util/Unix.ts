export class Unix {
    private date: number;

    constructor() {
        this.date = Unix.now();
    }

    public elapse(measure: UnixElapseMeasure, by: number): number {
        const seconds = {
            [UnixElapseMeasure.DAYS]: 24 * 60 * 60,
            [UnixElapseMeasure.MONTHS]: 30 * 24 * 60 * 60,
            [UnixElapseMeasure.YEARS]: 365 * 24 * 60 * 60,
        };

        this.date += by * seconds[measure];
        return this.date;
    }

    public now(): number {
        return this.date;
    }

    public static now(): number {
        return Math.floor(Date.now() / 1000);
    }
}

export enum UnixElapseMeasure {
    DAYS,
    MONTHS,
    YEARS,
}