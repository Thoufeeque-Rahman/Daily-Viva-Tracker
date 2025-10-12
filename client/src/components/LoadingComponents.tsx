import { Spinner } from "./ui/spinner";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ 
  isVisible, 
  message = "Loading...", 
  className = "" 
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center space-y-4 min-w-[200px]">
        <Spinner size="lg" />
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

interface LoadingStateProps {
  isLoading: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

export function LoadingState({
  isLoading,
  error,
  children,
  loadingComponent,
  errorComponent,
}: LoadingStateProps) {
  if (error) {
    return (
      errorComponent || (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-600 font-medium">Something went wrong</p>
            <p className="text-gray-600 text-sm mt-2">{error}</p>
          </div>
        </div>
      )
    );
  }

  if (isLoading) {
    return (
      loadingComponent || (
        <div className="flex items-center justify-center p-8">
          <Spinner size="default" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      )
    );
  }

  return <>{children}</>;
}