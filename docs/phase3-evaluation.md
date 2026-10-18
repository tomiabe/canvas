# Phase 3 direct-provider evaluation

Executed 2026-10-16 in the orb: **32 distinct prompts / 32 API attempts**, eight per configured model, concurrency two, 15-second request deadline, no retries. All three environment keys were present; no keys were logged. No app/worker edits, deployment, or push.

## Observed results

| Configured model | API output | App schema + JS compile | Actual p5 runtime | Request latency |
|---|---:|---:|---:|---|
| `gemini-flash-lite-latest` | 8/8 HTTP 200 | 6/8 | 6/6 accepted sketches ran | 1.967-3.709 s; median 3.160 s |
| `gemini-flash-latest` | 0/8 | not testable | not testable | Seven 429s: 94-390 ms; one 15.002 s timeout |
| Groq `llama-3.3-70b-versatile` | 0/8 | not testable | not testable | Eight 404s: 33-93 ms |
| OpenRouter `meta-llama/llama-3.3-70b-instruct:free` | 0/8 | not testable | not testable | Eight 401s: 20-123 ms |

- Gemini Flash: seven quota-exhausted responses identify the alias target as `gemini-3.8-flash`, with a 20-request free-tier daily quota already exhausted. One request timed out. This is not evidence of poor sketch quality or global model unavailability.
- Groq: all eight responses say model does not exist **or** this account lacks access (`model_not_found`). Cannot distinguish those causes from these responses.
- OpenRouter: all eight say `User not found.` Authentication blocks any conclusion about model availability or output quality. The exact configured model was actually requested, not inferred unavailable.
- Lite: seven strict JSON responses; the WEBGL mountain response had an invalid JSON escape (position 69). The seasonal tree returned nine controls and was rejected by the actual app's 1-8-control schema (the system asks for 3-6). Six responses passed the actual app validator, including `new Function('params', code)` syntax compilation.

## What runtime means here

The script captures the **actual system prompt** from `generateConfigFromPrompt`, sends direct requests with the worker's exact model names, temperature 0.8, 4096-token budget and provider-specific JSON/thinking settings, and then feeds saved responses through the real app validator. The captured system prompt and full outputs are preserved in the JSON evidence.

The accepted sketches were rendered using the real `generateHtml`/custom-sketch wrapper, p5 **1.9.0** and p5.sound in Chromium, inside same-origin srcdoc iframes at 780×560 CSS pixels / DPR 2. A secure blanked `https://example.com` page hosts the scratch harness; it is not the Canvas app UI. All six created 1560×1120 backing canvases, advanced **62-176 frames**, and reported **zero sketch errors** during the roughly 2.5-second observation window. None needed explicit p5 bootstrap. This is actual execution, not merely syntax checking.

An initial `about:blank` harness produced no canvas because p5.sound needs a secure-context AudioWorklet; moving the harness to HTTPS resolved that environmental problem. Those exploratory runs made **no additional provider calls** and are not counted as model failures. Replay uses `--runtime-only`.

**Not exercised:** live control mutation, every control's visible effect, mouse interaction, resizing, visual fidelity to the prompt, frame-rate quality, editing/preservation requests, export, worker routing/CORS, or long-running stability. No claim of visual correctness or control correctness follows from this smoke test. Rejected responses were not repaired or executed.

## Recommendation and costs

For **these credentials at this time**, Lite is the only empirically usable configured model and should precede quota-blocked Flash. Keep Flash conditional on restored quota rather than adding its possible 15-second wait ahead of working Lite. Groq and OpenRouter should not be relied on until model access and credentials respectively are repaired. There is **no defensible quality ordering among the three blocked models**; assigning them places 2-4 would confuse account availability with quality. Workers AI was outside this assignment and was not tested.

Lite reported **9,980 input + 9,838 output tokens** across eight requests. No dollar amount or billing tier was independently verified, and aliases can change targets/pricing. The `:free` suffix does not prove authenticated availability or zero account cost; all its requests failed authentication. Failed requests and the aborted Flash request may still consume quota or incur provider-side work; this script cannot establish billed cost. Request timings include full response-body parsing and exclude browser startup/runtime checks.

The 32 prompts cover biological motion, fluids/cells, WEBGL, recursion, typography, mouse interaction, geometric design and chaotic/orbital systems. Each model receives eight different prompts in those categories: this is a diversity/availability smoke test, **not a paired statistical quality benchmark**.

## Reproduce / evidence

- `npx tsx scripts/evaluate-ai.ts` - makes 32 quota/possibly billable calls with environment keys.
- `npx tsx scripts/evaluate-ai.ts --runtime-only` - revalidates saved responses and replays browser checks without provider API calls.
- `docs/phase3-evaluation.json` - per-request prompt, model, status/error, latency, usage, raw output, validation outcome, and browser execution results.
- `scripts/evaluation-prompts.json` - reusable prompt fixture (columns correspond to Flash, Lite, Groq, OpenRouter).

Verification: both evaluation and secure-context runtime replay exited successfully; all 32 request records and six successful browser execution records are present. No application build/test was needed for these standalone evaluation additions.

## Follow-up: repairs, current models and guarded previews

`npx tsx scripts/evaluate-repair.ts` made 34 sequential Lite requests across 30 prompts using the real application prompt, validator and repair context. The alias reported `gemini-3.5-flash-lite`. Before adding loop limits, **27/30 passed first try; 29/30 passed after at most two repairs**. Runtime used opaque-origin sandboxed iframes, completed-draw readiness and a two-second observation window. Evidence: `phase3-repair-evaluation.json`. Usage was 47,389 input and 46,376 output tokens; billed dollars were not verified.

The successful repairs addressed an undefined p5 `octahedron` call and a generic script error. Kinetic typography repeatedly returned nine controls despite the eight-control maximum; it failed all three attempts. The validator now supplies the actual control count in the repair error rather than the original generic incomplete-output message. That improvement was not used to retroactively increase the score.

Groq's authenticated `/models` endpoint returned HTTP 200 and listed `openai/gpt-oss-120b`, not the old Llama model. `npx tsx scripts/evaluate-repair.ts --groq` tested that available model at low reasoning effort on eight overlapping prompts: **4/8 first try, 5/8 after repair**, 13 total requests. Two cases encountered HTTP 429. An ink sketch contained `for(let i=0;i=params.plumeCount;i++)`, an assignment instead of a comparison, and timed out all three browser attempts. This was a real preview freeze, not a normal reported JavaScript exception. Evidence: `phase3-groq-evaluation.json`. It justifies updating the obsolete model ID, not promoting Groq above the more extensively tested Lite. Subsequent prompts did execute; browser timeouts are not counted as passes.

That freeze motivated AST-based 100ms loop limits for generated previews. The exact saved ink response now emits a loop error, the app remains responsive, the previous artwork stays visible, and the error reaches the repair request. Ordinary nested/labeled loops and repeated frames are covered by regression tests. Generated code now runs without same-origin privileges; curated media templates retain existing permissions. This is protection against accidental ordinary runaway loops, not comprehensive resource isolation or a security guarantee against deliberately hostile code.

`npx tsx scripts/evaluate-repair.ts --replay` then replayed each of the 30 final saved Lite responses with the **current loop guard**, without more API calls or repair attempts: **28/30 (93.3%) passed**. The additional rejection was a heavy reaction-diffusion loop exceeding 100ms. Evidence: `phase3-guard-replay.json`. This lower final replay result is the relevant safety-enabled score; the earlier 29/30 is historical. It is not a second independent sample, and it does not establish a universal 93% success rate.

Final routing choice: Lite → Flash → Groq GPT-OSS → Workers AI → OpenRouter. Flash remains quota-dependent; OpenRouter's `/key` check also returned HTTP 401, so paid-model comparisons remain blocked. Workers AI was not reevaluated. No cost or quality ranking is claimed for unavailable providers.

UI checks used saved real model outputs and deterministic failures, not live requests for every interaction. Observed: runtime-error repair includes failed code/error, exactly three attempts for persistent failures, one attempt for a service outage, Retry, cancellation with late-result suppression, and a preserved iframe while replacements fail. Screenshots and an interaction recording are in `.amp/in/artifacts/phase3-*`. Syntax/schema checks, `npm test`, TypeScript and Vite build validate the local changes. The build reports a non-fatal bundle-size warning after adding the parser.

Neither evaluation scores visual fidelity, blank pixels, every control's effect, export/media permissions, nor long-running performance. The two-second runtime window can miss later problems. No push, deployment, production secret update, or production write was made.
