import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-8">
          <div className="text-center max-w-md">
            <span className="material-symbols-outlined text-6xl text-error mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            <h1 className="font-headline text-2xl font-bold text-on-surface mb-2">Something went wrong</h1>
            <p className="text-on-surface-variant mb-6">An unexpected error occurred. Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
