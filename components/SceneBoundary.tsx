"use client";

import { Component, type ReactNode } from "react";

/** Keep the navigation and measured plan available if the renderer or an asset fails. */
export class SceneBoundary extends Component<{
  children: ReactNode;
  fallback: ReactNode;
  onUnavailable: () => void;
}, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onUnavailable();
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
