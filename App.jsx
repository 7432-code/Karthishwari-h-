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
