import type { getDb } from "./db";

export type Db = NonNullable<ReturnType<typeof getDb>>;
