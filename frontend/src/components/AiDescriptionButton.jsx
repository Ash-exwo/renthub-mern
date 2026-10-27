import { useState } from "react";
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

/**
 * AiDescriptionButton
 * ====================
 * Connects RentHub's listing forms to the local Python AI microservice.
 *
 * Academic & Architectural Highlights:
 * 1. Microservice Interface: Communicates over HTTP with the local FastAPI
 *    service running at port 8000, completely decoupled from the Node.js/Express backend.
 * 2. Human-in-the-Loop UX: The AI assists the host by drafting a description,
 *    but the host retains complete control to edit, expand, or rewrite the text.
 * 3. Offline & Fault-Tolerant: If the Python server is offline or fails, an informative
 *    banner is displayed while regular manual listing creation remains 100% operational.
 */
export default function AiDescriptionButton({
  title = "",
  categoryName = "",
  features = "",
  condition = "Good",
  location = "",
  onGenerated,
  disabled = false,
}) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: string }

  const handleGenerate = async () => {
    // Basic guard: require at least a title
    if (!title || title.trim().length < 3) {
      setStatusMessage({
        type: "error",
        text: "Please enter a title above first so the AI knows what to describe.",
      });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    const AI_API_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://127.0.0.1:8000";

    try {
      const response = await fetch(`${AI_API_URL}/api/generate-description`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          category: categoryName || undefined,
          features: features ? features.trim() : undefined,
          condition: condition || "Good",
          location: location ? location.trim() : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `AI service returned error status ${response.status}`
        );
      }

      const data = await response.json();
      if (data && data.description) {
        onGenerated(data.description);
        setStatusMessage({
          type: "success",
          text: `Description generated locally in ${data.metrics?.inference_time_seconds || ""}s! You can edit or refine it below.`,
        });
      } else {
        throw new Error("No description returned by the AI service.");
      }
    } catch (err) {
      console.warn("RentHub Local AI Service unavailable:", err);
      setStatusMessage({
        type: "error",
        text:
          "Local AI service is not running on http://127.0.0.1:8000. Start it with 'python main.py' in ai-service/, or enter your description manually.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 items-end">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || disabled}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 shadow-xs border ${
          loading
            ? "bg-indigo-50 border-indigo-200 text-indigo-400 cursor-wait"
            : "bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-indigo-200/80 text-indigo-700 hover:text-indigo-800 hover:shadow-sm active:scale-98 cursor-pointer"
        }`}
        title="Generate a grounded description using your local Python AI model"
      >
        {loading ? (
          <>
            <Loader2 size={13} className="animate-spin text-indigo-600" />
            <span>Generating with Local AI...</span>
          </>
        ) : (
          <>
            <Sparkles size={13} className="text-indigo-600" />
            <span>Generate with AI ✨</span>
          </>
        )}
      </button>

      {/* Non-intrusive status feedback banner */}
      {statusMessage && (
        <div
          className={`flex items-start gap-1.5 text-[11px] p-2 rounded-lg leading-snug w-full transition-all duration-150 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
              : "bg-amber-50 text-amber-800 border border-amber-200/70"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 size={13} className="shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle size={13} className="shrink-0 text-amber-600 mt-0.5" />
          )}
          <span className="flex-1">{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-[10px] text-gray-400 hover:text-gray-700 font-bold ml-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
