// src/types.ts
export interface Choice {
  label: string;
  next: string;
}

export interface Puzzle {
  type: string;
  concept: string;
  question: string;
  answer: string;
  success_next: string;
  fail_next: string;
  animation?: string;
  explanation?: string;
}

export interface Scene {
  id: string;
  title: string;
  text: string;
  choices?: Choice[];
  puzzle?: Puzzle;
  flags_set?: string[];
}

export interface Chapter {
  chapter: string;
  title: string;
  scenes: Scene[];
}

export interface GameState {
  current: string;
  flags: string[];
  history: string[];
  complete: boolean;
}