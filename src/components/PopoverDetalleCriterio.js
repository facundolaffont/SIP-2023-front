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
          {detalle.PresenciasAlumno !== undefined && <p><strong>Presencias:</strong> {detalle.PresenciasAlumno}</p>}
          {detalle.CantidadEventos !== undefined && <p><strong>Eventos:</strong> {detalle.CantidadEventos}</p>}
          {detalle.PorcentajeAsistencias !== undefined && <p><strong>Porcentaje:</strong> {detalle.PorcentajeAsistencias}%</p>}

          {detalle.CantidadTPsAprobados !== undefined && <p><strong>TPs aprobados:</strong> {detalle.CantidadTPsAprobados}</p>}
          {detalle.CantidadTPs !== undefined && <p><strong>Cantidad de TPs:</strong> {detalle.CantidadTPs}</p>}
          {detalle.PorcentajeTPsAprobados !== undefined && <p><strong>Porcentaje:</strong> {detalle.PorcentajeTPsAprobados}%</p>}

          {detalle.CantidadTPsRecuperadosAlumno !== undefined && <p><strong>TPs recuperados:</strong> {detalle.CantidadTPsRecuperadosAlumno}</p>}
          {detalle.CantidadTPsRecuperados !== undefined && <p><strong>Cantidad de recuperatorios de TPs:</strong> {detalle.CantidadTPsRecuperados}</p>}
          {detalle.PorcentajeTPsRecuperados !== undefined && <p><strong>Porcentaje:</strong> {detalle.PorcentajeTPsRecuperados}%</p>}

          {detalle.CantidadParcialesRecuperadosAlumno !== undefined && <p><strong>Parciales recuperados:</strong> {detalle.CantidadParcialesRecuperadosAlumno}</p>}
          {detalle.CantidadParcialesRecuperados !== undefined && <p><strong>Cantidad de recuperatorios de parciales:</strong> {detalle.CantidadParcialesRecuperados}</p>}
          {detalle.PorcentajeParcialesRecuperados !== undefined && <p><strong>Porcentaje:</strong> {detalle.PorcentajeParcialesRecuperados}%</p>}

          {detalle.CantidadParcialesAprobadosAlumno !== undefined && <p><strong>Parciales aprobados:</strong> {detalle.CantidadParcialesAprobadosAlumno}</p>}
          {detalle.CantidadParciales !== undefined && <p><strong>Cantidad de parciales:</strong> {detalle.CantidadParciales}</p>}
          {detalle.PorcentajeParcialesAprobados !== undefined && <p><strong>Porcentaje:</strong> {detalle.PorcentajeParcialesAprobados}%</p>}

          {detalle.PromedioParciales !== undefined && <p><strong>Promedio de parciales:</strong> {detalle.PromedioParciales}</p>}

          {detalle.CantidadAEAprobadasAlumno !== undefined && <p><strong>Autoevaluaciones aprobados:</strong> {detalle.CantidadAEAprobadasAlumno}</p>}
          {detalle.CantidadAEs !== undefined && <p><strong>Cantidad de Autoevaluaciones:</strong> {detalle.CantidadAEs}</p>}
          {detalle.PorcentajeAEAprobadas !== undefined && <p><strong>Porcentaje:</strong> {detalle.PorcentajeAEAprobadas}%</p>}

          {detalle.CantidadAERecuperadasAlumno !== undefined && <p><strong>Autoevaluaciones recuperadas:</strong> {detalle.CantidadAERecuperadasAlumno}</p>}
          {detalle.CantidadAEs !== undefined && <p><strong>Cantidad de Autoevaluaciones:</strong> {detalle.CantidadAEs}</p>}
          {detalle.PorcentajeAERecuperadas !== undefined && <p><strong>Porcentaje:</strong> {detalle.PorcentajeAERecuperadas}%</p>}

          {detalle.NotaIntegrador !== undefined && <p><strong>Nota:</strong> {detalle.NotaIntegrador}</p>}

        </div>
      )}
    </div>
  );
};
