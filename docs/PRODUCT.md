# Canvas product notes

## Purpose

Canvas makes generative art easier to start and easier to edit. A person can describe an idea, see a running p5.js sketch, change its settings, and export it without setting up a coding environment.

The code is still available. Canvas hides it when it is not needed and exposes it when someone wants to learn from it or continue elsewhere.

## Audience

- Artists and designers testing visual ideas
- Students learning creative coding
- VJs and event makers producing loops and motion studies
- Developers looking for a p5.js starting point
- People who enjoy generative art but do not want to begin with code

## Current product

People can start from a prompt or browse 53 templates. AI generated sketches include editable controls and can use the approved brush and grain libraries. Follow up prompts can refine the current artwork or start a separate one.

Canvas stages generated code before replacing the current artwork. It checks the response shape and JavaScript syntax, runs the sketch in a restricted preview, and can request up to two repairs when an error occurs.

Accepted work is saved to local browser storage. History, Undo, and Redo restore the full sketch, its settings, seed, and recent conversation context. Starting a new artwork does not remove older versions.

Exports include PNG, GIF, browser-supported WebM or MP4 video, and JavaScript source. The phone layout supports prompting, refinement, live controls, template search, history, code inspection, export, and sharing. Direct code editing is available on desktop.

The gallery uses one searchable list with a category filter; Surprise me is part of that list. Sharing encodes a validated sketch in the URL fragment. Opening it creates a new local history version, so a recipient can remix without an account or server storage.

## AI service

The frontend sends generation requests to a Cloudflare Worker at `https://canvas.tomi.workers.dev`. The worker manages provider fallback and request limits. Provider keys stay on the worker.

Anonymous use is limited to 10 submissions per network each UTC day and 3 submissions per rolling minute. The worker also has a global provider attempt ceiling. Manual editing, templates, playback, and export remain available when the AI allowance is exhausted.

## Safety boundaries

Generated sketches run in an iframe without same origin access. Curated templates can request extra browser permissions for features such as audio or video input.

Runtime guards catch many common mistakes, but they are not complete resource isolation. A sketch can run successfully and still be blank, slow, or visually poor.

After a generated sketch appears, a person can mark whether it matched their idea. Aggregate analytics record that answer, generation outcomes, and export success or failure. These signals measure useful results beyond syntax validity, but they do not replace visual review. The sketch's prompt, code, and control values are not sent as analytics parameters.

## Storage

There are no user accounts or cloud storage. Prompts, code, settings, and version history stay in browser local storage. Clearing site data removes them.

## Next work

- Add standalone HTML export and p5.js editor handoff
- Add optional accounts only if cross device sync becomes necessary

## Release checks

Before a release:

```bash
npm ci
npm test
npm run lint
npm run build
```

Deploy worker changes before frontend changes that depend on a new worker contract. The frontend and worker have separate GitHub Actions workflows.
