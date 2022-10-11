export class ManualPromise {
    instance: Promise<void>;
    resolveFn!: Function;
    constructor() {
        this.instance = new Promise(resolve => {
            this.resolveFn = resolve;
        });
    }

    wait() {
        return this.instance;
    }

    resolve() {
        this.resolveFn();
    }

    reset() {
        this.instance = new Promise(resolve => {
            this.resolveFn = resolve;
        });
    }
}