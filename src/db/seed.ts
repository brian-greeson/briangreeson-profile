import "../env.js";
import { db } from "./db.js";
import { usersTable } from "./schema.js";

const  seed = async () => {
  
  const user: typeof usersTable.$inferInsert = {
    first_name: "Devon",
    last_name: "Developer",
    age: 30,
    email: "john@example.com",
  };
 console.log(`beginning db seed ${db.$client.name}`)
  await db.insert(usersTable).values(user);
};


seed()