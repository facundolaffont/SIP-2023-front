import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { NavLink } from "react-router-dom";

export const NavBarAvatar = () => {
  const { user } = useAuth0();

  // No muestra nada, si el usuario está deslogueado.
  if(!user) return null;

  return (
    <div className="nav-bar__brand">
      <NavLink to="/profile" exact>
        <img className="profile__avatar"
            src={user.picture}
            alt="Avatar"
        />
      </NavLink>
      <NavLink to="/profile" exact>
        <div>
          <p>{user.nickname}</p>
          <p style={{ fontSize: 14, fontWeight: 300 }}>({user[`${process.env.REACT_APP_AUTH0_AUDIENCE}/roles`][0]})</p>
        </div>
      </NavLink>
    </div>
  );
};
