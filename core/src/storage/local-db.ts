export class LocalDB {
    private storage: Map<string, any>;

    constructor() {
        this.storage = new Map<string, any>();
    }

    public save(key: string, value: any): void {
        this.storage.set(key, value);
    }

    public retrieve(key: string): any | null {
        return this.storage.has(key) ? this.storage.get(key) : null;
    }

    public remove(key: string): void {
        this.storage.delete(key);
    }

    public clear(): void {
        this.storage.clear();
    }
}