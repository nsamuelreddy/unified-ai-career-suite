import { useState, useRef, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export default function ResumeAnalyzer() {
  const [resumeText, setResumeText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const pdfjsRef = useRef(null);

  useEffect(() => {
    const loadPdfJs = async () => {
      if (typeof window !== "undefined" && !window.pdfjsLib) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        script.async = true;
        script.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          pdfjsRef.current = window.pdfjsLib;
        };
        document.head.appendChild(script);
      }
    };
    loadPdfJs();
  }, []);

  const extractTextFromPDF = async (file) => {
    if (!pdfjsRef.current) {
      throw new Error("PDF library loading. Please wait a moment and try again.");
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsRef.current.getDocument(new Uint8Array(arrayBuffer)).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => (item.str ? item.str : ""))
          .join(" ");
        fullText += pageText + "\n";
      }

      return fullText.trim();
    } catch (err) {
      throw new Error(`Failed to extract PDF text: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setError("");

    try {
      let text = "";

      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        text = await extractTextFromPDF(file);
      } else {
        text = await file.text();
      }

      if (!text || text.length < 10) {
        throw new Error("File is empty. Please provide a resume with actual content.");
      }

      setResumeText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file.");
      setResumeText("");
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleAnalyze = async () => {
    const trimmed = resumeText.trim();
    if (!trimmed || trimmed.length < 50) {
      setError("Please provide at least 50 characters of resume text.");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: trimmed }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || "Analysis failed.");
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to analyze resume."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Unified AI Career Suite
          </p>
          <h1 className="mt-2 text-4xl font-bold text-white">Resume Analyzer</h1>
          <p className="mt-3 text-slate-400">
            Get instant AI-powered feedback on clarity, ATS compatibility, keywords, and impact.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur">
              <label className="mb-4 block text-sm font-semibold text-white">
                Upload or Paste Resume
              </label>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingFile}
                  className="w-full rounded-2xl border-2 border-dashed border-cyan-400/40 bg-cyan-400/5 px-6 py-8 text-center transition hover:border-cyan-400/60 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <p className="text-sm font-medium text-cyan-300">
                    {isProcessingFile ? "Processing file..." : "Click to upload PDF or TXT file"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {isProcessingFile ? "Extracting text..." : "Or paste your resume text below"}
                  </p>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.text,.pdf,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="relative">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-slate-500">or paste directly</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                </div>

                <textarea
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    setError("");
                  }}
                  placeholder="Paste your resume content here..."
                  className="w-full h-64 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                />

                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !resumeText.trim()}
                  className="w-full rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
                </button>

                {error && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div>
            {analysis ? (
              <div className="space-y-6">
                {/* Overall Score */}
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/20 to-sky-500/10 p-6 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                    Overall Score
                  </p>
                  <p className="mt-3 text-5xl font-bold text-white">
                    {analysis.score}
                    <span className="text-xl text-slate-400">/100</span>
                  </p>
                  <div className="mt-4 h-2 rounded-full bg-slate-900/50 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-sky-400"
                      style={{ width: `${analysis.score}%` }}
                    />
                  </div>
                </div>

                {/* Strengths */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur">
                  <p className="text-sm font-semibold text-emerald-300">✓ Strengths</p>
                  <ul className="mt-3 space-y-2">
                    {analysis.strengths.map((item, idx) => (
                      <li key={idx} className="text-sm text-slate-300">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur">
                  <p className="text-sm font-semibold text-amber-300">⚠ Weaknesses</p>
                  <ul className="mt-3 space-y-2">
                    {analysis.weaknesses.map((item, idx) => (
                      <li key={idx} className="text-sm text-slate-300">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Keywords */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur">
                    <p className="text-xs font-semibold text-sky-300 uppercase mb-3">✓ Found Keywords</p>
                    {analysis.keywords_found.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {analysis.keywords_found.map((kw, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-sky-500/20 border border-sky-400/30 px-3 py-1 text-xs text-sky-300"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No specific keywords identified</p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur">
                    <p className="text-xs font-semibold text-orange-300 uppercase mb-3">⚡ Missing Keywords</p>
                    {analysis.keywords_missing.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {analysis.keywords_missing.map((kw, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-orange-500/20 border border-orange-400/30 px-3 py-1 text-xs text-orange-300"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Good keyword coverage</p>
                    )}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur">
                  <p className="text-sm font-semibold text-violet-300 mb-3">💡 Recommendations</p>
                  {analysis.recommendations.length > 0 ? (
                    <ol className="space-y-2">
                      {analysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-slate-300 leading-6">
                          <span className="font-semibold text-violet-300">{idx + 1}.</span> {rec}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-slate-400">No additional recommendations</p>
                  )}
                </div>

                <button
                  onClick={() => setAnalysis(null)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  Analyze Another Resume
                </button>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 text-center backdrop-blur">
                <p className="text-slate-400">
                  Upload or paste your resume to get instant AI feedback on ATS compatibility, keywords, and impact.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
