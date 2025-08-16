import React, { useMemo, useState } from "react";

interface FourierPuzzleProps {
  onSolve: (ok: boolean) => void;
}

/**
 * Two-stage, kid-friendly Fourier puzzle
 * Stage 1: Find the "smallest steady beat" (fundamental) using the slider and vertical bars.
 * Stage 2: Pick which multiples of that beat are present (shows colored waves + legend).
 *
 * Visual improvements:
 * - Clear grid + axis with second labels
 * - Thicker, colored vertical bars that turn green near the correct answer
 * - Legend and color-coding for composite and selected components
 * - Gentle step-by-step instructions and hints in simple language
 */
export const FourierPuzzle: React.FC<FourierPuzzleProps> = ({ onSolve }) => {
  // ---------- CONFIG ----------
  const f0 = 0.3;               // true fundamental
  const tolerance = 0.02;       // slider correctness tolerance
  const harmonics = [1, 2, 3, 4, 5];     // candidates to choose in stage 2
  const correctSet = [1, 3, 5];          // actual present harmonics (0.3, 0.9, 1.5)

  
  // Canvas
  const W = 720;
  const H = 280;
  const seconds = 10;                 // 10 seconds span
  const xScale = W / seconds;
  const yScale = 60;

  // ---------- STATE ----------
  const [stage, setStage] = useState<1 | 2>(1);
  const [freqGuess, setFreqGuess] = useState(0.5);
  const [feedback, setFeedback] = useState("");
  const [selected, setSelected] = useState<number[]>([]); // selected harmonics in stage 2

  // ---------- DATA ----------
  const compositePoints = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= seconds * 50; i++) {
      const t = i / 50;
      const y =
        0.5 * Math.sin(2 * Math.PI * 0.3 * t) +
        0.35 * Math.sin(2 * Math.PI * 0.9 * t) +
        0.25 * Math.sin(2 * Math.PI * 1.5 * t);
      pts.push({ x: t, y });
    }
    return pts;
  }, []);

  // Vertical guide bars based on player’s frequency guess
  const periodGuess = 1 / Math.max(0.01, freqGuess);
  const guides = useMemo(() => {
    const arr: number[] = [];
    for (let t = 0; t <= seconds + 1e-9; t += periodGuess) arr.push(t);
    return arr;
  }, [periodGuess]);

  // Grid lines each second (vertical) + a few horizontal lines
  const xTicks = useMemo(() => {
    const arr: number[] = [];
    for (let t = 0; t <= seconds; t += 1) arr.push(t);
    return arr;
  }, []);
  const yTicks = useMemo(() => [-1, -0.5, 0, 0.5, 1], []);

  // In stage 2, draw the sum of selected harmonics so kids can *see* they match the cyan line
  const selectedSumPoints = useMemo(() => {
    if (stage !== 2 || selected.length === 0) return [];
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= seconds * 50; i++) {
      const t = i / 50;
      let y = 0;
      for (const n of selected) {
        const amp =
          n === 1 ? 0.5 :
          n === 3 ? 0.35 :
          n === 5 ? 0.25 : 0.15; // tiny default if they choose an extra wrong one
        y += amp * Math.sin(2 * Math.PI * (n * f0) * t);
      }
      pts.push({ x: t, y });
    }
    return pts;
  }, [stage, selected]);

  // ---------- ACTIONS ----------
  const nearCorrect = Math.abs(freqGuess - f0) < tolerance;

  const checkFundamental = () => {
    if (nearCorrect) {
      setFeedback("✅ Great! The smallest steady beat is 0.30 Hz. That’s our base brick.");
      setStage(2);
    } else {
      setFeedback("❌ Not quite. Try a smaller number so the bars land where the pattern repeats.");
    }
  };

  const toggleHarmonic = (n: number) => {
    setSelected((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  };

  const checkHarmonics = () => {
    const ok =
      selected.length === correctSet.length &&
      selected.every((n) => correctSet.includes(n));
    if (ok) {
      setFeedback("🎉 Nailed it! The signal is made of 0.3, 0.9, and 1.5 Hz.");
      onSolve(true);
    } else {
      setFeedback("❌ Close! Only pick the multiples that really appear in the cyan line.");
      onSolve(false);
    }
  };

  const resetPuzzle = () => {
    setStage(1);
    setFreqGuess(0.5);
    setSelected([]);
    setFeedback("");
  };

  // ---------- UI HELPERS ----------
  const toSvgPoints = (pts: { x: number; y: number }[]) =>
    pts.map((p) => `${p.x * xScale},${H / 2 - p.y * yScale}`).join(" ");

  // Colors (high contrast and readable)
  const colorGrid = "rgba(255,255,255,0.12)";
  const colorAxis = "rgba(255,255,255,0.35)";
  const colorComposite = "#00e5ff";       // cyan
  const colorSelectedSum = "#ff66cc";     // pink
  const colorGuideBase = "rgba(255,255,255,0.28)";
const colorGuideGood = "#4ade80";             // green when close

  return (
    <div className="space-y-5">
      {/* Friendly explanation */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
        <h3 className="font-semibold text-slate-100 mb-2">What are we doing?</h3>
        <p className="text-slate-300 text-sm">
          Imagine three musical notes played together. On the graph, they make one wiggly line (the{" "}
          <span className="font-medium text-slate-100">cyan line</span>). Your job is to:
        </p>
        <ol className="mt-2 text-slate-300 text-sm list-decimal list-inside space-y-1">
          <li>
            <span className="font-medium text-slate-100">Find the smallest steady beat</span> that fits the wiggles.
            Use the slider so the thin bars land where the pattern repeats.
          </li>
          <li>
            Then <span className="font-medium text-slate-100">pick which “notes”</span> (1×, 2×, 3×, … of that beat) are
            really inside the signal. You’ll see a{" "}
            <span className="font-medium text-slate-100">pink line</span> trying to match the cyan line.
          </li>
        </ol>

        <details className="mt-3 text-slate-300 text-sm">
          <summary className="cursor-pointer text-slate-200">Need a hint?</summary>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>Think of LEGO bricks. Tall towers are built from small, identical bricks.</li>
            <li>The fundamental is the size of the smallest brick.</li>
            <li>Harmonics are 2×, 3×, 4×… the brick size.</li>
          </ul>
        </details>
      </div>

      {/* Graph */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-3">

<svg width={W} height={H} className="rounded-lg border border-slate-700 bg-slate-900">
  {/* faint horizontal grid */}
  {[-2, -1, 1, 2].map((v) => (
    <g key={`y${v}`}>
      <line
        x1={0}
        y1={H / 2 - v * yScale}
        x2={W}
        y2={H / 2 - v * yScale}
        stroke="#374151"   // slate-700, visible gray
        strokeWidth={1}
      />
      <text
        x={4}
        y={H / 2 - v * yScale - 2}
        fontSize="10"
        fill="#9ca3af"
      >
        {v}
      </text>
    </g>
  ))}

  {/* ALWAYS draw zero axis, thick + bright */}
  <line
    x1={0}
    y1={H / 2}
    x2={W}
    y2={H / 2}
    stroke="#f87171"   // bright red so it’s obvious
    strokeWidth={3}
  />
  <text x={4} y={H / 2 - 4} fontSize="10" fill="#fca5a5">0</text>

  {/* vertical guides from slider */}
  {guides.map((t, i) => (
    <line
      key={`g${i}`}
      x1={t * xScale}
      y1={0}
      x2={t * xScale}
      y2={H}
      stroke="#60a5fa"   // bright blue for guides
      strokeWidth={2}
      strokeDasharray="6 6"
    />
  ))}

  {/* composite signal */}
  <polyline
    fill="none"
    stroke="#22d3ee"   // cyan
    strokeWidth={2}
    points={compositePoints.map(p => `${p.x * xScale},${H / 2 - p.y * yScale}`).join(" ")}
  />

  {/* harmonic sum (stage 2 only) */}
  {stage === 2 && selected.length > 0 && (
    <polyline
      fill="none"
      stroke="#f472b6"   // pink for selected harmonics
      strokeWidth={2}
      points={selectedSumPoints.map(p => `${p.x * xScale},${H / 2 - p.y * yScale}`).join(" ")}
    />
  )}
</svg>

        {/* legend */}
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2 w-6 rounded" style={{ background: colorComposite }}></span>
            Composite signal (goal)
          </span>
          {stage === 2 && (
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2 w-6 rounded" style={{ background: colorSelectedSum }}></span>
              Your chosen notes (sum)
            </span>
          )}
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-2 w-6 rounded border"
              style={{ background: nearCorrect ? "#4ade80" : "transparent", borderColor: "#9aa0a6" }}
            ></span>
            Repeat bars {nearCorrect ? "(great guess!)" : "(slide me)"}
          </span>
        </div>
      </div>

      {/* Controls */}
      {stage === 1 && (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <label className="text-slate-200 text-sm w-64">
              Try a repeating frequency (Hz):{" "}
              <span className="font-semibold">{freqGuess.toFixed(2)} Hz</span>
            </label>
            <input
              type="range"
              min={0.1}
              max={2}
              step={0.01}
              value={freqGuess}
              onChange={(e) => setFreqGuess(parseFloat(e.target.value))}
              className="w-full"
            />
            <button
              className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500"
              onClick={checkFundamental}
            >
              Check my beat
            </button>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            The thin bars are spaced by the period of your guess:{" "}
            {(1 / Math.max(0.01, freqGuess)).toFixed(2)} s. When your guess is good,
            the pattern lines up at each bar.
          </div>
        </div>
      )}

      {stage === 2 && (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
          <h4 className="text-slate-100 font-semibold mb-1">Now pick the “notes” (multiples of 0.30 Hz):</h4>
          <div className="flex flex-wrap gap-4">
            {harmonics.map((n) => (
              <label key={n} className="text-slate-200">
                <input
                  type="checkbox"
                  checked={selected.includes(n)}
                  onChange={() => toggleHarmonic(n)}
                  className="mr-2"
                />
                {n}× = {(n * f0).toFixed(n * f0 < 1 ? 1 : 1)} Hz
              </label>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500"
              onClick={checkHarmonics}
            >
              Submit my notes
            </button>
            <button
              className="px-3 py-1 rounded-lg border border-slate-600 text-slate-200 text-sm hover:border-indigo-500"
              onClick={resetPuzzle}
              type="button"
            >
              Start over
            </button>
          </div>

          <div className="mt-2 text-xs text-slate-400">
            Tip: Try turning on 1×, then 3×, then 5×. Watch the pink line try to sit right on the cyan line.
          </div>
        </div>
      )}

      {feedback && (
        <div className="rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-slate-200">
          {feedback}
        </div>
      )}
    </div>
  );
};