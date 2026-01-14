import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users_table", {
  id: int().primaryKey({ autoIncrement: true }),
  first_name: text().notNull(),
  last_name: text().notNull(),
  age: int(),
  email: text().notNull().unique(),
});
