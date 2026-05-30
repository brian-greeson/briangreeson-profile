# soloTow Project Post Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated `/projects/solotow` project post to the profile site and link to it from the existing project lists.

**Architecture:** Keep the current Express plus Vento route-per-page pattern. Add one page-local Vento template for the post, one Express route that renders it, and small updates to the home and projects listings. Add a lightweight Node test file that renders Vento templates directly and checks the required page content and internal links.

**Tech Stack:** Node.js, TypeScript, Express 5, VentoJS templates, built-in `node:test`, built-in `node:assert/strict`.

---

## File Structure

- Create `tests/solotow-pages.test.mjs`: Direct Vento render tests for the new post and project-list links.
- Create `src/views/pages/solotow.vto`: The soloTow project post template, including page-local CSS and the remote build photo.
- Modify `package.json`: Replace the current failing `npm test` script with a Node test runner command.
- Modify `src/server.ts`: Add the `/projects/solotow` route.
- Modify `src/views/pages/index.vto`: Add soloTow to the home page project list and style `.project` entries consistently.
- Modify `src/views/pages/projects.vto`: Add soloTow to the projects page list.

## Task 1: Add Render Tests

**Files:**
- Create: `tests/solotow-pages.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Replace the current test script**

In `package.json`, replace the existing script:

```json
"test": "echo \"Error: no test specified\" && exit 1",
```

with:

```json
"test": "node --test tests/*.test.mjs",
```

- [ ] **Step 2: Create the failing render tests**

Create `tests/solotow-pages.test.mjs` with:

```js
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
```

- [ ] **Step 3: Run tests and verify they fail for the expected reason**

Run:

```bash
npm test
```

Expected: FAIL. The first failure should be that `pages/solotow.vto` cannot be loaded, because the page has not been created yet.

## Task 2: Add The soloTow Route And Page

**Files:**
- Modify: `src/server.ts`
- Create: `src/views/pages/solotow.vto`
- Test: `tests/solotow-pages.test.mjs`

- [ ] **Step 1: Add the Express route**

In `src/server.ts`, add this route after the existing `/projects` route and before `/touring`:

```ts
app.get("/projects/solotow", async (req, res) => {
  const solotowTemplate = await templates.load("pages/solotow.vto");

  const result = await solotowTemplate();
  res.type("html").send(result.content);
});
```

- [ ] **Step 2: Create the soloTow page**

Create `src/views/pages/solotow.vto` with:

```html
{{ layout "layouts/appLayout.vto"}}
<style>
  @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap");

  :root {
    --ink: #111318;
    --muted: #5f656f;
    --line: #e2e6ec;
    --accent: #15566c;
    --accent-soft: #e4f0f3;
    --paper: #f7f9fb;
  }

  * {
    box-sizing: border-box;
  }

  body {
    min-height: 100vh;
    margin: 0;
    font-family: "Space Grotesk", "Trebuchet MS", sans-serif;
    color: var(--ink);
    background: linear-gradient(180deg, #ffffff 0%, #f7f9fb 78%, #e4e8ee 100%);
  }

  #main-content {
    padding: 28px 20px 46px;
  }

  .page {
    max-width: 980px;
    margin: 0 auto;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 0.86fr);
    gap: 30px;
    align-items: center;
    padding: 34px 0 24px;
    border-bottom: 1px solid var(--line);
  }

  .eyebrow {
    margin: 0 0 10px;
    color: var(--muted);
    font-size: 0.78rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .hero h1 {
    margin: 0 0 12px;
    font-size: clamp(2.4rem, 5vw, 4rem);
    line-height: 1;
    font-weight: 700;
  }

  .hero p {
    margin: 0;
    color: var(--muted);
    font-size: 1.06rem;
    line-height: 1.65;
    max-width: 640px;
  }

  .hero-media {
    margin: 0;
  }

  .hero-media img {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border: 1px solid var(--line);
  }

  .hero-media figcaption {
    margin-top: 8px;
    color: var(--muted);
    font-size: 0.82rem;
    line-height: 1.4;
  }

  .facts {
    display: grid;
    grid-template-columns: repeat(5, minmax(120px, 1fr));
    gap: 10px;
    margin: 18px 0 0;
  }

  .fact {
    min-height: 86px;
    padding: 13px;
    border: 1px solid var(--line);
    background: #ffffff;
  }

  .fact-label {
    display: block;
    color: var(--muted);
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .fact-value {
    display: block;
    margin-top: 8px;
    font-size: 1rem;
    line-height: 1.3;
    font-weight: 600;
  }

  .post {
    max-width: 760px;
    margin: 0;
  }

  .section {
    padding: 26px 0 0;
  }

  .section h2 {
    margin: 0 0 10px;
    font-size: 1.22rem;
    line-height: 1.25;
  }

  .section p {
    margin: 0 0 13px;
    color: var(--muted);
    line-height: 1.72;
  }

  .section strong {
    color: var(--ink);
    font-weight: 600;
  }

  .feature-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    padding: 0;
    margin: 16px 0 0;
    list-style: none;
  }

  .feature-list li {
    padding: 12px 13px;
    border: 1px solid var(--line);
    background: #ffffff;
    color: var(--muted);
    line-height: 1.5;
  }

  .callout {
    margin-top: 16px;
    padding: 15px 16px;
    border-left: 4px solid var(--accent);
    background: var(--accent-soft);
  }

  .callout p {
    margin: 0;
    color: var(--ink);
  }

  footer {
    margin-top: 32px;
    color: var(--muted);
    font-size: 0.88rem;
    border-top: 1px solid var(--line);
    padding-top: 14px;
  }

  @media (max-width: 860px) {
    .hero {
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .facts {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    #main-content {
      padding: 20px 16px 38px;
    }

    .hero {
      padding-top: 26px;
    }

    .facts,
    .feature-list {
      grid-template-columns: 1fr;
    }
  }
</style>

<div class="page">
  {{ include "partials/nav.vto" }}

  <header class="hero">
    <div>
      <p class="eyebrow">Paragliding build</p>
      <h1>soloTow</h1>
      <p>
        A portable paragliding self-tow winch built around simple assembly, remote control, and safe failure behavior.
        The project started with a practical flatlands problem: towing can unlock flying sites, but it usually adds
        people, vehicles, gear, and cost.
      </p>
    </div>
    <figure class="hero-media">
      <img src="https://raw.githubusercontent.com/brian-greeson/soloTow/main/guide/IMG_1869.jpeg"
        alt="soloTow winch build in the field">
      <figcaption>soloTow field build with the tow drum, frame, and drive hardware assembled.</figcaption>
    </figure>
  </header>

  <section class="facts" aria-label="soloTow quick facts">
    <div class="fact">
      <span class="fact-label">Status</span>
      <span class="fact-value">Fully functional build</span>
    </div>
    <div class="fact">
      <span class="fact-label">Field use</span>
      <span class="fact-value">60 successful tows</span>
    </div>
    <div class="fact">
      <span class="fact-label">Average tow</span>
      <span class="fact-value">650 ft average tow altitude</span>
    </div>
    <div class="fact">
      <span class="fact-label">Drive</span>
      <span class="fact-value">5 kW hub motor</span>
    </div>
    <div class="fact">
      <span class="fact-label">Remote</span>
      <span class="fact-value">Heltec LoRa remote</span>
    </div>
  </section>

  <main class="post">
    <section class="section">
      <h2>The problem</h2>
      <p>
        If you live away from launchable terrain, towing can be the difference between watching the weather and actually
        flying. The catch is that towing adds logistics. It can mean finding a tow site, an extra vehicle, an extra
        operator, or an expensive payout winch before the flying part even starts.
      </p>
      <p>
        soloTow is a DIY pay-in winch built to make that process more portable and accessible, while giving a capable
        pilot more independence.
      </p>
    </section>

    <section class="section">
      <h2>The design target</h2>
      <p>
        The hard part was not simply making a winch that pulls. The useful version had to be easy enough for a competent
        builder to assemble, light enough to move, and conservative enough that common failure modes did not keep
        applying tow force when they should not.
      </p>
      <ul class="feature-list">
        <li>Aluminum extrusion frame and few custom parts to keep fabrication approachable.</li>
        <li>3D printed components where they simplify mounting or packaging.</li>
        <li>Off-the-shelf drive, battery, controller, and radio components.</li>
        <li>Controller power limiting to reduce the chance of dangerous over-tow forces.</li>
      </ul>
    </section>

    <section class="section">
      <h2>Pay-in failure behavior</h2>
      <p>
        soloTow uses a pay-in architecture. In that setup, the pilot is flying toward the line. If the winch or
        controller has a mechanical or control problem, line tension tends to drop toward zero and the pilot can
        transition to a normal landing pattern.
      </p>
      <div class="callout">
        <p>
          That does not make towing safe. It does give some winch-side failures a more forgiving default behavior than a
          payout system, where the pilot remains coupled to a line source feeding away from the winch.
        </p>
      </div>
    </section>

    <section class="section">
      <h2>System architecture</h2>
      <p>
        The winch is built around a <strong>5 kW rated hub motor</strong>, a <strong>Kelly motor controller</strong>,
        battery-powered electric drive, tow drum, tow line, and an aluminum extrusion frame. The control side uses
        <strong>Heltec LoRa dev boards</strong> for communication between the handheld remote and the winch.
      </p>
      <p>
        The architecture is intentionally plain. Parts are visible, inspectable, and replaceable. The frame avoids
        specialized fabrication where possible, and 3D printed pieces handle the smaller mounting and packaging details.
      </p>
    </section>

    <section class="section">
      <h2>Remote safety</h2>
      <p>
        The remote includes a <strong>deadman switch</strong>, and the controller uses a timeout if the remote connection
        is lost. That timeout is a real design tradeoff: at launch, the pilot may be low to the ground and roughly 1 km
        away from the winch. That is one of the moments where stale commands would be most dangerous, but it is also
        where the RF link is weakest.
      </p>
      <p>
        The signal could disappear when occluded by clothing or harness. The timeout had to be tuned to fail safe when
        the link was truly gone without causing constant nuisance cutouts during launch setup. The controller power
        limit is another passive safety choice, keeping normal operation away from aggressive over-tow forces.
      </p>
    </section>

    <section class="section">
      <h2>What I would improve next</h2>
      <p>
        The radio link is the first obvious improvement. A relay radio station placed closer to the pilot could maintain
        a steadier link between the pilot and winch, significantly improving remote performance when the pilot is low
        and far away.
      </p>
      <p>
        The other improvement is weight. A smaller winch motor would reduce the system weight and make transportation
        easier while keeping the design focused on the towing performance it actually needs.
      </p>
    </section>

    <section class="section">
      <h2>Field validation</h2>
      <p>
        The current system is fully functional and has completed <strong>60 successful tows</strong>, with an average tow
        altitude around <strong>650 ft</strong>. That field use matters because it tested the build in the conditions it
        was designed for: real setup, real launch distance, real radio behavior, and real tow loads.
      </p>
    </section>

    <section class="section">
      <h2>Safety note</h2>
      <p>
        Paragliding and towing are dangerous. This project is not intended for inexperienced pilots, club or commercial
        towing, or use without proper instruction and judgment.
      </p>
    </section>
  </main>

  <footer>
    Built and field tested by Brian Greeson.
  </footer>
</div>

{{ /layout }}
```

- [ ] **Step 3: Run the focused page test**

Run:

```bash
node --test --test-name-pattern "soloTow page" tests/solotow-pages.test.mjs
```

Expected: PASS for the soloTow page content test. The full `npm test` command should still fail until the home and projects links are added in Task 3.

- [ ] **Step 4: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: PASS with `tsc` completing and `src/views` copied into `dist/views`.

- [ ] **Step 5: Commit the route and page**

```bash
git add src/server.ts src/views/pages/solotow.vto tests/solotow-pages.test.mjs package.json
git commit -m "Add soloTow project post page"
```

## Task 3: Link The Post From Existing Project Lists

**Files:**
- Modify: `src/views/pages/index.vto`
- Modify: `src/views/pages/projects.vto`
- Test: `tests/solotow-pages.test.mjs`

- [ ] **Step 1: Add project-entry styles to the home page**

In `src/views/pages/index.vto`, add this CSS after the `.section h2` block:

```css
  .project {
    padding: 10px 0 12px;
    border-bottom: 1px solid var(--line);
  }

  .project:last-child {
    border-bottom: none;
  }

  .project h2 {
    margin: 0 0 6px;
    font-size: 1.05rem;
  }

  .project p {
    margin: 0;
    color: var(--muted);
    line-height: 1.6;
  }

  .project a {
    color: var(--accent);
    text-decoration: none;
    font-size: 0.92rem;
  }
```

- [ ] **Step 2: Add the soloTow item to the home page project list**

In `src/views/pages/index.vto`, add this project as the first child inside `<section class="section">`:

```html
    <div class="project">
      <h2>soloTow</h2>
      <p>
        A portable paragliding self-tow winch built around simple assembly, remote control, and passive safety choices.
      </p>
      <a href="/projects/solotow">Read the project post</a>
    </div>
```

- [ ] **Step 3: Add the soloTow item to the projects page**

In `src/views/pages/projects.vto`, add this project as the first child inside `<section class="section">`:

```html
    <div class="project">
      <h2>soloTow</h2>
      <p>
        A portable paragliding self-tow winch built around simple assembly, remote control, pay-in failure behavior, and
        passive safety choices.
      </p>
      <a href="/projects/solotow">Read the project post</a>
    </div>
```

- [ ] **Step 4: Run all render tests**

Run:

```bash
npm test
```

Expected: PASS. The tests should confirm that the soloTow page renders, both project lists link to `/projects/solotow`, the page does not contain a visible soloTow GitHub link, and the obsolete `100+ successful tows` copy is absent.

- [ ] **Step 5: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit the listing updates**

```bash
git add src/views/pages/index.vto src/views/pages/projects.vto
git commit -m "Link soloTow from project lists"
```

## Task 4: Browser Verification

**Files:**
- Verify: `src/views/pages/solotow.vto`
- Verify: `src/views/pages/index.vto`
- Verify: `src/views/pages/projects.vto`

- [ ] **Step 1: Start the local dev server**

Run:

```bash
npm run dev
```

Expected: server prints `http://localhost:3000`.

- [ ] **Step 2: Open the soloTow page**

Open:

```text
http://localhost:3000/projects/solotow
```

Expected:

- Hero title reads `soloTow`.
- Hero image loads from `raw.githubusercontent.com`.
- Quick facts show `60 successful tows`, `650 ft average tow altitude`, `5 kW hub motor`, and `Heltec LoRa remote`.
- The page does not visibly say `case study`.
- The page does not show or link to the soloTow GitHub repository.
- Text and image do not overlap on desktop.

- [ ] **Step 3: Verify internal entry points**

Open:

```text
http://localhost:3000/
http://localhost:3000/projects
```

Expected:

- Both pages include a `soloTow` project item.
- Both `Read the project post` links navigate to `/projects/solotow`.

- [ ] **Step 4: Check mobile layout**

Resize the browser to a narrow mobile width around `390px`.

Expected:

- Hero image stacks below or above the text cleanly.
- Quick facts stack without text overflow.
- Section text remains readable and does not overlap.
- No horizontal scrolling appears.

- [ ] **Step 5: Stop the dev server**

Stop the running server with `Ctrl-C`.

- [ ] **Step 6: Final verification commands**

Run:

```bash
npm test
npm run build
git status --short
```

Expected:

- `npm test`: PASS.
- `npm run build`: PASS.
- `git status --short`: clean after commits.

## Self-Review

- Spec coverage: The plan covers the dedicated `/projects/solotow` route, story-driven technical post tone, hero image, quick facts, problem framing, build constraints, pay-in failure behavior, system architecture, remote safety, future improvements, buildability, field validation, safety caveat, home/projects links, and no visible soloTow GitHub link.
- Test coverage: Render tests cover required content, internal links, absence of the soloTow GitHub repo link, absence of `case study`, and absence of the old `100+ successful tows` claim. Browser verification covers layout and image rendering.
- Scope control: The plan does not add a nav link, does not duplicate the full bill of materials, and does not introduce a shared styling system.
