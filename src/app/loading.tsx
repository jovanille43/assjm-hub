import { Crest } from "@/components/brand/crest";

export default function Loading() {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <div className="flex flex-col items-center gap-4">
        <Crest className="h-14 w-auto motion-safe:animate-float" />
        <div className="flex items-center gap-1.5">
          <span className="size-2 animate-bounce rounded-full bg-club [animation-delay:-0.3s]" />
          <span className="size-2 animate-bounce rounded-full bg-club [animation-delay:-0.15s]" />
          <span className="size-2 animate-bounce rounded-full bg-club" />
        </div>
      </div>
    </div>
  );
}
