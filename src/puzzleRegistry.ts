import { FourierPuzzle } from "./components/FourierPuzzle";

export const puzzleRegistry: Record<string, React.FC<{ onSolve: (ok: boolean) => void }>> = {
  "Fourier frequencies": FourierPuzzle,
};