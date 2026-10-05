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
