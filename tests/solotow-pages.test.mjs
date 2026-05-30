import assert from "node:assert/strict";
import test from "node:test";
import vento from "ventojs";

const templates = vento({
  includes: "./src/views/",
});

async function renderTemplate(path) {
  const template = await templates.load(path);
  const result = await template();
  return result.content;
}

test("soloTow page renders the approved project post content", async () => {
  const html = await renderTemplate("pages/solotow.vto");

  assert.match(html, /<h1>soloTow<\/h1>/);
  assert.match(html, /60 successful tows/);
  assert.match(html, /650 ft average tow altitude/);
  assert.match(html, /5 kW hub motor/);
  assert.match(html, /Heltec LoRa remote/);
  assert.match(html, /pay-in towing/i);
  assert.match(html, /deadman switch/i);
  assert.match(html, /Controller power limit/i);
  assert.match(html, /relay radio station/i);
  assert.match(html, /smaller winch motor/i);
  assert.match(html, /Paragliding and towing are dangerous/);
  assert.match(html, /raw\.githubusercontent\.com\/brian-greeson\/soloTow\/main\/guide\/IMG_1869\.jpeg/);
  assert.doesNotMatch(html, /case study/i);
  assert.doesNotMatch(html, /href=["']https:\/\/github\.com\/brian-greeson\/soloTow/i);
  assert.doesNotMatch(html, /100\+ successful tows/i);
});

test("home page links to the soloTow post", async () => {
  const html = await renderTemplate("pages/index.vto");

  assert.match(html, /<h2>soloTow<\/h2>/);
  assert.match(html, /href="\/projects\/solotow"/);
  assert.doesNotMatch(html, /href=["']https:\/\/github\.com\/brian-greeson\/soloTow/i);
});

test("projects page links to the soloTow post", async () => {
  const html = await renderTemplate("pages/projects.vto");

  assert.match(html, /<h2>soloTow<\/h2>/);
  assert.match(html, /href="\/projects\/solotow"/);
  assert.doesNotMatch(html, /href=["']https:\/\/github\.com\/brian-greeson\/soloTow/i);
});
