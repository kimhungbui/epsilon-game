// src/storage.ts
const SAVE_KEY = "scifi_textgame_save_v1";

export function saveState(state: any) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
}

export function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

import { useState, useEffect } from "react";

export function usePersistentState(initial: any) {
  const [state, setState] = useState(() => loadState() ?? initial);
  useEffect(() => { saveState(state); }, [state]);
  return [state, setState];
}