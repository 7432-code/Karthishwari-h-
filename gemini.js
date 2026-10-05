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
