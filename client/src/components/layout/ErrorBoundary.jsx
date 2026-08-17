import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('[store] render error', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <section className="section" style={{ paddingTop: 90, textAlign: 'center' }}>
        <h1 className="serif-title" style={{ fontSize: 40 }}>Algo salió mal</h1>
        <p style={{ color: 'var(--ink-60)', margin: '10px 0 26px' }}>
          Recarga la página. Si el problema sigue, escríbenos por WhatsApp.
        </p>
        <button className="btn-dark" onClick={() => window.location.reload()}>
          Recargar
        </button>
      </section>
    );
  }
}
