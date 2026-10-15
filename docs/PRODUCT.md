# Canvas — Product Brief and Build Plan

## Product brief

**One line:** Describe a piece of generative art or animation in plain words, see it running in seconds, and keep shaping it until it's yours — no code required.

**Who it's for:** Designers, artists, VJs, and curious people who are drawn to creative coding (p5.js, Processing) but don't want to learn a programming language to make something.

**The problem:** p5.js is the standard tool for web-based generative art, but it requires code. General-purpose AI assistants (ChatGPT, Claude, Cursor, Codex) can write a sketch, but the user still has to paste code into an editor, read errors, fix them, and re-prompt for every small change. That loop is where non-coders give up.

**What Canvas does differently:** The code is an implementation detail. Canvas owns the whole creative loop:

1. **Prompt → running art.** Type an idea; a sketch appears in the live canvas.
2. **It fixes itself.** Runtime errors go back to the model and are repaired automatically. The user never sees broken code unless they open the code view.
3. **Sliders, not syntax.** The AI declares the values worth tweaking (speed, palette, density, size). Canvas turns them into controls, so refinement is dragging, not re-prompting.
4. **Edit by conversation.** "Slower." "More pink." "Make the particles follow the mouse." Each turn edits the current sketch; every version is kept and can be restored.
5. **Ready to share.** Export PNG, GIF, or video, download the p5.js source, or share a link others can open and remix.

**What it is not:** Not a code editor (the p5 web editor already exists), not a template picker, and not a general coding agent.

**Role of templates:** The 50 existing templates become curated starting points and style examples for the model — a "remix this" gallery — rather than the main way to make something.

**Success looks like:** A first-time visitor types one sentence and has an animated sketch they like, tweak it with sliders, and export or share it within two minutes, without seeing an error or a line of code.

## Initial baseline (before Phases 1–2)

- The AI is secondary: the prompt bar only appears after a template is chosen (`src/App.tsx`), and onboarding says "Pick a template" first (`src/components/CanvasRunner.tsx`).
- The AI mostly selects a template and sets its params (`src/lib/ai.ts`). Writing real code (`custom-sketch`) is a fallback, capped at ~120 lines, with no tunable params.
- Each prompt is a single request with no conversation history; follow-up edits only see the current template params.
- Sketch errors are caught and shown ("Try regenerating…"), but not repaired.
- Generation runs through a Cloudflare worker that falls back across free models (Gemini Flash → Workers AI Llama → Groq → OpenRouter). Quality varies with whichever model answers.
- The preview iframe uses `sandbox="allow-scripts allow-same-origin …"` on AI-written code, which gives that code access to the parent page. That must change before sharing other people's sketches.
- PNG, GIF, and WebM export already exist.

## Build plan

Each phase ships something usable on its own. Do them in order.

### Phase 1 — Make the prompt the front door

- Show a prominent prompt box on the empty canvas, so prompting works with no template selected. Keep the template gallery as "or start from an example".
- Rewrite onboarding copy around "describe → tweak → export".
- Add a few one-click example prompts ("ink drops spreading in water", "neon rain on a dark city", "flower made of rotating circles").

**Done when:** a new visitor can generate a sketch without touching the gallery.

**Status:** Done (2026-10-15). The empty canvas shows a centered prompt with six example prompts; the Getting Started panel starts closed.

### Phase 2 — AI writes the sketch and declares its controls

- Make code generation the default path. Templates are passed to the model as optional references, not as the required output.
- Define one response contract: `{ title, code, params: ParamDef[] }`, where the code reads its tunable values from a `params` object (e.g. `params.speed`) instead of hard-coding them.
- Render AI-declared params in the existing `ControlPanel`, and live-update them in the running sketch through the existing `params-update` postMessage path (as `supportsLiveParams` templates already do), so dragging doesn't restart the sketch.
- Raise the code length limit and drop the "no comments, under 120 lines" constraint once a stronger model is in place (Phase 3).
- Validate the response (code present, param defaults within min/max, valid hex colours) before running it.

**Done when:** "a swirling galaxy of particles" produces a custom sketch with 3–6 working controls.

**Status:** Done. Prompts now return original code, a title, and validated control definitions (numbers, hex colours, toggles, and dropdowns). Adjust opens automatically. Changes are delivered to the running sketch without reloading; new code and seed changes still restart it. Follow-up prompts include the current code and control values. Copy/JS export includes the current values and runtime initialization. All 50 curated templates remain available.

The 120-line/no-comments restriction is removed; the existing 4096-token response budget remains until Phase 3's model evaluation. Schema and syntax checks reject malformed output before it replaces the current artwork; they do not prove the artwork is visually correct or every generated control is used correctly. Runtime error repair is still Phase 3.

Verification: `npm test` covers generation validation and live values in exported sketches; `npm run lint` and `npm run build` check types and production output. Real worker/browser checks covered galaxy generation, speed/density/colour changes without a reload, a follow-up edit, manual code editing, JS download, and the existing Noise Flow Field template.

### Phase 3 — Self-repair and reliable models

- When the iframe reports `sketch-error` (or draws nothing within ~2s), send the code and error back to the model for a fix. Retry up to 2 times, showing "Fixing…" instead of an error.
- Choose a primary model that is good at code and keep free models as fallbacks only. Record which model answered so quality can be compared.
- Add a small eval set (~30 prompts) and track the share that runs without errors on the first try and after repair.

**Done when:** at least 90% of the eval prompts produce a running sketch with no user-visible error.

### Phase 4 — Conversation and versions

- Keep a per-sketch conversation: send prior turns plus the current code with each edit request, so "slower" or "add a trail" edits the existing sketch.
- Store every version (prompt, code, params, seed) in `localStorage`, with undo/redo and a version list to restore from.
- Add "variations": generate 3 alternatives for the same prompt and let the user pick one.

**Done when:** a user can make five successive conversational edits and step back to any of them.

### Phase 5 — Export and share

- Polish existing exports (PNG, GIF, WebM) and add "download as standalone HTML" and "open in the p5.js web editor".
- Shareable links: compress the sketch into the URL fragment (see Decisions); no server storage.
- Before running shared sketches, remove `allow-same-origin` from the preview iframe (or serve sketches from a separate origin) so other people's code can't touch the app.
- Remix: opening a shared link loads its prompt, code, and controls as a new editable sketch.

**Done when:** someone can share a link, and another person can open, tweak, and re-share it safely.

### Later (only after Phases 1–5)

- Public gallery of shared sketches.
- Audio-reactive and webcam inputs as first-class prompt options.
- Accounts and cloud sync.

## Decisions

- **Models:** Use the Gemini, OpenRouter, and Groq keys the owner provides; no user-supplied keys. Gemini is primary, with thinking enabled (the worker currently sets `thinkingBudget: 0`, which hurts code quality). Fallbacks, in order: OpenRouter with a strong paid coding model (not a `:free` model), then Groq for speed, then Workers AI. Confirm exact model IDs with the Phase 3 eval set.
- **Shared sketch storage:** URL-only. Compress the sketch (prompt, code, params, seed) into the URL fragment (`#…`), so it never reaches a server, needs no storage or abuse limits, and works on GitHub Pages. Add KV storage only if real sketches outgrow practical URL lengths.
- **Templates:** Keep all 50, as the "start from an example" gallery and as references for the model.

## AI worker

- Deployed as the `canvas` Worker at `https://canvas.tomi.workers.dev` (the frontend default). Deploy with `cd worker && npx wrangler deploy`.
- Provider keys come from repository secrets; the deploy workflow copies them into the Worker. Providers without a key are skipped. Workers AI (Llama) often returns invalid JSON for sketch code, so it should only answer when every Gemini model fails. Responses include a `provider` field; `gemini` is Flash, `gemini-lite` is Flash-Lite (used when Flash is overloaded); anything else means Gemini was skipped or failed.
- The OpenRouter key is on the free tier with no credits, so paid OpenRouter fallback models need credits first.
