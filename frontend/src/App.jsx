import { useEffect, useRef, useState } from "react";
import ResumeAnalyzer from "./ResumeAnalyzer";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const FEATURE_CARDS = [
  {
    title: "AI Resume Builder",
    description:
      "Generate role-specific bullet points, optimize impact language, and align your profile to the target job.",
    accent: "from-cyan-500/20 to-sky-500/10",
  },
  {
    title: "AI Resume Analyzer",
    description:
      "Score clarity, ATS fit, keyword coverage, and structure before you submit an application.",
    accent: "from-emerald-500/20 to-teal-500/10",
  },
  {
    title: "AI Mock Interviewer",
    description:
      "Practice behavioral, technical, and leadership interviews with instant, structured feedback.",
    accent: "from-orange-500/20 to-amber-500/10",
  },
];

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    content:
      "Welcome to the Unified AI Career Suite. Ask me about resumes, interviews, ATS optimization, or career strategy.",
  },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isOpen, isSending]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) {
      return;
    }

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          history: nextMessages.slice(0, -1),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || "Failed to reach the career coach API.");
      }

      const data = await response.json();
      const assistantText = data.response ?? data.text ?? "I could not generate a response.";

      setMessages((current) => [
        ...current,
        { role: "assistant", content: assistantText },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `Connection error: ${error.message}`
              : "Connection error: Unable to reach the backend.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  if (currentPage === "analyzer") {
    return <ResumeAnalyzer />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.15),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_28%),linear-gradient(180deg,_rgba(2,6,23,1)_0%,_rgba(15,23,42,1)_100%)]" />

      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
              Unified AI Career Suite
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              Career tools built like a modern SaaS dashboard
            </h1>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {['Resume Builder', 'Analyzer', 'Interviewer', 'Insights'].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"
              >
                {item}
              </span>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="grid gap-6 lg:grid-cols-3">
          {FEATURE_CARDS.map((card) => (
            <button
              key={card.title}
              onClick={() => card.title.includes("Analyzer") && setCurrentPage("analyzer")}
              className={`rounded-3xl border border-white/10 bg-gradient-to-br ${card.accent} p-6 shadow-2xl shadow-black/20 backdrop-blur transition hover:shadow-2xl hover:shadow-cyan-500/20 cursor-pointer text-left`}
            >
              <div className="mb-6 h-12 w-12 rounded-2xl border border-white/10 bg-white/10" />
              <h2 className="text-xl font-semibold text-white">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-200/90">{card.description}</p>
              <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-200/70">
                <span>Available</span>
                <span>Now</span>
              </div>
            </button>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
                Dashboard
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white">One workspace for your job search pipeline</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                Use the tools above to generate stronger applications, analyze resume quality, and rehearse interviews.
                The floating assistant is connected to your FastAPI backend and keeps the conversation state in sync.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {[
                ["ATS Readiness", "94%"],
                ["Interview Confidence", "High"],
                ["Applications Tracked", "128"],
                ["Active Roles", "12"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-1.5rem)]">
        {isOpen ? (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center justify-between border-b border-white/10 px-4 py-4 text-left"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">AI Career Coach</p>
                <p className="mt-1 text-sm text-slate-300">Resume, interview, and career guidance</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                Collapse
              </span>
            </button>

            <div className="flex h-[32rem] flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}-${message.content.slice(0, 12)}`}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                        message.role === "user"
                          ? "bg-cyan-500 text-slate-950"
                          : "bg-white/8 border border-white/10 text-slate-100"
                      }`}
                    >
                      <p className="mb-1 text-[0.65rem] uppercase tracking-[0.25em] opacity-70">
                        {message.role === "user" ? "User" : "Assistant"}
                      </p>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isSending ? (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-slate-300">
                      Thinking about your career strategy...
                    </div>
                  </div>
                ) : null}

                <div ref={endOfMessagesRef} />
              </div>

              <form onSubmit={sendMessage} className="border-t border-white/10 p-4">
                <div className="flex gap-3">
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Ask about resumes, interviews, or career strategy..."
                    className="flex-1 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={isSending}
                    className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex w-full items-center justify-between rounded-3xl border border-cyan-400/30 bg-slate-900/95 px-4 py-4 text-left shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">AI Career Coach</p>
              <p className="mt-1 text-sm text-slate-300">Open the assistant</p>
            </div>
            <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-semibold text-slate-950">
              Chat
            </span>
          </button>
        )}
      </div>
    </div>
  );
}