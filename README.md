# Canvas

Canvas is a browser based studio for making generative art with p5.js. Start with a written idea or one of 53 built in sketches, adjust the result with live controls, and export the finished work.

[Open Canvas](https://canvas.tomiabe.com/)

## Who it is for

Canvas is for artists, designers, students, creative coders, and anyone who wants to experiment with generative visuals. You can use it without writing code, but the generated JavaScript is always available if you want to inspect or reuse it.

It works well for:

- exploring visual ideas and motion studies
- making backgrounds, loops, textures, and abstract artwork
- learning how p5.js sketches are put together
- building a starting point for a larger creative coding project
- producing quick visual material for events, performances, or social posts

## What it does

- Creates original p5.js sketches from plain language prompts
- Refines the current artwork through follow up prompts
- Repairs many syntax and runtime errors automatically
- Provides controls for colour, movement, density, size, and other sketch settings
- Includes 53 templates across particles, physics, simulation, geometry, audio, image, and WebGL
- Keeps version history, Undo, and Redo in the browser
- Exports PNG, GIF, browser-supported video (WebM or MP4), and JavaScript source
- Shares a sketch as a remix link that opens a separate copy
- Saves work locally without requiring an account

Canvas works on phones and desktop screens. On a phone, create from a prompt or template, refine and adjust the live sketch, inspect or copy its code, browse history, and export or share it. Code editing remains a desktop tool. Saved history stays in the current browser and is not synced to another device.

## Interface design

The Wonder **Projects → Canvas** artboards are the visual reference for the mobile start and editor screens and the desktop editor. Shared interface colors are defined once in `src/index.css` as `canvas-*` Tailwind theme tokens; components use those tokens rather than inline hex values. Artwork palettes in `src/templates/` are sketch data and remain editable through the artwork controls.

## AI allowance

AI creation is limited to 10 submissions per network each UTC day, with a short burst limit of 3 submissions per minute. A submission can include up to two automatic repair attempts. Templates, manual controls, playback, history, and export do not use the AI allowance.

## Accounts, saved sketches and gallery

Canvas has four additional routes: `/gallery`, `/sketches`, `/submit`, and `/moderation` (curators only). Sign in at `/signin`. Saved sketches, gallery submissions and approvals are stored in Cloudflare D1 (`canvas-data`), and sessions are signed cookies.

OAuth buttons for Google, Apple and Yahoo are shown but not configured yet. For development, sign in with a name and email using the local account form. To give an account curator access, set its `role` to `curator` in D1.

The Worker schema lives in `worker/src/schema.sql`.

## Run it locally

You need Node.js 22 or a compatible recent Node.js release.

```bash
npm ci
npm run dev
```

The frontend uses the deployed Canvas worker by default. To use another worker, copy `.env.example` to `.env.local` and set `GROQ_PROXY_URL`.

Run the checks with:

```bash
npm test
npm run lint
npm run build
```

## Run the worker locally

The worker handles AI providers, request limits, and automatic fallback. It runs on Cloudflare Workers and uses a Durable Object for quotas.

```bash
cd worker
npm install
npx wrangler dev
```

Copy `worker/.dev.vars.example` to `worker/.dev.vars` and add at least one provider key if you want to test AI generation locally. Provider keys stay in the worker and are never sent to the browser.

## Project layout

```text
src/                 React app, p5.js templates, generation, and browser storage
worker/              Cloudflare Worker, provider routing, and quota handling
scripts/             Saved AI evaluation tools
docs/                Product notes and evaluation results
.github/workflows/   Frontend and worker deployment
```

## Storage and privacy

Artwork versions, prompts, generated code, and settings are stored in browser local storage. Clearing site data removes them. Export work you want to keep.

Google Analytics is present on the public site. Canvas does not send prompt text, artwork code, or control values as custom analytics events.
It records categorical generation, export, and sharing outcomes, plus optional "matched my idea" feedback. Remix links contain sketch code and settings in the URL fragment; anyone you give a link can open a copy.

## Current limits

- There are no accounts or cloud sync.
- Remix links depend on browser URL limits; very large sketches must be shared as source files.
- Mobile code inspection and copying are supported; direct code editing is on desktop.
- AI output can still be visually wrong even when the code runs.
- Some templates request microphone or webcam access when their features need it.

Built by [Tomi Abe Studio](https://studio.tomiabe.com).
