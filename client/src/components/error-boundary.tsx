import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-xl font-semibold">Что-то пошло не так</h1>
            <p className="text-sm text-muted-foreground">
              Страница не смогла загрузиться. Попробуйте обновить или вернуться на главную.
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button type="button" onClick={() => window.location.reload()}>
                Обновить
              </Button>
              <Button type="button" variant="outline" onClick={() => (window.location.href = "/")}>
                На главную
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
