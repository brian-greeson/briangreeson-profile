process.loadEnvFile();
import "./env.js";
import express from "express";
import vento from "ventojs";
import { db } from "./db/db.js";
import { usersTable } from "./db/schema.js";
import { sessionMiddleware } from "./middleware/sessionStore.js";
import { authMiddleware } from './middleware/authMiddleware.js';

const templates = vento({
  includes: "./src/views/",
});
const template = await templates.load("pages/index.vto");
const result = await template();
const app = express();
console.log(app.get("env"));
app.set("trust proxy", 1);
app.use(sessionMiddleware);



app.use(authMiddleware)

app.get("/", async (req, res) => {
  const users = await db.select().from(usersTable);

  req.session.userId = req.session.userId ?? users[0]?.id;

  res.type("html").send(result.content);
});

app.get("/up", async (req, res) => {
  console.log("up");
  res.sendStatus(200);
});

const port = 3000;
app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
