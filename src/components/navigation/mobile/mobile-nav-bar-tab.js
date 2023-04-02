import React from "react";
import { NavLink } from "react-router-dom";

export const MobileNavBarTab = ({ path, label, handleClick }) => {
  return (
    <NavLink
<<<<<<< HEAD
      onClick={handleClick}
      to={path}
      end
      className={({ isActive }) =>
        "mobile-nav-bar__tab " + (isActive ? "mobile-nav-bar__tab--active" : "")
      }
=======
      to={path}
      onClick={handleClick}
      exact
      className="mobile-nav-bar__tab"
      activeClassName="mobile-nav-bar__tab--active"
>>>>>>> auth0-facu
    >
      {label}
    </NavLink>
  );
};
