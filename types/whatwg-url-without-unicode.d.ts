declare module 'whatwg-url-without-unicode' {
  export class URL {
    static createObjectURL(blob: any): string;
    static revokeObjectURL(url: string): void;
  }
  export class URLSearchParams {
    constructor(init?: string | Record<string, string> | string[][] | URLSearchParams);
    append(name: string, value: string): void;
    delete(name: string): void;
    get(name: string): string | null;
    getAll(name: string): string[];
    has(name: string): boolean;
    set(name: string, value: string): void;
    sort(): void;
    toString(): string;
  }
}
