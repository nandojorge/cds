import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center border border-rose-100">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-[#09090B]">Ocorreu um erro na interface</h2>
              <p className="text-xs text-[#71717A]">
                {this.state.error?.message || 'A interface foi reiniciada para evitar inconsistências.'}
              </p>
            </div>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#18181B] text-white text-xs font-bold rounded-xl hover:bg-[#27272A] transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Recarregar Aplicação</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
