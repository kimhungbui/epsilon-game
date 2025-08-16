// src/SciFiTextGame.tsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Chapter, GameState } from "./types";
import { usePersistentState, clearSave } from "./storage";
import { SceneView } from "./SceneView";

interface ChapterListItem {
  title: string;
  file: string;
}

export default function SciFiTextGame() {
  const [chaptersList, setChaptersList] = useState<ChapterListItem[]>([]);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [currentChapterFile, setCurrentChapterFile] = useState<string | null>(null);
  const [state, setState] = usePersistentState({
    current: "",
    flags: [] as string[],
    history: [] as string[],
    complete: false as boolean,
  });
  const [showMenu, setShowMenu] = useState(false);

  // Fetch the auto-generated index.json of chapters
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}chapters/index.json`)
      .then(res => res.json())
      .then((list: ChapterListItem[]) => {
        setChaptersList(list);
        if (!currentChapterFile && list.length > 0) setCurrentChapterFile(list[0].file);
      })
      .catch(console.error);
  }, []);

  // Load the current chapter JSON dynamically
  useEffect(() => {
    if (!currentChapterFile) return;
    fetch(`${import.meta.env.BASE_URL}chapters/${currentChapterFile}`)
      .then(res => res.json())
      .then((data: Chapter) => {
        setChapter(data);
        setState((s: GameState) => ({
          ...s,
          current: data.scenes[0].id,
          history: [data.scenes[0].id],
        }));
      })
      .catch(console.error);
  }, [currentChapterFile]);

  if (!chapter) return <div>Loading chapter...</div>;

  const sceneMap = Object.fromEntries(chapter.scenes.map(s => [s.id, s]));
  const scene = state.current === "chapter_end" ? null : sceneMap[state.current];

  const goTo = (id: string) => {
    if (id === "chapter_end") {
      setState((s: GameState) => ({
        ...s,
        current: id,
        complete: true,
        history: [...s.history, id],
      }));
      return;
    }
    if (!sceneMap[id]) return;
    setState((s: GameState) => ({
      ...s,
      current: id,
      history: [...s.history, id],
    }));
  };

  const onChoose = (next: string) => goTo(next);

  const onSolve = ({ next, flags }: { ok: boolean; next: string; flags: string[] }) => {
    setState((s: GameState) => ({
      ...s,
      flags: Array.from(new Set([...s.flags, ...flags])),
    }));
    goTo(next);
  };

  const reset = () => {
    clearSave();
    if (chapter) {
      setState({
        current: chapter.scenes[0].id,
        flags: [],
        history: [chapter.scenes[0].id],
        complete: false,
      });
    }
  };

  const progress = Math.min(
    100,
    Math.round((new Set(state.history).size / (chapter.scenes.length + 1)) * 100)
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-10">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-100">Epsilon Station</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={reset}
              className="rounded-2xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-indigo-500"
            >
              Reset
            </button>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-2xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-indigo-500"
            >
              {showMenu ? "Hide Menu" : "Show Menu"}
            </button>
          </div>
        </header>

        {/* Chapters and scenes menu */}
        {showMenu && (
          <div className="mb-4 p-4 bg-slate-800 rounded-xl text-slate-100 shadow-inner">
            <h3 className="font-semibold mb-2">Chapters</h3>
            <ul className="space-y-1">
              {chaptersList.map((ch) => (
                <li key={ch.file}>
                  <button
                    className={`px-2 py-1 rounded hover:bg-indigo-600 ${
                      ch.file === currentChapterFile ? "bg-indigo-500 font-bold" : ""
                    }`}
                    onClick={() => setCurrentChapterFile(ch.file)}
                  >
                    {ch.title}
                  </button>

                  {/* Scene list for the current chapter */}
                  {ch.file === currentChapterFile && chapter && (
                    <ul className="ml-4 mt-1 space-y-1">
                      {chapter.scenes.map((s) => (
                        <li key={s.id}>
                          <button
                            className={`px-2 py-1 rounded hover:bg-indigo-500 ${
                              s.id === state.current ? "bg-indigo-400 font-semibold" : ""
                            }`}
                            onClick={() =>
                              setState((st: GameState) => ({ ...st, current: s.id }))
                            }
                          >
                            {s.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-full bg-indigo-600" style={{ width: `${progress}%` }} />
        </div>

        <main className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl">
          <AnimatePresence mode="wait">
            {state.current === "chapter_end" ? (
              <motion.div
                key="end"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <h2 className="text-xl font-semibold text-slate-100">End of Chapter</h2>
                <p className="text-slate-200">
                  This chapter has ended. Continue to the next chapter when ready.
                </p>
                <button
                  onClick={reset}
                  className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  Restart Chapter
                </button>
              </motion.div>
            ) : scene ? (
              <motion.div
                key={scene.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <SceneView
                  scene={scene}
                  onChoose={onChoose}
                  onSolve={onSolve}
                  flags={state.flags}
                />
              </motion.div>
            ) : (
              <div className="text-slate-300">Scene not found.</div>
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-6 text-center text-xs text-slate-500">
          © 2025 Epsilon Station — Web text‑game engine demo. Progress autosaves locally.
        </footer>
      </div>
    </div>
  );
}