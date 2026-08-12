import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
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
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 max-w-md w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900">Đã có lỗi xảy ra</h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Ứng dụng gặp sự cố khi hiển thị dữ liệu. Bạn có thể nhấn nút bên dưới để tải lại trang.
            </p>
            {this.state.error && (
              <div className="bg-slate-50 p-3 rounded-lg text-left text-[11px] font-mono text-slate-600 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              TẢI LẠI TRANG
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
