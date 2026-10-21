import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ padding: 32, maxWidth: 560 }}>
          <p className="eyebrow">Something interrupted this page</p>
          <h1 className="display" style={{ fontSize: 48 }}>The portal hit a snag.</h1>
          <p>Refresh the page. If it keeps happening, the clinic can reload the demo data by restarting the server.</p>
        </main>
      );
    }
    return this.props.children;
  }
}
