import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', minHeight: 300, padding: 32, textAlign: 'center',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d94f5c" strokeWidth="1.5" style={{ marginBottom: 16 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 400, marginBottom: 20 }}>
            {this.state.error?.message || 'An unexpected error occurred rendering this page.'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: 'var(--card)', color: 'var(--text)', fontSize: 12, fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
