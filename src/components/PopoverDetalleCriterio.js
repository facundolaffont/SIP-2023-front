import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import '../styles/PopoverDetalleCriterio.css';

export const PopoverDetalleCriterio = ({ detalle }) => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef();

  const handleClickOutside = (event) => {
    if (popoverRef.current && !popoverRef.current.contains(event.target)) {
      setOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!detalle) return null;

  return (
    <div className="popover-wrapper" ref={popoverRef}>
      <button className="popover-trigger" onClick={() => setOpen(!open)}>
        <FontAwesomeIcon icon={faEllipsisV} />
      </button>
      {open && (
        <div className="popover-box">
          {detalle.Criterio && ( <h4 className="popover-title">Criterio: {detalle.Criterio}</h4>)}

          {detalle.Criterio === "Asistencias" && (
            <>
              <p><strong>Presencias:</strong> {detalle.PresenciasAlumno}</p>
              <p><strong>Cantidad de clases:</strong> {detalle.CantidadEventos}</p>
              <p><strong>Porcentaje:</strong>{detalle.PorcentajeAsistencias}%</p>
            </>
          )}

          {detalle.Criterio === "Trabajos prácticos aprobados" && (
            <>
              <p><strong>TPs aprobados (contando recuperatorios):</strong> {detalle.CantidadTPsAprobados}</p>
              <p><strong>Cantidad de TPs:</strong> {detalle.CantidadTPs}</p>
              <p><strong>Porcentaje:</strong> {detalle.PorcentajeTPsAprobados}%</p>
            </>
          )}

          {detalle.Criterio === "Trabajos prácticos recuperados" && (
            <>
              <p><strong>TPs recuperados:</strong> {detalle.CantidadTPsRecuperadosAlumno}</p>
              <p><strong>Cantidad de TPs:</strong> {detalle.CantidadTPs}</p>
              <p><strong>Porcentaje:</strong> {detalle.PorcentajeTPsRecuperados}%</p>
            </>
          )}

          {detalle.Criterio === "Parciales aprobados" && (
            <>
              <p><strong>Parciales aprobados (contando recuperatorios):</strong> {detalle.CantidadParcialesAprobadosAlumno}</p>
              <p><strong>Cantidad de parciales:</strong> {detalle.CantidadParciales}</p>
              <p><strong>Porcentaje:</strong> {detalle.PorcentajeParcialesAprobados}%</p>
            </>
          )}

          {detalle.Criterio === "Parciales recuperados" && (
            <>
              <p><strong>Parciales recuperados:</strong> {detalle.CantidadParcialesRecuperadosAlumno}</p>
              <p><strong>Cantidad de parciales:</strong> {detalle.CantidadParciales}</p>
              <p><strong>Porcentaje:</strong> {detalle.PorcentajeParcialesRecuperados}%</p>
            </>
          )}

          {detalle.Criterio === "Autoevaluaciones aprobadas" && (
            <>
              <p><strong>Autoevaluaciones aprobadas (contando recuperatorios):</strong> {detalle.CantidadAEAprobadasAlumno}</p>
              <p><strong>Cantidad de Autoevaluaciones:</strong> {detalle.CantidadAEs}</p>
              <p><strong>Porcentaje:</strong> {detalle.PorcentajeAEAprobadas}%</p>
            </>
          )}

          
          {detalle.Criterio === "Autoevaluaciones recuperadas" && (
            <>
              <p><strong>Autoevaluaciones recuperadas:</strong> {detalle.CantidadAERecuperadasAlumno}</p>
              <p><strong>Cantidad de Autoevaluaciones:</strong> {detalle.CantidadAEs}</p>
              <p><strong>Porcentaje:</strong> {detalle.PorcentajeAERecuperadas}%</p>
            </>
          )}

          {detalle.Criterio === "Promedio de parciales" && (
            <p><strong>Promedio de parciales (contando recuperatorios aprobados):</strong> {detalle.PromedioParciales}</p>
          )}

          {detalle.Criterio === "Integrador aprobado" && (
            <p><strong>Nota:</strong> {detalle.NotaIntegrador}</p>
          )}
        </div>
      )}
    </div>
  );
};
