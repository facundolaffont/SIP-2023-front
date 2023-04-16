import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { NavLink } from "react-router-dom";

export const NavBarAvatar = () => {
  const { user } = useAuth0();

  // No muestra nada, si el usuario está deslogueado.
  if(!user) return null;

  return (
    <div className="nav-bar__brand">
      <NavLink to="/" exact>
          <img className="profile__avatar"
              src={user.picture}
              alt="Avatar"
          />     
      </NavLink>
        <div>
          <p>{user.nickname}</p>
          <p>({user["https://hello-world.example.com/user_metadata"].role})</p>
        </div>
    </div>
  );
};
