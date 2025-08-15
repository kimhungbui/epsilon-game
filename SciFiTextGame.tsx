import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Choice {
  label: string;
  next: string;
}

interface Puzzle {
  type: string;
  concept: string;
  question: string;
  answer: string;
  success_next: string;
  fail_next: string;
  animation?: string;
  explanation?: string; // Optional explanation for the puzzle
}

interface Scene {
  id: string;
  title: string;
  text: string;
  choices?: Choice[];
  puzzle?: Puzzle;
  flags_set?: string[];
}

interface Chapter {
  chapter: string;
  title: string;
  scenes: Scene[];
}

const SAVE_KEY = "scifi_textgame_save_v1";

function saveState(state: any) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
}
function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
function clearSave() { localStorage.removeItem(SAVE_KEY); }
function usePersistentState(initial: any) {
  const [state, setState] = useState(() => loadState() ?? initial);
  useEffect(() => { saveState(state); }, [state]);
  return [state, setState];
}

function paragraphs(text: string) {
  return String(text).split(/\n\n+/).map((p, i) => (
    <p key={i} className="text-base leading-7 text-slate-200">{p}</p>
  ));
}

function isCorrect(userInput: string, answer: string) {
  const a = String(userInput).trim();
  const b = String(answer).trim();
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) {
    return Math.abs(na - nb) <= 1e-6;
  }
  return a.toLowerCase() === b.toLowerCase();
}

function SceneView({ scene, onChoose, onSolve, flags }: { scene: Scene; onChoose: any; onSolve: any; flags: string[] }) {
  const hasPuzzle = !!scene.puzzle;
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showAnim, setShowAnim] = useState(false);

const handleSubmit = () => {
  if (!hasPuzzle) return;
  const ok = isCorrect(input, scene.puzzle!.answer);
  setFeedback(ok ? "Correct." : "Not quite. Continue for now.");

  // If there's an animation, show it but DO NOT advance yet
  if (ok && scene.puzzle?.animation) {
    setShowAnim(true);
  } else {
    const next = ok ? scene.puzzle!.success_next : scene.puzzle!.fail_next;
    onSolve({
      ok,
      next,
      flags: ok
        ? scene.flags_set ?? ["solved_puzzle"]
        : scene.flags_set ?? ["failed_puzzle"],
    });
  }
};

return (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold text-slate-100">{scene.title}</h2>
    <div className="space-y-3">{paragraphs(scene.text)}</div>

    {hasPuzzle && (
      <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-800/60 p-4 shadow">
        <div className="text-sm uppercase tracking-wide text-slate-400">
          Puzzle — {scene.puzzle!.concept}
        </div>
        <div className="mt-2 text-slate-100">{scene.puzzle!.question}</div>

        <div className="mt-3 flex items-center gap-2">
          <input
            className="w-48 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Your answer"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
          <button
            className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-500"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>

        {feedback && <div className="mt-2 text-sm text-slate-300">{feedback}</div>}

        {showAnim && scene.puzzle?.animation && (
          <div className="mt-4">
            <div className="mb-2 text-sm text-slate-400">
              Optional explanation:
              {scene.puzzle?.explanation || "Watch the animation to see how it works."}
            </div>
            <video
              width={640}
              className="w-full rounded-xl"
              controls
              preload="metadata"
            >
              <source src={`/animations/${scene.puzzle.animation}`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <button
              className="mt-2 rounded-2xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
              onClick={() => {
                // Only advance after watching/when player clicks Continue
                const next = scene.puzzle!.success_next;
                onSolve({
                  ok: true,
                  next,
                  flags: scene.flags_set ?? ["solved_puzzle"],
                });
              }}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    )}

    {!hasPuzzle && scene.choices && (
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {scene.choices.map((c, idx) => (
          <button
            key={idx}
            className="rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-left text-slate-100 hover:border-indigo-500 hover:bg-slate-800"
            onClick={() => onChoose(c.next)}
          >
            {c.label}
          </button>
        ))}
      </div>
    )}
  </div>
);
}

export default function SciFiTextGame({ chapterFile = "chapter1.json" }: { chapterFile?: string }) {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [state, setState] = usePersistentState({ current: "scene_001", flags: [], history: [], complete: false });

  useEffect(() => {
    fetch(`/chapters/${chapterFile}`)
      .then(res => res.json())
      .then(data => {
        setChapter(data);
        if (!state.current) setState(s => ({ ...s, current: data.scenes[0].id, history: [data.scenes[0].id] }));
      })
      .catch(err => console.error("Failed to load chapter:", err));
  }, [chapterFile]);

  if (!chapter) return <div>Loading chapter...</div>;

  const sceneMap = Object.fromEntries(chapter.scenes.map(s => [s.id, s]));
  const scene = state.current === "chapter_end" ? null : sceneMap[state.current];

  const goTo = (id: string) => {
    if (id === "chapter_end") {
      setState(s => ({ ...s, current: id, complete: true, history: [...s.history, id] }));
      return;
    }
    if (!sceneMap[id]) return;
    setState(s => ({ ...s, current: id, history: [...s.history, id] }));
  };

  const onChoose = (next: string) => goTo(next);
  const onSolve = ({ ok, next, flags }: { ok: boolean; next: string; flags: string[] }) => {
    setState(s => ({ ...s, flags: Array.from(new Set([...s.flags, ...flags])) }));
    goTo(next);
  };

  const reset = () => {
    clearSave();
    setState({ current: chapter.scenes[0].id, flags: [], history: [chapter.scenes[0].id], complete: false });
  };

  const progress = Math.min(100, Math.round((new Set(state.history).size / (chapter.scenes.length + 1)) * 100));

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-10">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Epsilon Station</h1>
            <div className="text-sm text-slate-400">Chapter {chapter.chapter}: {chapter.title}</div>
          </div>
          <div>
            <button onClick={reset} className="rounded-2xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-indigo-500">Reset</button>
          </div>
        </header>
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-full bg-indigo-600" style={{ width: `${progress}%` }} />
        </div>
        <main className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl">
          <AnimatePresence mode="wait">
            {state.current === "chapter_end" ? (
              <motion.div key="end" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-100">End of Chapter</h2>
                <p className="text-slate-200">This chapter has ended. Continue to the next chapter when ready.</p>
                <button onClick={reset} className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Restart Chapter</button>
              </motion.div>
            ) : scene ? (
              <motion.div key={scene.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <SceneView scene={scene} onChoose={onChoose} onSolve={onSolve} flags={state.flags} />
              </motion.div>
            ) : (<div className="text-slate-300">Scene not found.</div>)}
          </AnimatePresence>
        </main>
        <footer className="mt-6 text-center text-xs text-slate-500">© 2025 Epsilon Station — Web text‑game engine demo. Progress autosaves locally.</footer>
      </div>
    </div>
  );
}
