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

**Status:** Implemented locally. An initial 30-prompt Flash-Lite run rendered 27/30 on the first attempt and 29/30 after at most two repairs (34 API calls). Replaying the final saved outputs with the added loop limits passed 28/30 (93.3%); a heavy reaction-diffusion sketch was additionally rejected. The guarded replay made no additional API calls or repair attempts. These are short runtime smoke tests, not visual-fidelity or every-control correctness scores. See `docs/phase3-evaluation.md` and the JSON evidence for provider availability and limitations.

Replacements run in a hidden, full-size preview before replacing the current artwork. Readiness requires a completed draw with a canvas, followed by two seconds without reported errors; CDN loading has a separate 15-second deadline. Syntax/schema failures and runtime errors send the failed output/code and error back for at most two repairs. Service outages offer Retry without wasting repair attempts. Cancel, template changes and newer requests invalidate stale results. Later runtime errors can also consume the remaining repair budget and restore the previous configuration.

Generated previews now use opaque-origin sandboxes; curated media templates retain their existing permissions. Generated loops have per-invocation 100ms limits to turn accidental infinite loops into repairable errors. These limits do not provide full resource isolation: recursion, dynamic code, large allocations, and expensive built-ins are not comprehensively bounded. A canvas can still be visually blank or aesthetically wrong despite completing draw. No persistence or version-history UI is added in this phase.

### Phase 4 — Conversation and versions

- Keep a per-sketch conversation: send prior turns plus the current code with each edit request, so "slower" or "add a trail" edits the existing sketch.
- Store every version (prompt, code, params, seed) in `localStorage`, with undo/redo and a version list to restore from.
- Add "variations": generate 3 alternatives for the same prompt and let the user pick one.

**Done when:** a user can make five successive conversational edits and step back to any of them.

**Status:** Core conversation and versioning implemented locally (2026-10-16). Three-way variations are deferred, rather than included in this delivery.

Successful generations, manual code edits, parameter changes, and seeds are autosaved with their prompt/conversation context. Undo/Redo and History restore the complete snapshot, including conversation. Branching clears Redo but preserves every archived version. Continuous edits to the same control/code within 700ms are grouped into one Undo step; a different control starts another. Choosing another template or clicking Canvas starts a new conversation; the brand returns to the blank prompt without deleting the archive.

Requests include the last six conversation exchanges plus authoritative current code and live values; the full conversation remains in browser storage. Failed staged generations do not create versions. A later runtime failure marks the accepted version as failed and restores the previous complete version before repair, without duplicating the prompt in conversation. Unreadable saved data is left untouched; quota/access failures show a visible warning. There is no cloud sync, arbitrary history cap, or automatic pruning.

Verification: `npm test` covers persistence, five edits, branching, Undo/Redo, edit grouping, late failures, and malformed/unavailable storage. Real browser checks against the deployed AI Worker completed an initial sketch plus five successive edits via Gemini Flash-Lite, then reload and Undo/Redo retained the same seed and matching conversation. Additional dev-only API fixtures checked restoration before branching, a late iframe failure followed by repair, and service failure without a new version. Browser checks also exercised keyboard shortcuts, brand navigation without losing history, corrupted storage, and quota warnings. The History overlay fits a 390px Chromium viewport; that is not a full mobile/touch editor verification.

### Branding and discovery

The document title is Canvas, with a description, canonical URL, Open Graph and large-image Twitter metadata for the GitHub Pages frontend at `https://canvas.tomiabe.com/`. Production assets use the domain root (`/`), not the former `/canvas/` project subpath. The AI Worker allows this HTTPS origin alongside the existing development and GitHub Pages origins.

Public assets include a 1200×630 OG image based on a clean first-open screenshot, a dark gradient and white Canvas title, plus SVG/PNG Palette favicons matching the app brand. Metadata is in the initial HTML so social crawlers do not need JavaScript. The Worker URL is the AI API, not the canonical site URL.

Mobile recommendation: keep Canvas web-based and desktop-first, but give phones a dedicated prompt/preview layout with template/adjust panels as drawers or sheets. The current fixed template/inspector sidebars still need that separate responsive pass; a native app is not required.

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

- **Models:** Use the owner's provider keys; no visitor-supplied keys. The chosen order is Flash-Lite first, then Flash when quota permits, Groq `openai/gpt-oss-120b` at low reasoning effort, Workers AI, and OpenRouter last. Lite passed 28/30 final-output replays with loop limits; Groq is only a fallback, with a smaller and less reliable sample. The old Groq model is no longer listed for this account. OpenRouter authentication currently fails; a paid fallback cannot be evaluated until that credential is repaired. Do not infer a quality advantage from enabling thinking without a comparative test.
- **Shared sketch storage:** URL-only. Compress the sketch (prompt, code, params, seed) into the URL fragment (`#…`), so it never reaches a server, needs no storage or abuse limits, and works on GitHub Pages. Add KV storage only if real sketches outgrow practical URL lengths.
- **Templates:** Keep all 50, as the "start from an example" gallery and as references for the model.

## AI worker

- Deployed as the `canvas` Worker at `https://canvas.tomi.workers.dev` (the frontend default). Deploy with `cd worker && npx wrangler deploy`.
- Provider keys come from repository secrets; the deploy workflow copies them into the Worker. Providers without a key are skipped. Responses include a `provider` field, retained with generated artwork metadata; `gemini` is Flash and `gemini-lite` is Flash-Lite. Worker routing changes remain local until pushed and deployed.
- The orb's OpenRouter credential returned HTTP 401 (`User not found`) during Phase 3. Its current balance and paid-model access are unverified. Never paste replacement credentials into chat.
