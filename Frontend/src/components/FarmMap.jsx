import { useMemo } from "react";

const healthColor = (h) =>
  h >= 75 ? "rgba(22, 163, 74, 0.82)" : h >= 55 ? "rgba(217, 119, 6, 0.82)" : "rgba(220, 38, 38, 0.82)";

export function FarmMap({ fields, selectedId, onSelect, height = 460 }) {
  const points = useMemo(
    () =>
      fields.map((f) => ({
        ...f,
        path: f.polygon.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ") + " Z",
        center: [
          f.polygon.reduce((s, p) => s + p[0], 0) / f.polygon.length,
          f.polygon.reduce((s, p) => s + p[1], 0) / f.polygon.length,
        ],
      })),
    [fields]
  );

  return (
    <div className="tp-farmmap" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%" }}>
        <defs>
          <pattern id="tp-map-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--tp-neutral-200)" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="var(--tp-green-50)" />
        <rect x="0" y="0" width="100" height="100" fill="url(#tp-map-grid)" />

        {/* roads */}
        <path d="M 52 0 L 52 100" stroke="var(--tp-earth-200)" strokeWidth="2.4" fill="none" />
        <path d="M 0 47 L 100 47" stroke="var(--tp-earth-200)" strokeWidth="2.4" fill="none" />

        {points.map((f) => {
          const active = f.id === selectedId;
          return (
            <g
              key={f.id}
              onClick={() => onSelect(f.id)}
              role="button"
              aria-label={`${f.name}, health ${f.health}`}
              style={{ cursor: "pointer" }}
            >
              <path
                d={f.path}
                fill={healthColor(f.health)}
                stroke={active ? "var(--tp-neutral-900)" : "var(--tp-neutral-0)"}
                strokeWidth={active ? 0.8 : 0.5}
                style={{ transition: "all var(--tp-transition)" }}
              />
              {active && (
                <path
                  d={f.path}
                  fill="none"
                  stroke="var(--tp-neutral-900)"
                  strokeWidth="0.4"
                  strokeDasharray="1.5 1.5"
                  opacity="0.6"
                />
              )}
              <text
                x={f.center[0]}
                y={f.center[1] - 1}
                textAnchor="middle"
                fontSize="3"
                fontWeight="700"
                fill="var(--tp-neutral-900)"
                style={{ pointerEvents: "none" }}
              >
                {f.name}
              </text>
              <text
                x={f.center[0]}
                y={f.center[1] + 3}
                textAnchor="middle"
                fontSize="2.2"
                fill="var(--tp-neutral-700)"
                style={{ pointerEvents: "none" }}
              >
                {f.crop}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="tp-farmmap-legend">
        <span className="tp-farmmap-legend-item"><i style={{ background: healthColor(80) }} />Healthy</span>
        <span className="tp-farmmap-legend-item"><i style={{ background: healthColor(60) }} />Moderate</span>
        <span className="tp-farmmap-legend-item"><i style={{ background: healthColor(40) }} />Stressed</span>
      </div>
    </div>
  );
}
