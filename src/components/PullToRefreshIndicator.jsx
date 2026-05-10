import React from "react";

// Visual indicator for the pull-to-refresh gesture. Renders an arrow that
// rotates as the user pulls toward the threshold, then a spinner while the
// refresh runs. Caller positions this absolutely at the top of the scroll
// container and feeds in `status` + `progress` from usePullToRefresh.
export default function PullToRefreshIndicator({ status, progress = 0, style }) {
  const isRefreshing = status === "refreshing";
  const isArmed = status === "armed";
  const rotate = Math.min(180, progress * 180);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: -50,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 5,
        ...style
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: "var(--surface-high)",
          border: `1px solid ${isArmed ? "var(--accent)" : "var(--border)"}`,
          boxShadow: isArmed
            ? "0 4px 16px color-mix(in srgb, var(--accent) 28%, transparent)"
            : "0 2px 8px rgba(12, 9, 8, 0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color 0.18s ease, box-shadow 0.18s ease"
        }}
      >
        {isRefreshing ? (
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: "spin 0.9s linear infinite" }}>
            <circle cx="12" cy="12" r="9" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="42" strokeDashoffset="20" />
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            style={{
              transform: `rotate(${rotate}deg)`,
              transition: "transform 0.05s linear",
              color: isArmed ? "var(--accent)" : "var(--text-dim)"
            }}
          >
            <path d="M12 4v14M5 11l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </div>
  );
}
