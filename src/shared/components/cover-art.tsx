import { useState } from "react";
import { cn } from "../lib/utils.ts";

export function CoverArt({
  title,
  artist,
  hue,
  coverUrl,
  className,
}: {
  title: string;
  artist: string;
  hue: number;
  coverUrl?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(!coverUrl);
  const initials = `${title.trim().charAt(0)}${artist.trim().charAt(0)}`.toUpperCase();
  return (
    <div
      className={cn("relative overflow-hidden rounded-lg", className)}
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 72% 46%), hsl(${(hue + 36) % 360} 42% 14%))`,
      }}
    >
      {coverUrl && !failed ? (
        <img
          src={coverUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="grid h-full w-full place-items-center text-xs font-bold tracking-wide text-white">
          {initials || "♪"}
        </span>
      )}
    </div>
  );
}
