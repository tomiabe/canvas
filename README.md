# Canvas

No-code generative art playground — type a prompt and AI writes the p5.js sketch for you. Browse templates, adjust parameters live, and copy the generated code.

**Features**

- Gallery of generative art templates to start from
- AI-powered text-to-sketch: describe what you want, get a working p5.js sketch
- Live canvas preview with tweakable parameters
- Code viewer — inspect or copy the generated sketch
- Conversational refinement with the current code and recent prompts as context
- Browser-local autosave, Undo/Redo, and a History panel for restoring earlier versions

Work is saved in this browser only, not synced to an account. Restoring an older version and editing it keeps the other versions in History. Clicking the Canvas brand starts a blank artwork without deleting saved versions. Export anything important before clearing browser data; storage failures show a warning rather than silently discarding work.

## Run Locally

**Prerequisites:** Node.js 18+, a [Gemini API key](https://aistudio.google.com) (free)

```bash
npm install
# copy .env.example → .env.local and add your GEMINI_API_KEY
npm run dev
```

---

Built by [Tomi Abe Studio](https://studio.tomiabe.com)
