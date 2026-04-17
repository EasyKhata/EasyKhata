import React from "react";

// Chunk-load failures happen when the browser has a cached reference to an old
// JS bundle that no longer exists after a new deployment. The only fix is a
// hard reload to fetch the new chunks.
function isChunkLoadError(error) {
  const msg = error?.message || "";
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("Loading chunk") ||
    msg.includes("Loading CSS chunk") ||
    /\.js\)$/.test(msg)
  );
}

function ChunkErrorFallback() {
  React.useEffect(() => {
    const t = setTimeout(() => window.location.reload(), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #fff)",
        padding: 24
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚡</div>
        <h2 style={{ color: "var(--text, #111)", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          New version available
        </h2>
        <p style={{ color: "var(--text-sec, #555)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          EasyKhata was updated. Reloading to get the latest version…
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: "var(--accent, #4f46e5)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Reload now
        </button>
      </div>
    </div>
  );
}

function DefaultFallback({ onRetry }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #fff)",
        padding: 24
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚠</div>
        <h2 style={{ color: "var(--text, #111)", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          Something went wrong
        </h2>
        <p style={{ color: "var(--text-sec, #555)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          An unexpected error occurred. Try again or reload the page if the problem persists.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={onRetry}
            style={{
              background: "var(--accent, #4f46e5)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "var(--surface-high, #f5f5f5)",
              color: "var(--text, #111)",
              border: "1px solid var(--border, #e0e0e0)",
              borderRadius: 10,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[EasyKhata] Uncaught error:", error, info);
  }

  handleRetry() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      if (isChunkLoadError(this.state.error)) {
        return <ChunkErrorFallback />;
      }
      return <DefaultFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}
