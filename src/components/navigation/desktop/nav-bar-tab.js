import React from "react";
import { NavLink } from "react-router-dom";

export const NavBarTab = ({ path, label }) => {
  return (
    <NavLink
      to={path}
<<<<<<< HEAD
      end
      className={({ isActive }) =>
        "nav-bar__tab " + (isActive ? "nav-bar__tab--active" : "")
      }
=======
      exact
      className="nav-bar__tab"
      activeClassName="nav-bar__tab--active"
>>>>>>> auth0-facu
    >
      {label}
    </NavLink>
  );
};
