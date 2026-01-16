import "./env.js";
import express from "express";
import vento from "ventojs";
import { devMiddleware } from "./middleware/devMiddleware.js";

const templates = vento({
  includes: "./src/views/",
});
const app = express();
app.set("trust proxy", 1);

if (process.env.NODE_ENV !== "production") {
  app.use(devMiddleware(templates));
}

app.get("/", async (req, res) => {
  const indexTemplate = await templates.load("pages/index.vto");

  const result = await indexTemplate();
  res.type("html").send(result.content);
});

app.get("/projects", async (req, res) => {
  const projectsTemplate = await templates.load("pages/projects.vto");

  const result = await projectsTemplate();
  res.type("html").send(result.content);
});

app.get("/touring", async (req, res) => {
  const touringTemplate = await templates.load("pages/touring.vto");

  const result = await touringTemplate();
  res.type("html").send(result.content);
});

app.get("/contact", async (req, res) => {
  const contactTemplate = await templates.load("pages/contact.vto");

  const result = await contactTemplate();
  res.type("html").send(result.content);
});

app.get("/up", async (req, res) => {
  console.log(process.env.DB_FILE_NAME);
  console.log("up");
  res.sendStatus(200);
});

const port = 3000;
app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
