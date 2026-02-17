import React from 'react';

class RouteErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Route Error Boundary caught error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-4 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Oops! Something went wrong.
          </h2>
          <p className="text-gray-600 mb-6 max-w-md">
            We encountered an error while loading this page. This might be due to a network issue or a temporary glitch.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-6 py-2 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
