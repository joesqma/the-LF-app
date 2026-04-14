import { RefreshCw } from "lucide-react";

interface ScrambleDisplayProps {
  scramble: string;
  onNew: () => void;
}

export function ScrambleDisplay({ scramble, onNew }: ScrambleDisplayProps) {
  return (
    <div className="flex max-w-xl items-center gap-3 px-4 text-center">
      <p className="font-mono text-sm tracking-wide text-muted-foreground">
        {scramble}
      </p>
      <button
        type="button"
        aria-label="New scramble"
        onClick={onNew}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
    </div>
  );
}
