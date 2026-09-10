import { Component, type ErrorInfo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button, EmptyState } from "@repo/ui";

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** When this value changes, a caught error is cleared automatically (e.g. route pathname). */
  resetKey?: string | number;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

function AlertTriangleIcon() {
  return (
    <svg
      aria-hidden="true"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function DefaultFallback({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex w-full flex-col items-center">
      <EmptyState
        icon={<AlertTriangleIcon />}
        title={t("errors.boundary.title")}
        description={t("errors.boundary.description")}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={onReset}>{t("errors.boundary.retry")}</Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              {t("errors.boundary.reload")}
            </Button>
          </div>
        }
      />
    </div>
  );
}

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Unhandled render error:", error, info);
    this.props.onError?.(error, info);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultFallback onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorBoundaryClass {...props} />;
}