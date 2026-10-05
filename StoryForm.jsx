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
