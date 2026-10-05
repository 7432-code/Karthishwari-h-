# ComicCraft — All Source Code

Every source/config file in this project is reproduced below.

# `.gitignore`

```text
node_modules/
.env
dist/
.DS_Store
*.log

```

# `README.md`

```markdown
# ComicCraft — AI Comic Story Creator

A full-stack Generative AI application that turns a user's idea into a multi-panel comic story and generated comic-panel images using Google Gemini models.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- AI: Google Gemini via `@google/genai`
- Styling: Plain CSS (responsive, no UI framework)
- Persistence: Browser localStorage for recent projects

## Main flow

1. User enters a title, genre, characters, setting, plot, art style, and panel count.
2. React sends the request to `POST /api/comic/generate`.
3. Express asks Gemini to create structured comic-panel descriptions.
4. Express generates an image for each panel with Gemini image generation.
5. The API returns the story plus base64 images.
6. React renders the comic and lets the user download individual panels or the complete story as JSON.

## Requirements

- Node.js 20+
- npm 10+
- A Gemini API key from Google AI Studio

## Quick start

### 1. Backend

```bash
cd backend
npm install
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Edit `.env`:

```env
GEMINI_API_KEY=your_key_here
PORT=5000
```

Start:

```bash
npm run dev
```

### 2. Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL shown by Vite, normally `http://localhost:5173`.

The frontend uses `/api` and Vite proxies that path to `http://localhost:5000`.

## Production build

```bash
cd frontend
npm run build
npm run preview
```

For a production deployment, deploy the frontend and backend separately or configure Express to serve the frontend `dist` folder.

## API

### GET `/api/health`

Returns service status.

### POST `/api/comic/generate`

Example body:

```json
{
  "title": "The Last Signal",
  "genre": "Sci-Fi",
  "characters": "Maya, a brave college student; Echo, a small AI robot",
  "setting": "A flooded Chennai in the near future",
  "plot": "Maya follows a mysterious radio signal that may save her neighborhood.",
  "style": "Cinematic graphic novel",
  "panelCount": 4
}
```

## Notes

Image generation consumes Gemini API quota. A 4-panel request can make multiple AI calls. Start with 3–4 panels while testing.

The app keeps the Gemini key only on the backend. Never put the key in `frontend/.env` or client-side JavaScript.

```

# `setup-windows.bat`

```bat
@echo off
echo Installing ComicCraft backend...
cd backend
call npm install
if not exist .env copy .env.example .env
cd ..\frontend
echo Installing ComicCraft frontend...
call npm install
cd ..
echo.
echo Setup complete.
echo 1. Edit backend\.env and add GEMINI_API_KEY
echo 2. Open Terminal 1: cd backend ^&^& npm run dev
echo 3. Open Terminal 2: cd frontend ^&^& npm run dev
pause

```

# `backend/.env.example`

```text
GEMINI_API_KEY=replace_with_your_gemini_api_key
PORT=5000

```

# `backend/README.md`

```markdown
# ComicCraft Backend

Run:

```bash
npm install
cp .env.example .env
npm run dev
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

```

# `backend/package.json`

```json
{
  "name": "comiccraft-backend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js"
  },
  "dependencies": {
    "@google/genai": "latest",
    "cors": "latest",
    "dotenv": "latest",
    "express": "latest"
  },
  "devDependencies": {
    "nodemon": "latest"
  }
}

```

# `backend/src/config.js`

```javascript
import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 5000),
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  storyModel: process.env.GEMINI_STORY_MODEL || "gemini-3.8-flash",
  imageModel: process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image"
};

export function assertConfig() {
  if (!config.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is missing. Add it to backend/.env.");
  }
}

```

# `backend/src/server.js`

```javascript
import express from "express";
import cors from "cors";
import { config } from "./config.js";
import comicRouter from "./routes/comic.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "ComicCraft API",
    time: new Date().toISOString()
  });
});

app.use("/api/comic", comicRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
});

app.listen(config.port, () => {
  console.log(`ComicCraft API running at http://localhost:${config.port}`);
});

```

# `backend/src/services/gemini.js`

```javascript
import { GoogleGenAI } from "@google/genai";
import { config, assertConfig } from "../config.js";

let client;

function getClient() {
  assertConfig();
  if (!client) {
    client = new GoogleGenAI({ apiKey: config.geminiApiKey });
  }
  return client;
}

function cleanJsonText(text) {
  if (!text) return "";
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function safeParseJson(text) {
  const cleaned = cleanJsonText(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Gemini returned invalid JSON.");
  }
}

export async function createComicPlan(input) {
  const ai = getClient();

  const panelCount = Math.min(8, Math.max(1, Number(input.panelCount || 4)));

  const prompt = `
You are the story director for ComicCraft, an AI comic creator.

Create a coherent ${panelCount}-panel comic from the user's idea.

USER INPUT
Title: ${input.title}
Genre: ${input.genre}
Characters: ${input.characters}
Setting: ${input.setting}
Plot: ${input.plot}
Visual style: ${input.style}

Rules:
- Keep character names and visual traits consistent across all panels.
- Give every panel a clear story purpose.
- Write concise dialogue suitable for speech bubbles.
- Include a short narration/caption only when useful.
- Describe camera angle, action, environment, lighting, and emotion.
- Do not add random characters unless necessary.
- Make the ending satisfying within the requested panel count.
- Return JSON only.

Required JSON shape:
{
  "title": "string",
  "logline": "string",
  "characters": [
    {
      "name": "string",
      "description": "string"
    }
  ],
  "panels": [
    {
      "number": 1,
      "caption": "string",
      "dialogue": [
        {"speaker": "string", "text": "string"}
      ],
      "visualPrompt": "string"
    }
  ]
}
`;

  const response = await ai.models.generateContent({
    model: config.storyModel,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          logline: { type: "string" },
          characters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" }
              },
              required: ["name", "description"]
            }
          },
          panels: {
            type: "array",
            items: {
              type: "object",
              properties: {
                number: { type: "integer" },
                caption: { type: "string" },
                dialogue: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      speaker: { type: "string" },
                      text: { type: "string" }
                    },
                    required: ["speaker", "text"]
                  }
                },
                visualPrompt: { type: "string" }
              },
              required: ["number", "caption", "dialogue", "visualPrompt"]
            }
          }
        },
        required: ["title", "logline", "characters", "panels"]
      }
    }
  });

  const plan = safeParseJson(response.text);
  plan.panels = Array.isArray(plan.panels) ? plan.panels.slice(0, panelCount) : [];

  if (!plan.panels.length) {
    throw new Error("Gemini did not create any comic panels.");
  }

  return plan;
}

export async function generatePanelImage({ panel, story, style }) {
  const ai = getClient();

  const prompt = `
Create ONE polished comic panel image.

Comic title: ${story.title}
Overall story: ${story.logline}
Art direction: ${style}

Character reference:
${(story.characters || [])
  .map((c) => `${c.name}: ${c.description}`)
  .join("\n")}

Panel ${panel.number}:
Caption: ${panel.caption || "None"}
Dialogue:
${(panel.dialogue || []).map((d) => `${d.speaker}: ${d.text}`).join("\n") || "None"}

Visual direction:
${panel.visualPrompt}

Image requirements:
- Landscape comic panel, 16:9 composition.
- Clear focal point and readable visual storytelling.
- Keep character appearance consistent with the reference descriptions.
- Professional graphic-novel/comic illustration.
- Leave sensible negative space where speech bubbles could be placed.
- Do not render captions or speech-bubble text inside the image; the web app will display dialogue separately.
- No watermarks, logos, UI, borders, or collage of multiple panels.
`;

  const interaction = await ai.interactions.create({
    model: config.imageModel,
    input: prompt,
    response_format: {
      type: "image",
      mime_type: "image/png",
      aspect_ratio: "16:9",
      image_size: "1K"
    }
  });

  if (interaction.output_image?.data) {
    return {
      mimeType: interaction.output_image.mime_type || "image/png",
      base64: interaction.output_image.data
    };
  }

  for (const step of interaction.steps || []) {
    if (step.type !== "model_output") continue;
    for (const block of step.content || []) {
      if (block.type === "image" && block.data) {
        return {
          mimeType: block.mime_type || "image/png",
          base64: block.data
        };
      }
    }
  }

  throw new Error(`Gemini did not return an image for panel ${panel.number}.`);
}

export async function generateComic(input, onProgress = () => {}) {
  const plan = await createComicPlan(input);

  const panels = [];
  for (let i = 0; i < plan.panels.length; i += 1) {
    const panel = plan.panels[i];
    onProgress({
      stage: "image",
      current: i + 1,
      total: plan.panels.length,
      message: `Generating panel ${i + 1} of ${plan.panels.length}...`
    });

    try {
      const image = await generatePanelImage({
        panel,
        story: plan,
        style: input.style
      });

      panels.push({ ...panel, image });
    } catch (error) {
      panels.push({
        ...panel,
        image: null,
        imageError: error.message || "Image generation failed."
      });
    }
  }

  return {
    ...plan,
    panels,
    createdAt: new Date().toISOString()
  };
}

```

# `backend/src/routes/comic.js`

```javascript
import { Router } from "express";
import { generateComic } from "../services/gemini.js";

const router = Router();

function validate(body) {
  const required = ["title", "genre", "characters", "setting", "plot", "style"];
  const missing = required.filter((key) => !String(body?.[key] || "").trim());

  if (missing.length) {
    return `Missing fields: ${missing.join(", ")}`;
  }

  const panelCount = Number(body.panelCount);
  if (!Number.isInteger(panelCount) || panelCount < 1 || panelCount > 8) {
    return "panelCount must be an integer from 1 to 8.";
  }

  return null;
}

router.post("/generate", async (req, res) => {
  const validationError = validate(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const comic = await generateComic(req.body);
    return res.json(comic);
  } catch (error) {
    console.error("Comic generation error:", error);
    return res.status(500).json({
      error: error?.message || "Unable to generate comic."
    });
  }
});

export default router;

```

# `frontend/index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0d1021" />
    <meta name="description" content="ComicCraft — AI Comic Story Creator" />
    <title>ComicCraft AI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

```

# `frontend/package.json`

```json
{
  "name": "comiccraft-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest"
  }
}

```

# `frontend/vite.config.js`

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true
      }
    }
  }
});

```

# `frontend/src/App.jsx`

```jsx
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Header from "./components/Header.jsx";
import StoryForm from "./components/StoryForm.jsx";
import Progress from "./components/Progress.jsx";
import ComicResult from "./components/ComicResult.jsx";
import { generateComic } from "./lib/api.js";

const STORAGE_KEY = "comiccraft-last-project";

export default function App() {
  const [comic, setComic] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (comic) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(comic));
      } catch {
        // Large images may exceed localStorage. The current result still works.
      }
    }
  }, [comic]);

  async function handleGenerate(payload) {
    setLoading(true);
    setError("");
    setStatus("Planning your comic...");
    setComic(null);

    try {
      const result = await generateComic(payload);
      setComic(result);
      setStatus("Comic created successfully.");
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setStatus("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <Header />

      <main className="container">
        <section className="hero">
          <div>
            <span className="hero-kicker">GENERATIVE AI PROJECT</span>
            <h1>Turn an idea into a <span>comic.</span></h1>
            <p>
              Write your characters and plot once. ComicCraft creates a structured
              story and illustrated panels with Gemini.
            </p>
          </div>
          <div className="hero-orb">
            <div>✦</div>
          </div>
        </section>

        <StoryForm onGenerate={handleGenerate} loading={loading} />

        <Progress loading={loading} text={status || "Generating..."} />

        {error && (
          <div className="alert error">
            <AlertCircle size={19} />
            <div>
              <strong>Generation failed</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {!error && !loading && status && (
          <div className="alert success">
            <CheckCircle2 size={19} />
            <span>{status}</span>
          </div>
        )}

        <ComicResult comic={comic} />
      </main>

      <footer>
        ComicCraft • Built with React, Express & Google Gemini
      </footer>
    </div>
  );
}

```

# `frontend/src/main.jsx`

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

```

# `frontend/src/styles.css`

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

:root {
  font-family: "DM Sans", system-ui, sans-serif;
  color: #f5f6ff;
  background: #080a15;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  --bg: #080a15;
  --surface: #111427;
  --surface-2: #171b31;
  --border: rgba(255,255,255,.09);
  --muted: #a7adc6;
  --text: #f5f6ff;
  --accent: #8b7cff;
  --accent-2: #5de2c2;
}

* { box-sizing: border-box; }
body { margin: 0; min-width: 320px; background: radial-gradient(circle at 20% 0%, #1a1640 0, transparent 32%), var(--bg); }
button, input, textarea, select { font: inherit; }
button { cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: .65; }

.app-shell { min-height: 100vh; }
.topbar {
  height: 74px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 5vw;
  backdrop-filter: blur(16px);
  background: rgba(8,10,21,.78);
  position: sticky;
  top: 0;
  z-index: 20;
}
.brand { display: flex; align-items: center; gap: 12px; }
.brand-icon {
  width: 42px; height: 42px; display: grid; place-items: center;
  border-radius: 12px; background: #25204d; color: #b8b0ff;
}
.brand-name { font-family: "Space Grotesk"; font-weight: 700; font-size: 19px; }
.brand-subtitle { font-size: 11px; color: var(--muted); margin-top: 2px; }
.ai-pill {
  display: flex; gap: 7px; align-items: center; border: 1px solid var(--border);
  background: rgba(255,255,255,.04); padding: 8px 12px; border-radius: 999px;
  color: #c8c4ff; font-size: 12px;
}

.container { width: min(1180px, 92vw); margin: auto; padding: 60px 0 80px; }
.hero {
  display: flex; align-items: center; justify-content: space-between; gap: 30px;
  margin-bottom: 40px;
}
.hero-kicker, .eyebrow {
  color: #8e86ff; letter-spacing: .14em; font-size: 11px; font-weight: 700;
}
.hero h1 {
  font-family: "Space Grotesk"; font-size: clamp(38px, 6vw, 68px); line-height: .98;
  margin: 12px 0 18px; max-width: 800px;
}
.hero h1 span { color: var(--accent-2); }
.hero p { max-width: 690px; color: var(--muted); font-size: 17px; line-height: 1.65; }
.hero-orb {
  width: 150px; height: 150px; flex: 0 0 150px; border-radius: 38px;
  display: grid; place-items: center; background: linear-gradient(135deg, #28215d, #173f45);
  border: 1px solid var(--border); box-shadow: 0 30px 80px rgba(80,70,200,.25);
}
.hero-orb div { font-size: 70px; color: #c4beff; transform: rotate(15deg); }

.form-card, .result-card, .empty-state, .progress-card, .alert {
  border: 1px solid var(--border); background: rgba(17,20,39,.88); border-radius: 24px;
}
.form-card { padding: 30px; }
.section-heading h2, .result-header h2 { font-family: "Space Grotesk"; margin: 6px 0; font-size: 28px; }
.section-heading p, .result-header p { color: var(--muted); margin: 8px 0 0; line-height: 1.6; }

.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 28px; }
label { display: flex; flex-direction: column; gap: 8px; }
label > span { font-size: 13px; color: #d9dcf0; font-weight: 600; }
.full { grid-column: 1 / -1; }
input, textarea, select {
  width: 100%; border: 1px solid var(--border); outline: none; color: var(--text);
  background: #0c0f20; border-radius: 13px; padding: 13px 14px;
  transition: border-color .2s, box-shadow .2s;
}
input:focus, textarea:focus, select:focus {
  border-color: #7468e8; box-shadow: 0 0 0 3px rgba(116,104,232,.13);
}
textarea { resize: vertical; min-height: 90px; }
select { appearance: auto; }

.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
.primary-button, .secondary-button, .download-panel {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border-radius: 12px; padding: 12px 16px; border: 1px solid var(--border);
}
.primary-button { background: #8b7cff; color: white; border: 0; font-weight: 700; }
.secondary-button { background: rgba(255,255,255,.05); color: #e8e9f5; }

.progress-card {
  margin-top: 18px; padding: 18px 20px; display: flex; align-items: center; gap: 14px;
}
.progress-card p { margin: 4px 0 0; color: var(--muted); font-size: 13px; }
.spinner {
  width: 24px; height: 24px; border: 3px solid #333752; border-top-color: #9a8fff;
  border-radius: 50%; animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.alert { margin-top: 18px; padding: 15px 18px; display: flex; gap: 12px; align-items: flex-start; }
.alert p { margin: 5px 0 0; color: var(--muted); font-size: 13px; }
.alert.error { color: #ff9eac; }
.alert.success { color: #75e6c8; align-items: center; }

.empty-state { margin-top: 24px; padding: 70px 20px; text-align: center; }
.empty-icon {
  width: 64px; height: 64px; margin: auto; border-radius: 18px; display: grid; place-items: center;
  color: #9f94ff; background: #211d45;
}
.empty-state h2 { font-family: "Space Grotesk"; margin: 20px 0 8px; }
.empty-state p { color: var(--muted); }

.result-card { margin-top: 24px; padding: 30px; }
.result-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
.character-strip { display: flex; flex-wrap: wrap; gap: 10px; margin: 24px 0; }
.character-chip {
  min-width: 190px; flex: 1; background: #0d1020; border: 1px solid var(--border);
  border-radius: 14px; padding: 12px;
}
.character-chip span { display: block; font-weight: 700; color: #ddd9ff; }
.character-chip small { display: block; color: var(--muted); line-height: 1.4; margin-top: 5px; }

.comic-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.comic-panel {
  overflow: hidden; border-radius: 18px; border: 1px solid var(--border); background: #0b0e1c;
  position: relative;
}
.comic-panel > img { width: 100%; aspect-ratio: 16 / 9; display: block; object-fit: cover; }
.panel-number {
  position: absolute; z-index: 2; top: 10px; left: 10px; background: rgba(0,0,0,.72);
  padding: 5px 8px; border-radius: 8px; font-size: 11px; font-weight: 700;
}
.image-fallback {
  aspect-ratio: 16 / 9; display: grid; place-items: center; text-align: center; padding: 20px;
  background: #15182a; color: #aeb4d0;
}
.image-fallback small { display: block; max-width: 80%; margin-top: 5px; color: #777e9d; }
.panel-copy { padding: 15px; }
.caption { margin: 0 0 10px; color: #d9dcf0; font-size: 14px; line-height: 1.5; }
.dialogue-list { display: grid; gap: 8px; }
.dialogue { display: flex; gap: 8px; color: #aeb4ce; font-size: 13px; }
.dialogue strong { color: #dedbff; margin-right: 5px; }
.dialogue span { color: #adb2ca; }
.download-panel {
  margin-top: 14px; background: transparent; color: #c7c2ff; padding: 8px 10px; font-size: 12px;
}
footer { border-top: 1px solid var(--border); padding: 25px; text-align: center; color: #747b99; font-size: 12px; }

@media (max-width: 800px) {
  .topbar { padding: 0 4vw; }
  .ai-pill { display: none; }
  .container { padding-top: 38px; }
  .hero { align-items: flex-start; }
  .hero-orb { display: none; }
  .field-grid, .comic-grid { grid-template-columns: 1fr; }
  .full { grid-column: auto; }
  .result-header { flex-direction: column; }
}

@media (max-width: 520px) {
  .form-card, .result-card { padding: 20px; border-radius: 18px; }
  .hero h1 { font-size: 42px; }
  .form-actions { flex-direction: column-reverse; }
  .form-actions button { width: 100%; }
}

```

# `frontend/src/components/ComicPanel.jsx`

```jsx
import { Download, MessageCircle } from "lucide-react";

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function ComicPanel({ panel }) {
  const dataUrl = panel.image
    ? `data:${panel.image.mimeType};base64,${panel.image.base64}`
    : null;

  return (
    <article className="comic-panel">
      <div className="panel-number">#{panel.number}</div>

      {dataUrl ? (
        <img src={dataUrl} alt={`Comic panel ${panel.number}`} />
      ) : (
        <div className="image-fallback">
          <span>Image unavailable</span>
          <small>{panel.imageError || "Try generating the comic again."}</small>
        </div>
      )}

      <div className="panel-copy">
        {panel.caption && <p className="caption">{panel.caption}</p>}

        {panel.dialogue?.length > 0 && (
          <div className="dialogue-list">
            {panel.dialogue.map((item, index) => (
              <div className="dialogue" key={`${item.speaker}-${index}`}>
                <MessageCircle size={15} />
                <div>
                  <strong>{item.speaker}</strong>
                  <span>{item.text}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {dataUrl && (
          <button
            className="download-panel"
            onClick={() => downloadDataUrl(dataUrl, `comiccraft-panel-${panel.number}.png`)}
          >
            <Download size={15} />
            Download panel
          </button>
        )}
      </div>
    </article>
  );
}

```

# `frontend/src/components/ComicResult.jsx`

```jsx
import { Download, FileJson, Sparkles } from "lucide-react";
import ComicPanel from "./ComicPanel.jsx";

export default function ComicResult({ comic }) {
  if (!comic) {
    return (
      <section className="empty-state">
        <div className="empty-icon"><Sparkles size={30} /></div>
        <h2>Your comic will appear here</h2>
        <p>Fill in the story form and click <strong>Create Comic</strong>.</p>
      </section>
    );
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(comic, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${comic.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "comic"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="result-card">
      <div className="result-header">
        <div>
          <span className="eyebrow">YOUR STORY</span>
          <h2>{comic.title}</h2>
          <p>{comic.logline}</p>
        </div>
        <button className="secondary-button" onClick={downloadJson}>
          <FileJson size={17} />
          Export JSON
        </button>
      </div>

      {comic.characters?.length > 0 && (
        <div className="character-strip">
          {comic.characters.map((character) => (
            <div className="character-chip" key={character.name}>
              <span>{character.name}</span>
              <small>{character.description}</small>
            </div>
          ))}
        </div>
      )}

      <div className="comic-grid">
        {comic.panels.map((panel) => (
          <ComicPanel key={panel.number} panel={panel} />
        ))}
      </div>
    </section>
  );
}

```

# `frontend/src/components/Header.jsx`

```jsx
import { Sparkles, BookOpen } from "lucide-react";

export default function Header() {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-icon"><BookOpen size={22} /></div>
        <div>
          <div className="brand-name">ComicCraft</div>
          <div className="brand-subtitle">AI Comic Story Creator</div>
        </div>
      </div>
      <div className="ai-pill">
        <Sparkles size={16} />
        Gemini Powered
      </div>
    </header>
  );
}

```

# `frontend/src/components/Progress.jsx`

```jsx
export default function Progress({ loading, text }) {
  if (!loading) return null;

  return (
    <div className="progress-card">
      <div className="spinner" />
      <div>
        <strong>ComicCraft is working</strong>
        <p>{text || "Writing your story and generating artwork..."}</p>
      </div>
    </div>
  );
}

```

# `frontend/src/components/StoryForm.jsx`

```jsx
import { useState } from "react";
import { WandSparkles, RotateCcw } from "lucide-react";

const initial = {
  title: "",
  genre: "Fantasy",
  characters: "",
  setting: "",
  plot: "",
  style: "Cinematic graphic novel",
  panelCount: 4
};

export default function StoryForm({ onGenerate, loading }) {
  const [form, setForm] = useState(initial);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onGenerate(form);
  }

  function reset() {
    setForm(initial);
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">CREATE</span>
          <h2>Build your comic</h2>
          <p>Describe your idea. Gemini will turn it into a story and illustrated panels.</p>
        </div>
      </div>

      <div className="field-grid">
        <label>
          <span>Comic title</span>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="The Last Signal"
            required
          />
        </label>

        <label>
          <span>Genre</span>
          <select value={form.genre} onChange={(e) => update("genre", e.target.value)}>
            <option>Fantasy</option>
            <option>Science Fiction</option>
            <option>Adventure</option>
            <option>Comedy</option>
            <option>Mystery</option>
            <option>Superhero</option>
            <option>Horror</option>
            <option>Romance</option>
            <option>Slice of Life</option>
          </select>
        </label>

        <label className="full">
          <span>Characters</span>
          <textarea
            value={form.characters}
            onChange={(e) => update("characters", e.target.value)}
            placeholder="Maya, a brave college student; Echo, a small AI robot"
            rows="3"
            required
          />
        </label>

        <label>
          <span>Setting</span>
          <input
            value={form.setting}
            onChange={(e) => update("setting", e.target.value)}
            placeholder="A flooded futuristic city"
            required
          />
        </label>

        <label>
          <span>Art style</span>
          <select value={form.style} onChange={(e) => update("style", e.target.value)}>
            <option>Cinematic graphic novel</option>
            <option>Anime-inspired comic</option>
            <option>Western superhero comic</option>
            <option>Watercolor storybook</option>
            <option>Dark noir comic</option>
            <option>Colorful cartoon</option>
            <option>Manga-inspired black and white</option>
          </select>
        </label>

        <label className="full">
          <span>Plot idea</span>
          <textarea
            value={form.plot}
            onChange={(e) => update("plot", e.target.value)}
            placeholder="A mysterious signal leads Maya to a hidden machine that can save her neighborhood..."
            rows="5"
            required
          />
        </label>

        <label>
          <span>Panels</span>
          <select
            value={form.panelCount}
            onChange={(e) => update("panelCount", Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>{n} panels</option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={reset} disabled={loading}>
          <RotateCcw size={17} />
          Reset
        </button>
        <button className="primary-button" type="submit" disabled={loading}>
          <WandSparkles size={18} />
          {loading ? "Creating..." : "Create Comic"}
        </button>
      </div>
    </form>
  );
}

```

# `frontend/src/lib/api.js`

```javascript
export async function generateComic(payload) {
  const response = await fetch("/api/comic/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Comic generation failed.");
  }

  return data;
}

export async function checkHealth() {
  const response = await fetch("/api/health");
  if (!response.ok) throw new Error("Backend is not reachable.");
  return response.json();
}

```
