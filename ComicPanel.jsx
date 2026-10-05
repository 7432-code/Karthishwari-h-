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
