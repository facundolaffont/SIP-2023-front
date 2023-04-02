import React from "react";
import { NavLink } from "react-router-dom";

export const NavBarBrand = () => {
  return (
    <div className="nav-bar__brand">
<<<<<<< HEAD
      <NavLink to="/">
        <img
          className="nav-bar__logo"
          src="https://cdn-icons-png.flaticon.com/512/5167/5167510.png"
          alt="Auth0 shield logo"
          // width="55"
          // height="35"
=======
      <NavLink to="/" exact>
        <img
          className="nav-bar__logo"
          src="https://www.unlu.edu.ar/imagenes/logo.png"
          alt="Logo de la UNLu"
          //width="150"
          //height="150"
>>>>>>> auth0-facu
        />
      </NavLink>
    </div>
  );
};
