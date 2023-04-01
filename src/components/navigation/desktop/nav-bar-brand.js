import React from "react";
import { NavLink } from "react-router-dom";

export const NavBarBrand = () => {
  return (
    <div className="nav-bar__brand">
      <NavLink to="/" exact>
        <img
          className="nav-bar__logo"
          src="https://www.unlu.edu.ar/imagenes/logo.png"
          alt="Logo de la UNLu"
          //width="150"
          //height="150"
        />
      </NavLink>
    </div>
  );
};
