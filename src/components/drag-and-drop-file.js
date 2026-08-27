import React, { useState, useRef } from 'react';
import '../styles/drag-and-drop-file.css';

export function DragAndDropFile({ onFileDrop, accept, fileName, onFileRemove }) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            // Check if accept matches (basic check for extension or mime type)
            if (accept) {
                const acceptArray = accept.split(',').map(a => a.trim());
                const extension = "." + file.name.split('.').pop();
                if (acceptArray.includes(file.type) || acceptArray.includes(extension)) {
                    onFileDrop(file);
                } else {
                    alert("Tipo de archivo no soportado.");
                }
            } else {
                onFileDrop(file);
            }
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileDrop(e.target.files[0]);
        }
    };

    const handleRemoveClick = (e) => {
        e.stopPropagation();
        if (onFileRemove) {
            onFileRemove();
        }
    };

    return (
        <div 
            className={`drag-and-drop-container ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                accept={accept}
                hidden
            />
            <div className="drag-and-drop-content">
                <i className="upload-icon">📁</i>
                {fileName ? (
                    <div className="file-name-loaded-container">
                        <p className="file-name-loaded">Archivo cargado: <strong>{fileName}</strong></p>
                        <button type="button" className="remove-file-button" onClick={handleRemoveClick} title="Descartar archivo">
                            ✕
                        </button>
                    </div>
                ) : (
                    <p>Arrastrá y soltá el archivo Excel aquí, o <strong>hacé clic para buscar</strong></p>
                )}
            </div>
        </div>
    );
}
