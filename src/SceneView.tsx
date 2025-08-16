import { useState } from "react";
import { Scene } from "./types";
import { paragraphs, isCorrect } from "./utils";
import { puzzleRegistry } from "./puzzleRegistry";

interface Props {
  scene: Scene;
  onChoose: (next: string) => void;
  onSolve: (args: { ok: boolean; next: string; flags: string[] }) => void;
  flags: string[];
}

export function SceneView({ scene, onChoose, onSolve }: Props) {
  const hasPuzzle = !!scene.puzzle;
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showAnim, setShowAnim] = useState(false);
  console.log(">> SceneView mounted with id:", scene.id);
  console.log("Puzzle concept:", scene.puzzle?.concept);
  console.log("Registry keys:", Object.keys(puzzleRegistry)); 
  // 1. Look up puzzle component dynamically
// Inside SceneView
const [puzzleResult, setPuzzleResult] = useState<null | { ok: boolean; next: string; flags: string[] }>(null);

if (hasPuzzle && scene.puzzle?.concept && puzzleRegistry[scene.puzzle.concept]) {
  const PuzzleComp = puzzleRegistry[scene.puzzle.concept];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-100">{scene.title}</h2>
      <div className="space-y-3">{paragraphs(scene.text)}</div>

      {!puzzleResult ? (
        <PuzzleComp
          onSolve={(ok) => {
            const next = ok ? scene.puzzle!.success_next : scene.puzzle!.fail_next;
            setPuzzleResult({
              ok,
              next,
              flags: ok ? scene.flags_set ?? ["solved_puzzle"] : scene.flags_set ?? ["failed_puzzle"],
            });
          }}
        />
      ) : (
        <div className="space-y-3">
          <div className="text-slate-200">
            {puzzleResult.ok ? "✅ You solved it!" : "❌ Not correct, but you can continue."}
          </div>
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500"
            onClick={() => onSolve(puzzleResult)}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}

  // 2. Fallback: generic puzzle or choices
  const handleSubmit = () => {
    if (!hasPuzzle) return;
    const ok = isCorrect(input, scene.puzzle!.answer);
    setFeedback(ok ? "Correct." : "Not quite. Continue for now.");

    if (ok && scene.puzzle?.animation) setShowAnim(true);
    else {
      const next = ok ? scene.puzzle!.success_next : scene.puzzle!.fail_next;
      onSolve({
        ok,
        next,
        flags: ok ? scene.flags_set ?? ["solved_puzzle"] : ["failed_puzzle"],
      });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-100">{scene.title}</h2>
      <div className="space-y-3">{paragraphs(scene.text)}</div>

      {/* Generic puzzle input */}
      {hasPuzzle && !showAnim && (
        <div className="mt-4 flex flex-col gap-2">
          <div className="text-sm text-slate-400">Puzzle — {scene.puzzle!.concept}</div>
          <div className="mt-2 text-slate-100">{scene.puzzle!.question}</div>
          <div className="mt-2 flex gap-2">
            <input
              className="w-48 rounded-xl border px-3 py-2 bg-slate-900 text-slate-100"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Your answer"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500"
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>
          {feedback && <div className="text-sm text-slate-300">{feedback}</div>}
        </div>
      )}

      {/* Choices */}
      {scene.choices?.length ? (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {scene.choices.map((c) => (
            <button
              key={c.next}
              className="px-4 py-3 bg-slate-800 text-slate-100 rounded-xl hover:bg-indigo-600"
              onClick={() => onChoose(c.next)}
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}