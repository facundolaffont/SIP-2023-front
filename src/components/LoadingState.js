import React from 'react';

/**
 * Componente para mostrar cuando la página está cargando datos del backend.
 * 
 * @param {Object} props
 * @param {string} props.message El mensaje a mostrar al usuario.
 */
export const LoadingState = ({ message = "Cargando, por favor espere..." }) => {
    return (
        <div className="modal-loading">
            <div className="spinner"></div>
            <p style={{fontSize: '20px'}}>{message}</p>
        </div>
    );
};

export default LoadingState;
