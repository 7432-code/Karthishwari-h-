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
