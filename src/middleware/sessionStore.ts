// session.ts
import session from "express-session"
import Database from "better-sqlite3"
import { createRequire } from "node:module"
import path from 'node:path'
const require = createRequire(import.meta.url)
const BetterSqlite3SessionStore = require("better-sqlite3-session-store")


if (!process.env.SESSION_DB) 
  throw new Error("SESSION DB NOT CONFIGURED");
  
const SqliteStore = BetterSqlite3SessionStore(session)
const dbPath = path.resolve(process.env.SESSION_DB)
const sessionsDb = new Database(dbPath)
sessionsDb.pragma("journal_mode = WAL")

export const sessionMiddleware = session({
  
  name: "sid",
  secret: process.env.SESSION_SECRET?? "dev-secret",
  resave: false,
  saveUninitialized: false,

  store: new SqliteStore({
    client: sessionsDb,
    expired: {
      clear: true,
      intervalMs: 15 * 60 * 1000,
    },
  }),

  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
  },
})
