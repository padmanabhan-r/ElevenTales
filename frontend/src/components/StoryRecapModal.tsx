import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { Character } from "@/characters";
import { StoryScene } from "@/hooks/useStoryImages";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

interface BadgeSummary { emoji: string; name: string; reason: string; }

interface Props {
  character: Character;
  scenes: StoryScene[];
  badges?: BadgeSummary[];
  onClose: () => void;
  onRecapGenerated?: (title: string, narrations: string[]) => void;
}

export default function StoryRecapModal({ character, scenes, badges = [], onClose, onRecapGenerated }: Props) {
  const [title, setTitle] = useState("");
  const [narrations, setNarrations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [downloading, setDownloading] = useState(false);

  const loadedScenes = scenes.filter((s) => s.status === "loaded" && s.imageData);

  useEffect(() => {
    if (loadedScenes.length === 0) {
      setError("No story scenes to recap yet!");
      setLoading(false);
      return;
    }

    const sceneData = loadedScenes.map((s) => ({
      image_data: s.imageData!,
      mime_type: s.mimeType ?? "image/png",
      description: s.description,
    }));

    // Estimate payload size (base64 length × 0.75 ≈ bytes); bail early if > 25 MB
    const estimatedBytes = sceneData.reduce((sum, s) => sum + s.image_data.length * 0.75, 0);
    if (estimatedBytes > 25 * 1024 * 1024) {
      setError("Story too long to save in the current version of the app — will be handled in a later version when GCS is enabled.");
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/story-recap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        character_name: character.name,
        image_style: character.imageStyle,
        scenes: sceneData,
        narrations: sceneData.map((s) => s.description).filter(Boolean),
      }),
    })
      .then((res) => {
        if (res.status === 413) throw new Error("TOO_LONG");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const t = data.title ?? "";
        const n = data.narrations ?? [];
        setTitle(t);
        setNarrations(n);
        if (t) onRecapGenerated?.(t, n);
      })
      .catch((err) => setError(
        err?.message === "TOO_LONG"
          ? "Story too long to save in the current version of the app — will be handled in a later version when GCS is enabled."
          : "Couldn't create the storybook. Please try again!"
      ))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const downloadPdf = useCallback(async () => {
    if (loadedScenes.length === 0) return;
    setDownloading(true);

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const PW = 210; // A4 width mm
      const PH = 297; // A4 height mm
      const MARGIN = 14;
      const CONTENT_W = PW - MARGIN * 2;
      const storyTitle = title || `A Story with ${character.name}`;

      // ── Title page ───────────────────────────────────────────────────────────
      doc.setFillColor("#fdf6e3");
      doc.rect(0, 0, PW, PH, "F");

      // Character avatar (circle clip)
      if (character.image && !character.image.startsWith("data:image/svg")) {
        try {
          const avatarSize = 36;
          const avatarX = PW / 2 - avatarSize / 2;
          const avatarY = 58;
          doc.addImage(character.image, "JPEG", avatarX, avatarY, avatarSize, avatarSize, undefined, "FAST");
        } catch { /* skip if avatar fails */ }
      }

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.setTextColor("#5c3d0e");
      const titleLines = doc.splitTextToSize(storyTitle, CONTENT_W) as string[];
      doc.text(titleLines, PW / 2, 116, { align: "center" });

      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor("#9c7a3a");
      doc.text(`A story with ${character.name}`, PW / 2, 116 + titleLines.length * 10 + 4, { align: "center" });

      // Decorative line
      const lineY = 116 + titleLines.length * 10 + 14;
      doc.setDrawColor("#c9a84c");
      doc.setLineWidth(0.5);
      doc.line(PW / 2 - 24, lineY, PW / 2 + 24, lineY);

      // ── Scene pages ──────────────────────────────────────────────────────────
      for (let i = 0; i < loadedScenes.length; i++) {
        const scene = loadedScenes[i];
        doc.addPage();
        doc.setFillColor("#fdf6e3");
        doc.rect(0, 0, PW, PH, "F");

        // Page number
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor("#c9a84c");
        doc.text(`${i + 1}`, PW / 2, PH - 8, { align: "center" });

        // Image — fill most of the page, preserve aspect ratio
        const imgData = `data:${scene.mimeType ?? "image/png"};base64,${scene.imageData}`;
        const imgFormat = (scene.mimeType ?? "image/png").includes("jpeg") ? "JPEG" : "PNG";

        // Get natural dimensions via Image to calculate aspect ratio
        const dims = await new Promise<{ w: number; h: number }>((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.width, h: img.height });
          img.onerror = () => resolve({ w: 1, h: 1 });
          img.src = imgData;
        });

        const narration = narrations[i] ?? "";
        const narrationLines = narration
          ? (doc.setFontSize(12), doc.splitTextToSize(narration, CONTENT_W) as string[])
          : [];
        const textBlockH = narrationLines.length > 0 ? narrationLines.length * 6 + 10 : 0;

        const maxImgH = PH - MARGIN * 2 - textBlockH - (textBlockH > 0 ? 6 : 0);
        const aspect = dims.h / dims.w;
        let imgW = CONTENT_W;
        let imgH = imgW * aspect;
        if (imgH > maxImgH) { imgH = maxImgH; imgW = imgH / aspect; }
        const imgX = (PW - imgW) / 2;
        const imgY = MARGIN;

        try {
          doc.addImage(imgData, imgFormat, imgX, imgY, imgW, imgH, undefined, "FAST");
        } catch { /* skip if image fails to embed */ }

        // Decorative border around image
        doc.setDrawColor("#e8d9b5");
        doc.setLineWidth(0.8);
        doc.roundedRect(imgX - 1, imgY - 1, imgW + 2, imgH + 2, 2, 2, "S");

        // Narration text
        if (narrationLines.length > 0) {
          const textY = imgY + imgH + 10;
          doc.setFont("helvetica", "italic");
          doc.setFontSize(12);
          doc.setTextColor("#5c3d0e");
          doc.text(narrationLines, PW / 2, textY, { align: "center", lineHeightFactor: 1.5 });
        }
      }

      // ── Badges page (if any) ─────────────────────────────────────────────────
      if (badges.length > 0) {
        doc.addPage();
        doc.setFillColor("#fdf6e3");
        doc.rect(0, 0, PW, PH, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor("#5c3d0e");
        doc.text("Badges Earned", PW / 2, 40, { align: "center" });

        let badgeY = 56;
        badges.forEach((b) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(13);
          doc.setTextColor("#5c3d0e");
          doc.text(`${b.emoji}  ${b.name}`, PW / 2, badgeY, { align: "center" });
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor("#9c7a3a");
          doc.text(b.reason, PW / 2, badgeY + 6, { align: "center" });
          badgeY += 20;
        });
      }

      // ── The End page ─────────────────────────────────────────────────────────
      doc.addPage();
      doc.setFillColor("#fdf6e3");
      doc.rect(0, 0, PW, PH, "F");

      doc.setDrawColor("#c9a84c");
      doc.setLineWidth(0.5);
      doc.line(PW / 2 - 24, PH / 2 - 18, PW / 2 + 24, PH / 2 - 18);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(32);
      doc.setTextColor("#5c3d0e");
      doc.text("The End", PW / 2, PH / 2, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor("#9c7a3a");
      doc.text(`${character.name} hopes you loved every moment ✨`, PW / 2, PH / 2 + 12, { align: "center" });

      doc.line(PW / 2 - 24, PH / 2 + 20, PW / 2 + 24, PH / 2 + 20);

      // Save
      const safeName = storyTitle.replace(/[^a-z0-9 ]/gi, "").replace(/\s+/g, "-").toLowerCase();
      doc.save(`${safeName}.pdf`);
    } finally {
      setDownloading(false);
    }
  }, [loadedScenes, title, narrations, badges, character]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ background: "#fdf6e3" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid #e8d9b5" }}
      >
        <div className="flex items-center gap-3">
          <img
            src={character.image}
            alt={character.name}
            className="w-10 h-10 rounded-full object-cover border-2"
            style={{ borderColor: "#c9a84c" }}
          />
          <div>
            <h2 className="font-display text-xl font-bold" style={{ color: "#6b4c11" }}>
              Our Story
            </h2>
            <p className="font-body text-xs" style={{ color: "#9c7a3a" }}>
              with {character.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!loading && !error && loadedScenes.length > 0 && (
            <button
              onClick={downloadPdf}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: "#f5e6c0", border: "1px solid #c9a84c", color: "#5c3d0e" }}
              title="Download story as PDF"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Saving…
                </>
              ) : (
                <>⬇ Download PDF</>
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="text-3xl leading-none pb-1 transition-opacity hover:opacity-60"
            style={{ color: "#9c7a3a" }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Scrollable storybook content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div
              className="w-12 h-12 border-4 rounded-full animate-spin"
              style={{ borderColor: "#e8d9b5", borderTopColor: "#c9a84c" }}
            />
            <p className="font-body text-sm text-center" style={{ color: "#9c7a3a" }}>
              Creating your storybook…
              <br />
              <span className="text-xs opacity-70">Just a moment</span>
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-12">
            <p className="font-body text-sm" style={{ color: "#9c7a3a" }}>
              {error}
            </p>
          </div>
        )}

        {!loading && !error && loadedScenes.length > 0 && (
          <div className="flex flex-col items-center px-8 pb-16">
            {/* Title block */}
            <div className="text-center pt-10 pb-8 max-w-xl">
              <p className="font-display text-4xl font-bold leading-tight" style={{ color: "#5c3d0e" }}>
                {title || `A Story with ${character.name}`}
              </p>
              <p className="font-body text-sm mt-2" style={{ color: "#9c7a3a" }}>
                A story with {character.name}
              </p>
              {/* Decorative divider */}
              <div className="flex items-center justify-center gap-3 mt-5">
                <div className="h-px w-16" style={{ background: "#c9a84c" }} />
                <span style={{ color: "#c9a84c" }}>✦</span>
                <div className="h-px w-16" style={{ background: "#c9a84c" }} />
              </div>
            </div>

            {/* Scenes */}
            <div className="flex flex-col gap-10 w-full max-w-2xl">
              {loadedScenes.map((scene, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col gap-4"
                >
                  <img
                    src={`data:${scene.mimeType ?? "image/png"};base64,${scene.imageData}`}
                    alt={`Story illustration ${i + 1}`}
                    className="w-full rounded-2xl shadow-lg"
                    style={{ border: "3px solid #e8d9b5" }}
                  />
                  {narrations[i] && (
                    <p
                      className="font-body text-lg leading-relaxed text-center px-4 italic"
                      style={{ color: "#5c3d0e" }}
                    >
                      {narrations[i]}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Badges earned */}
            {badges.length > 0 && (
              <div className="w-full max-w-2xl mt-10">
                <p className="font-display text-lg font-bold text-center mb-4" style={{ color: "#5c3d0e" }}>
                  🏅 Badges Earned
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {badges.map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-4 py-2 rounded-full font-body text-sm"
                      style={{ background: "#f5e6c0", border: "1px solid #c9a84c", color: "#5c3d0e" }}
                    >
                      <span className="text-xl">{b.emoji}</span>
                      <div>
                        <p className="font-semibold leading-tight">{b.name}</p>
                        <p className="text-xs opacity-70">{b.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* The End */}
            <div className="text-center mt-14 mb-2">
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="h-px w-16" style={{ background: "#c9a84c" }} />
                <span style={{ color: "#c9a84c" }}>✦</span>
                <div className="h-px w-16" style={{ background: "#c9a84c" }} />
              </div>
              <p className="font-display text-3xl font-bold" style={{ color: "#5c3d0e" }}>
                The End
              </p>
              <p className="font-body text-sm mt-2" style={{ color: "#9c7a3a" }}>
                {character.name} hopes you loved every moment ✨
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
