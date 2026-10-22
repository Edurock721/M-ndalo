import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Robust Error Boundary to guarantee the app NEVER stays on a blank screen
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#090D16',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: "'Outfit', system-ui, sans-serif",
          textAlign: 'center'
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            marginBottom: 16
          }}>
            ⚠️
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            Hubo un detalle al cargar MÁNDALO!
          </h2>
          <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 440, marginBottom: 16 }}>
            {this.state.error?.message || 'Error de inicialización de la interfaz.'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              background: 'linear-gradient(135deg, #FF5E36, #FF2A54)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 9999,
              padding: '12px 28px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(255, 94, 54, 0.4)'
            }}
          >
            Restablecer Datos & Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
