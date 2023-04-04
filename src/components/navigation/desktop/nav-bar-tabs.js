import { useAuth0 } from "@auth0/auth0-react";
import React from "react";
import { NavBarTab } from "./nav-bar-tab";

export const NavBarTabs = () => {
  const { isAuthenticated } = useAuth0();

  return (
    <div className="nav-bar__tabs">
      {/* <NavBarTab path="/public" label="Public" /> */}
      {isAuthenticated && (
        <>
          {/* <NavBarTab path="/protected" label="Protected" /> */}
          <NavBarTab path="/profile" label="Perfil" />
          <NavBarTab path="/create-user" label="Alta de usuario" />
        </>
      )}
    </div>
  );
};
