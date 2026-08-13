import React from 'react';
import '../styles/empty-state.css';

/**
 * Componente para mostrar cuando no hay datos o registros disponibles.
 * 
 * @param {Object} props
 * @param {string} props.message El mensaje a mostrar al usuario.
 */
export const EmptyState = ({ message }) => {
    return (
        <div className="empty-state-container">
            <p className="empty-state-text">{message}</p>
        </div>
    );
};

export default EmptyState;
