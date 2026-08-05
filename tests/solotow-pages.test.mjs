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
  assert.match(html, /average tow altitude around\s+650 ft/);
  assert.match(html, /5 kW hub motor/);
  assert.match(html, /Heltec LoRa remote/);
  assert.match(html, /Flying in the flatlands requires towing/);
  assert.match(html, /<h2>Results<\/h2>/);
  assert.match(html, /Why not pay out towing\?/);
  assert.match(html, /pay-in towing/i);
  assert.match(html, /deadman switch/i);
  assert.match(html, /Controller power limit/i);
  assert.match(html, /relay radio station/i);
  assert.match(html, /smaller winch motor/i);
  assert.match(html, /Paragliding and towing are dangerous/);
  assert.match(html, /raw\.githubusercontent\.com\/brian-greeson\/soloTow\/main\/guide\/IMG_1869\.jpeg/);
  assert.doesNotMatch(html, /case study/i);
  assert.doesNotMatch(html, /<strong>/i);
  assert.doesNotMatch(html, /<\/strong>/i);
  assert.doesNotMatch(html, /aspect-ratio:\s*4\s*\/\s*3/i);
  assert.doesNotMatch(html, /object-fit:\s*cover/i);
  assert.doesNotMatch(html, /soloTow quick facts/i);
  assert.doesNotMatch(html, /Pay-in failure behavior/i);
  assert.doesNotMatch(html, /<span class="fact-label">Status<\/span>/);
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

for (const page of ["index", "projects"]) {
  test(`${page} page lists TowForce immediately below GlideHero`, async () => {
    const html = await renderTemplate(`pages/${page}.vto`);
    const projectHeadings = [...html.matchAll(/<h2>([^<]+)<\/h2>/g)].map((match) => match[1]);
    const glideHeroPosition = projectHeadings.indexOf("GlideHero");

    assert.equal(projectHeadings[glideHeroPosition + 1], "TowForce");
    assert.match(html, /href="https:\/\/github\.com\/brian-greeson\/towForce" target="_blank" rel="noopener"/);
    assert.match(html, /interactive, browser-based 2D paraglider tow simulator/);
  });

  test(`${page} page lists GlideHero first`, async () => {
    const html = await renderTemplate(`pages/${page}.vto`);
    const glideHeroPosition = html.indexOf("<h2>GlideHero</h2>");
    const soloTowPosition = html.indexOf("<h2>soloTow</h2>");

    assert.notEqual(glideHeroPosition, -1);
    assert.match(html, /href="https:\/\/glidehero\.com"/);
    assert.match(html, /GPS flight\s+recordings/);
    assert.match(html, /PostgreSQL\/PostGIS/);
    assert.match(html, /Valkey-backed workers/);
    assert.ok(glideHeroPosition < soloTowPosition);
  });
}
