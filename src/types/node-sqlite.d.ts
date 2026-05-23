declare module "node:sqlite" {
  export class StatementSync {
    get<T = Record<string, unknown>>(...args: unknown[]): T | undefined;
    all<T = Record<string, unknown>>(...args: unknown[]): T[];
    run(
      ...args: unknown[]
    ): { changes: number; lastInsertRowid: bigint | number };
  }

  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
