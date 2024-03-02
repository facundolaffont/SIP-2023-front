import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/components/criterion-menu.css'; // Archivo de estilos CSS

export const CriterionMenu = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className={`menu ${menuOpen ? 'open' : ''}`}>
      <div className="menu-header" onClick={toggleMenu}>
        Menú
      </div>
      <ul className="menu-items">
        <li><Link to="/pagina1">Página 1</Link></li>
        <li><Link to="/pagina2">Página 2</Link></li>
        <li><Link to="/pagina3">Página 3</Link></li>
        {/* Otros elementos del menú si es necesario */}
      </ul>
    </div>
  );
};

export default CriterionMenu;
