# soloTow Project Post Design

## Context

The profile site is a small Express and Vento app with one route per page and page-local CSS. Existing project content is concise, but soloTow deserves a dedicated project post because it combines mechanical design, electronics, remote control, field testing, and safety-critical tradeoffs.

Source material comes from the public GitHub repository at `brian-greeson/soloTow`. The repo describes soloTow as an easy-to-assemble, inexpensive DIY winch for self-towing paragliders. It is still framed as a work in progress and includes strong warnings that paragliding and towing are dangerous, that the winch is not for inexperienced pilots, and that use is at the user's own risk.

## Audience

The primary audience is potential employers and collaborators evaluating Brian's engineering ability. The secondary audience is paragliding pilots interested in the DIY winch.

The page should therefore read like an engaging project blog post, not a resume entry and not a complete build manual. It should show engineering judgment through real constraints, design decisions, and field validation, while linking to GitHub for deeper build details.

## Tone

Use the GitHub source tone as the base: practical, direct, DIY-builder voice, with plain explanations and clear safety caveats. Polish the writing for the profile site, but avoid corporate or resume-coded labels such as "case study."

The post should be story-driven but technical. It should explain why the project exists, how the system is built, what tradeoffs mattered, and how it performed in real use.

## Page Structure

### Hero

Title the page `soloTow`.

Use a subtitle along the lines of:

> A portable paragliding self-tow winch built around simple assembly, remote control, and safe failure behavior.

Use the soloTow GitHub photo as the main visual:

`https://raw.githubusercontent.com/brian-greeson/soloTow/main/guide/IMG_1869.jpeg`

Show concise quick facts near the hero:

- Fully functional build
- 100+ successful tows
- 650 ft average tow altitude
- 5 kW hub motor
- Heltec LoRa remote

Do not call the page a "case study" in visible UI.

### Problem

Open with the practical flatlands problem in a story-driven way: pilots who do not live near launchable terrain often need a tow site, extra vehicle, extra operator, or an expensive payout winch. soloTow is a DIY attempt to make towing more portable and accessible.

Keep this section short and move quickly into the design constraints.

### Build Constraints

Explain that the hard part was not only making a winch that pulls. The hard part was making a system that could be assembled by competent builders without special fabrication, while avoiding unsafe remote-control failure modes.

Key constraints:

- Simple assembly
- Few custom parts
- Portable field setup
- Lower cost than commercial alternatives
- Remote control reliability at launch distance
- Safe defaults when pilot input or radio link is lost

### System Architecture

Describe the system at a high level:

- Aluminum extrusion frame
- 3D printed components
- Few custom manufactured parts
- 5 kW rated hub motor
- Kelly motor controller
- Battery-powered electric drive
- Tow drum and tow line
- Heltec LoRa dev boards for remote/control communication
- Handheld remote with deadman switch

This section should not duplicate the full GitHub bill of materials. It should explain the architecture and link readers to GitHub for the full build guide.

### Remote Safety

This is the main engineering section.

Explain the implemented safety behaviors:

- Deadman switch in the remote
- Timeout behavior when connection to the remote is lost
- Controller behavior that prevents stale remote commands from continuing indefinitely

Explain the RF tradeoff clearly:

At launch, the pilot may be low to the ground and roughly 1 km away from the winch. That is one of the most dangerous moments, but it is also when the RF link is weakest. The signal could disappear if occluded by clothing or harness. The timeout had to be tuned to fail safe when the remote connection was truly lost, without causing constant nuisance cutouts during launch setup.

Mention future improvement:

- A relay station to improve signal strength and reduce occlusion issues.

### Buildability

Explain the mechanical choices that made the project easier to reproduce:

- Aluminum extrusion for the frame
- Few custom parts
- 3D printed components where appropriate
- Off-the-shelf motor/controller/radio components

Frame this as an intentional engineering choice, not just convenience. The design should reduce special tooling and make failures easier to inspect and repair.

### Field Validation

Close with real-world validation:

- Fully functional
- More than 100 successful tows
- Average tow altitude around 650 ft

Make clear that this is a personal DIY project and not a commercial or beginner product.

### Links And Caveat

Include a link to the GitHub repository:

`https://github.com/brian-greeson/soloTow`

Include a safety caveat consistent with the README:

Paragliding and towing are dangerous. This project is not intended for inexperienced pilots, club/commercial towing, or use without proper instruction and judgment.

## Site Integration

Add a dedicated route at `/projects/solotow`, using the existing Express route and Vento page pattern.

Update the home page project list to include soloTow with a short project summary and internal link to the new page. Update the existing `/projects` page as well so both project listings stay consistent. Do not add a new nav link unless the implementation review finds that the page is otherwise too hard to discover; the home page project list is the primary entry point.

The new page should follow the current site's typography and restrained layout, while improving visual richness with the GitHub build photo.

## Visual Direction

Use the Engineering Memo-style layout from brainstorming, but make it feel like a project post:

- Text-forward hero with image beside it on desktop
- Stacked image and text on mobile
- Quick facts as compact metrics
- Clear section headings
- No nested card-heavy layout
- No marketing hero or decorative background

The design should feel like an engineer's field note: readable, direct, and visually grounded in the actual build.

## Verification

Implementation should be verified with:

- `npm run build`
- Local browser check of the new page on desktop and mobile widths
- Link checks for GitHub and internal navigation
- Visual check that the hero image loads and text does not overlap at mobile widths
