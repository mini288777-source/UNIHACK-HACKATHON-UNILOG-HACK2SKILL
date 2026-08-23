import { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI application:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#120806] text-[#FBDBD6] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#1F0F0C] border border-[#5C403B] rounded-2xl p-8 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#DD2E18]/20 text-[#FEAA00] mx-auto flex items-center justify-center font-bold text-xl">
              !
            </div>
            <h2 className="text-xl font-bold text-white">Application Refresh Required</h2>
            <p className="text-xs text-[#E6BDB6] leading-relaxed">
              An unexpected UI state occurred. Click below to reload the workspace.
            </p>
            <button
              onClick={() => {
                window.location.hash = '#upload';
                window.location.reload();
              }}
              className="w-full py-2.5 bg-[#FEAA00] hover:bg-[#FFB950] text-[#452B00] font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg cursor-pointer"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const container = document.getElementById('root');
if (container) {
  // Prevent duplicate React root mount during Vite HMR
  const rootKey = '__react_root__';
  let root = (container as any)[rootKey];
  if (!root) {
    root = ReactDOM.createRoot(container);
    (container as any)[rootKey] = root;
  }
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}
