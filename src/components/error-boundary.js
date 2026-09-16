import React from "react";
import { Link } from "react-router-dom";
import "../styles/empty-state.css"; // Usamos los mismos estilos del EmptyState para mantener el diseño

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para que la siguiente renderización muestre la interfaz de repuesto
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // También puedes registrar el error en un servicio de reporte de errores
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="content-layout" style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1 id="page-title" className="content__title">
                ¡Ups! Algo salió mal.
            </h1>
            <div style={{ margin: '0 auto', maxWidth: '600px' }}>
                <p style={{ fontSize: '1.6rem', marginBottom: '40px', color: 'white' }}>
                    Ocurrió un error al cargar esta sección. Por favor, intentá de nuevo o volvé al inicio. Si el error continua contactá con los administradores.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                    <button 
                        className="button button--secondary" 
                        onClick={() => window.location.reload()}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '200px', height: '48px', boxSizing: 'border-box', margin: 0 }}
                    >
                        Recargar página
                    </button>
                    <Link 
                        to="/" 
                        className="button button--primary" 
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', minWidth: '200px', height: '48px', boxSizing: 'border-box', margin: 0 }}
                        onClick={() => this.setState({ hasError: false })}
                    >
                        Volver al inicio
                    </Link>
                </div>
            </div>
        </div>
      );
    }

    return this.props.children || null; 
  }
}
