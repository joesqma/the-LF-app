import { CubeScene } from "~/components/cube-scene";

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Rubik's Cube
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Click and drag to rotate
        </p>
      </div>
      <div className="h-[480px] w-full max-w-lg">
        <CubeScene />
      </div>
    </main>
  );
}
