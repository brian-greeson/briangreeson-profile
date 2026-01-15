process.loadEnvFile();
import "./env.js";
import express from "express";
import vento from "ventojs";
import { db } from "./db/db.js";
import { usersTable } from "./db/schema.js";
import { sessionMiddleware } from "./middleware/sessionStore.js";
import { authMiddleware } from './middleware/authMiddleware.js';
import { devMiddleware } from "./middleware/devMiddleware.js";

const templates = vento({
  includes: "./src/views/",
});
const indexTemplate = await templates.load("pages/index.vto");
const projectsTemplate = await templates.load("pages/projects.vto");
const touringTemplate = await templates.load("pages/touring.vto");
const contactTemplate = await templates.load("pages/contact.vto");
const app = express();
console.log(app.get("env"));
app.set("trust proxy", 1);
app.use(sessionMiddleware);

if (process.env.NODE_ENV !== "production") {
  app.use(devMiddleware(templates));
}

app.use(authMiddleware)

const ensureSessionUser = async (req: express.Request) => {
  const users = await db.select().from(usersTable);
  req.session.userId = req.session.userId ?? users[0]?.id;
};

app.get("/", async (req, res) => {
  await ensureSessionUser(req);
  const result = await indexTemplate();
  res.type("html").send(result.content);
});

app.get("/projects", async (req, res) => {
  await ensureSessionUser(req);
  const result = await projectsTemplate();
  res.type("html").send(result.content);
});

app.get("/touring", async (req, res) => {
  await ensureSessionUser(req);
  const result = await touringTemplate();
  res.type("html").send(result.content);
});

app.get("/contact", async (req, res) => {
  await ensureSessionUser(req);
  const result = await contactTemplate();
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
