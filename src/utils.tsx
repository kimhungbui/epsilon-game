// src/utils.ts
export function paragraphs(text: string) {
  return String(text).split(/\n\n+/).map((p, i) => (
    <p key={i} className="text-base leading-7 text-slate-200">{p}</p>
  ));
}

export function isCorrect(userInput: string, answer: string) {
  const a = String(userInput).trim();
  const b = String(answer).trim();
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) {
    return Math.abs(na - nb) <= 1e-6;
  }
  return a.toLowerCase() === b.toLowerCase();
}