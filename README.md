# Canvas

Canvas is a browser based studio for making generative art with p5.js. Start with a written idea, one of 53 built in sketches, or your own photo. Adjust the result with live controls and export the finished work.

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
- Turns an uploaded photo into an editable poster with Echo, Duotone, and Mosaic treatments
- Keeps version history, Undo, and Redo in the browser
- Exports PNG, GIF, WebM video, and JavaScript source
- Saves work locally without requiring an account

Canvas is currently designed for screens at least 1024 pixels wide. Saved work stays in the current browser and is not synced to another device.

To make a photo poster, choose **Create from photo** in the template sidebar, upload a JPG, PNG, WebP, or GIF image, then use **Adjust** to change the treatment, title, colours, texture, and movement. For an animated GIF, Canvas uses its first frame. Image files are prepared and stored locally in this browser. They are not sent to the AI service. Photo prompting is not supported yet. Export the poster as PNG, GIF, or video.

## AI allowance

AI creation is limited to 10 submissions per network each UTC day, with a short burst limit of 3 submissions per minute. A submission can include up to two automatic repair attempts. Templates, manual controls, playback, history, and export do not use the AI allowance.

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

Artwork versions, prompts, generated code, and settings are stored in browser local storage. Uploaded poster images are stored separately in browser IndexedDB. Clearing site data removes both. Export work you want to keep. The photo poster's JavaScript view does not include the uploaded image.

Google Analytics is present on the public site. Canvas does not send prompt text, artwork code, or control values as custom analytics events.

## Current limits

- There are no accounts or cloud sync.
- Shared links and remix links are not implemented yet.
- Small screen editing is not supported yet.
- AI output can still be visually wrong even when the code runs.
- Some templates request microphone or webcam access when their features need it.

Built by [Tomi Abe Studio](https://studio.tomiabe.com).
