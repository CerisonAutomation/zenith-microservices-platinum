import React from 'react';
import { Button } from './atomic';

// Error Boundary Component - Elite Error Handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log error to external service (in production)
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Report error to analytics/monitoring service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }

    // Send error report to backend
    this.reportError(error, errorInfo, errorId);
  }

  reportError = async (error, errorInfo, errorId) => {
    try {
      const errorReport = {
        errorId,
        message: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: localStorage.getItem('userId') || 'anonymous'
      };

      // Send to error reporting endpoint
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport)
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorId } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f0f0f',
          color: '#ffffff',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '600px',
            textAlign: 'center',
            backgroundColor: '#1a1a1a',
            padding: '40px',
            borderRadius: '12px',
            border: '1px solid #333'
          }}>
            {/* Error Icon */}
            <div style={{
              fontSize: '64px',
              marginBottom: '24px',
              color: '#ef4444'
            }}>
              ⚠️
            </div>

            {/* Error Title */}
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '#ffffff'
            }}>
              Something went wrong
            </h1>

            {/* Error Message */}
            <p style={{
              fontSize: '16px',
              color: '#a1a1aa',
              marginBottom: '32px',
              lineHeight: '1.6'
            }}>
              We apologize for the inconvenience. Our team has been notified and is working to fix this issue.
            </p>

            {/* Error ID for support */}
            <div style={{
              backgroundColor: '#27272a',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontFamily: 'monospace',
              fontSize: '14px',
              color: '#a1a1aa'
            }}>
              Error ID: {errorId}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <Button
                variant="primary"
                onClick={this.handleRetry}
                style={{ minWidth: '120px' }}
              >
                Try Again
              </Button>
              <Button
                variant="secondary"
                onClick={this.handleReload}
                style={{ minWidth: '120px' }}
              >
                Reload Page
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                style={{ minWidth: '120px' }}
              >
                Go Back
              </Button>
            </div>

            {/* Support Information */}
            <div style={{
              marginTop: '32px',
              padding: '20px',
              backgroundColor: '#27272a',
              borderRadius: '8px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'semibold',
                marginBottom: '12px',
                color: '#ffffff'
              }}>
                Need Help?
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#a1a1aa',
                marginBottom: '16px'
              }}>
                Contact our support team with the error ID above for faster assistance.
              </p>
              <div style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <a
                  href="mailto:support@zenith.com"
                  style={{
                    color: '#3b82f6',
                    textDecoration: 'none',
                    padding: '8px 16px',
                    border: '1px solid #3b82f6',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  Email Support
                </a>
                <a
                  href="/help"
                  style={{
                    color: '#3b82f6',
                    textDecoration: 'none',
                    padding: '8px 16px',
                    border: '1px solid #3b82f6',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  Help Center
                </a>
              </div>
            </div>

            {/* Development Error Details */}
            {isDevelopment && (
              <details style={{
                marginTop: '24px',
                textAlign: 'left',
                backgroundColor: '#27272a',
                padding: '16px',
                borderRadius: '8px'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: 'semibold',
                  color: '#ffffff',
                  marginBottom: '12px'
                }}>
                  Development Error Details
                </summary>
                <div style={{
                  backgroundColor: '#18181b',
                  padding: '12px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#ef4444',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Error:</strong> {error.toString()}
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Stack:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', margin: '8px 0' }}>
                      {error.stack}
                    </pre>
                  </div>
                  <div>
                    <strong>Component Stack:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', margin: '8px 0' }}>
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Component - Elite Loading States
export const LoadingSpinner = ({
  size = 'md',
  color = 'primary',
  text = null,
  fullScreen = false
}) => {
  const sizeStyles = {
    xs: { width: '16px', height: '16px' },
    sm: { width: '24px', height: '24px' },
    md: { width: '32px', height: '32px' },
    lg: { width: '48px', height: '48px' },
    xl: { width: '64px', height: '64px' }
  };

  const spinnerStyle = {
    ...sizeStyles[size],
    border: `3px solid #27272a`,
    borderTop: `3px solid #eab308`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    display: 'inline-block'
  };

  const containerStyle = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 15, 15, 0.8)',
    zIndex: 9999,
    flexDirection: 'column',
    gap: '16px'
  } : {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '12px'
  };

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle} />
      {text && (
        <p style={{
          margin: 0,
          color: '#a1a1aa',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          {text}
        </p>
      )}
    </div>
  );
};

// Suspense Fallback Component
export const SuspenseFallback = ({ message = "Loading..." }) => (
  <LoadingSpinner fullScreen text={message} />
);

// Global Error Handler Hook
export const useErrorHandler = () => {
  const handleError = React.useCallback((error, errorInfo = null) => {
    console.error('Error handled by hook:', error, errorInfo);

    // Report to error tracking service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }

    // You can also send to your error reporting service here
  }, []);

  return handleError;
};

// Add CSS animation for spinner
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default ErrorBoundary;