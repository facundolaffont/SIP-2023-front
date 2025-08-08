// Componentes externos.
import { useAuth0 } from "@auth0/auth0-react";

// Componentes internos.
import { LogoutButton } from "../../buttons/logout-button";

export const NavBarButtons = () => {
  const { isAuthenticated } = useAuth0();

  return (
    <div className="nav-bar__buttons">
      {isAuthenticated && (
        <>
          <LogoutButton />
        </>
      )}
    </div>
  );
};
