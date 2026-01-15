import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from 'node:path';

const dbPath = path.resolve(process.env.DB_FILE_NAME!);
const sqlite = new Database(dbPath, {
  timeout: 5000,
  fileMustExist: false,
});
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("synchronous = NORMAL");

export const db = drizzle({ client: sqlite });
