import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      error: error
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('🚨 Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo) => {
    // In production, send to error tracking service like Sentry
    console.log('📊 Would log to error tracking service:', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });
  };

  handleRetry = () => {
    // Retry logic with exponential backoff
    const maxRetries = 3;
    const retryCount = this.state.retryCount + 1;
    
    if (retryCount <= maxRetries) {
      console.log(`🔄 Retrying... Attempt ${retryCount}/${maxRetries}`);
      
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount
      });
      
      // Small delay before retry
      setTimeout(() => {
        window.location.reload();
      }, 1000 * retryCount); // Exponential backoff
    } else {
      console.log('❌ Max retries reached');
      alert('Unable to recover automatically. Please refresh the page manually.');
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, retryCount } = this.state;
      const maxRetries = 3;
      
      // Get error details for different error types
      const getErrorDetails = () => {
        if (error?.name === 'ChunkLoadError') {
          return {
            title: 'Loading Error',
            message: 'Failed to load application resources. This might be due to a network issue or an app update.',
            suggestion: 'Please try refreshing the page.'
          };
        } else if (error?.message?.includes('fetch')) {
          return {
            title: 'Network Error',
            message: 'Unable to connect to our servers. Please check your internet connection.',
            suggestion: 'Try again in a few moments.'
          };
        } else if (error?.message?.includes('Module not found')) {
          return {
            title: 'Module Error',
            message: 'A required component failed to load.',
            suggestion: 'This might be fixed by refreshing the page.'
          };
        } else {
          return {
            title: 'Unexpected Error',
            message: 'Something went wrong in the Travel Command Center.',
            suggestion: 'Our team has been notified and will investigate.'
          };
        }
      };

      const errorDetails = getErrorDetails();

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-6 text-center">
            {/* Error Icon */}
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {errorDetails.title}
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 mb-4">
              {errorDetails.message}
            </p>

            {/* Error Suggestion */}
            <p className="text-sm text-gray-500 mb-6">
              {errorDetails.suggestion}
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              {retryCount < maxRetries ? (
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
                </button>
              ) : (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Page
                </button>
              )}

              <button
                onClick={this.handleGoHome}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go to Dashboard
              </button>
            </div>

            {/* Error Details (Development) */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <Bug className="w-4 h-4" />
                  Technical Details (Dev Mode)
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono text-gray-700 max-h-40 overflow-auto">
                  <div className="mb-2">
                    <strong>Error:</strong> {error.toString()}
                  </div>
                  {error.stack && (
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs">{error.stack}</pre>
                    </div>
                  )}
                  {errorInfo && errorInfo.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs">{errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Support Information */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400">
                Error ID: {Date.now()}-{Math.random().toString(36).substr(2, 9)}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Render children normally if no error
    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export const withErrorBoundary = (Component, fallback) => {
  return function ComponentWithErrorBoundary(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

export default ErrorBoundary; 