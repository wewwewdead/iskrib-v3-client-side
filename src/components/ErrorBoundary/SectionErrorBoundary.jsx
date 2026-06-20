import React from 'react';
import './sectionErrorBoundary.css';

// Reusable error boundary for self-contained page sections (profile tabs,
// feed panels, etc.). Keeps a render error in one section from unmounting the
// whole app to a blank screen. Resets when `resetKey` changes (e.g. on route
// change) so navigating away clears a prior failure.
class SectionErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="section-error-boundary" role="alert">
          <p className="section-error-title">{this.props.label || "This section couldn't load"}</p>
          <p className="section-error-subtitle">Something went wrong on our end. Try again.</p>
          <button type="button" className="section-error-retry" onClick={this.handleRetry}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default SectionErrorBoundary;
