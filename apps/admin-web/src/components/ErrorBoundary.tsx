import { Button, Result } from "antd";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // 可在此处上报错误日志，但不展示给用户
    console.error("ErrorBoundary caught:", _error, _errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="页面出了点小问题"
          subTitle="请尝试刷新页面，如果问题持续请联系技术支持。"
          extra={
            <Button
              type="primary"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
            >
              刷新页面
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}
