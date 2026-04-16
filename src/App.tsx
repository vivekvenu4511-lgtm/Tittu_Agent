import { useState, useEffect } from "react";
import "./index.css";

// Simple placeholder UI – will be replaced by the full layout later
function App() {
  const [theme, setTheme] = useState<"golden" | "sage" | "pastel" | "ocean">(
    "golden",
  );
  const [font, setFont] = useState<"inter" | "libre" | "source" | "ibm">(
    "inter",
  );

  // Apply CSS variables for theme & font whenever they change
  useEffect(() => {
    const root = document.documentElement;
    // Theme palettes (primary, accent, background)
    const themes: Record<
      string,
      { primary: string; accent: string; bg: string }
    > = {
      golden: { primary: "#E7B33B", accent: "#6A4C93", bg: "#FFFFFF" },
      sage: { primary: "#8FAE7F", accent: "#3B4D61", bg: "#F4FAF8" },
      pastel: { primary: "#F6C1C0", accent: "#6C5B7B", bg: "#FFFFFF" },
      ocean: { primary: "#2A7F9F", accent: "#EF476F", bg: "#F0F5F9" },
    };
    const fonts: Record<string, string> = {
      inter: `'Inter', sans-serif`,
      libre: `'Libre Franklin', sans-serif`,
      source: `'Source Sans Pro', sans-serif`,
      ibm: `'IBM Plex Sans', sans-serif`,
    };
    const t = themes[theme];
    root.style.setProperty("--color-primary", t.primary);
    root.style.setProperty("--color-accent", t.accent);
    root.style.setProperty("--color-bg", t.bg);
    root.style.setProperty("--font-sans", fonts[font]);
  }, [theme, font]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-primary)] font-[var(--font-sans)] p-4">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tittu Agent</h1>
        <div className="flex gap-4">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as typeof theme)}
            className="rounded p-1"
          >
            <option value="golden">Golden Dawn</option>
            <option value="sage">Sage Calm</option>
            <option value="pastel">Pastel Breeze</option>
            <option value="ocean">Oceanic Blue</option>
          </select>
          <select
            value={font}
            onChange={(e) => setFont(e.target.value as typeof font)}
            className="rounded p-1"
          >
            <option value="inter">Inter</option>
            <option value="libre">Libre Franklin</option>
            <option value="source">Source Sans Pro</option>
            <option value="ibm">IBM Plex Sans</option>
          </select>
        </div>
      </header>
      <main>
        <p className="mb-4">
          AI Agent placeholder – the full UI will appear here.
        </p>
        {/* Floating agent button – visible at bottom‑right */}
        <button
          className="fixed bottom-4 right-4 bg-[var(--color-primary)] text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
          title="Open Agent (Ctrl+Space)"
        >
          🤖
        </button>
      </main>
    </div>
  );
}

export default App;
