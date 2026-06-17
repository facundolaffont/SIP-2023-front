import React, { useEffect, useRef } from 'react';
import '../styles/components/confirm-modal.css';

export const ConfirmModal = ({ 
    isOpen, 
    title = "Confirmar acción", 
    message, 
    onConfirm, 
    onCancel, 
    confirmText = "Aceptar", 
    cancelText = "Cancelar",
    confirmType = "danger" // 'danger' para borrar (rojo), 'primary' para guardar (azul/verde)
}) => {
    const dialogRef = useRef(null);

    // Sincronizamos la prop booleana de React con el API imperativo del DOM
    useEffect(() => {
        const dialogNode = dialogRef.current;
        if (!dialogNode) return;

        if (isOpen) {
            // showModal() bloquea el fondo y hace el focus trap automático
            dialogNode.showModal(); 
        } else {
            dialogNode.close();
        }
    }, [isOpen]);

    // Para evitar que la página se recargue si el modal está dentro de un form
    const handleConfirm = (e) => {
        e.preventDefault();
        onConfirm();
    };

    return (
        <dialog ref={dialogRef} className="custom-dialog" onCancel={onCancel}>
            <div className="dialog-content">
                <h3 className="dialog-title">{title}</h3>
                <p className="dialog-message">{message}</p>
                
                <div className="dialog-actions">
                    <button type="button" className="btn-modal btn-cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button 
                        type="button" 
                        className={`btn-modal btn-${confirmType}`} 
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </dialog>
    );
};