"use client";

import type { StudioVolume } from "@/lib/studio";

export function StructureBars({
  volumes,
  activeId,
  onHover,
  onSelect,
  ariaLabel,
}: {
  volumes: StudioVolume[];
  activeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  ariaLabel: string;
}) {
  return (
    <div className="structure-bars" role="group" aria-label={ariaLabel}>
      {volumes.map((volume) => {
        const active = activeId === volume.id;
        const dimmed = activeId != null && !active;
        return (
          <button
            key={volume.id}
            type="button"
            aria-pressed={active}
            aria-label={volume.label}
            className={`structure-bar ${active ? "is-active" : ""} ${dimmed ? "is-dim" : ""}`}
            style={{
              flexGrow: Math.max(volume.weight, 0.04),
              background: volume.color,
            }}
            onMouseEnter={() => onHover(volume.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(volume.id)}
            onBlur={() => onHover(null)}
            onClick={() => onSelect(volume.id)}
          />
        );
      })}
    </div>
  );
}
