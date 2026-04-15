import React from "react";

function DefaultFallback({ error, onRetry }) {
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
          An unexpected error occurred. Refreshing usually fixes this.
          {error?.message ? ` (${error.message})` : ""}
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
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary] Uncaught React error:", error, info);
    }
  }

  handleRetry() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <DefaultFallback error={this.state.error} onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}
