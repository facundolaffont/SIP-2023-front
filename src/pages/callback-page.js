// Componentes externos.
import { useAuth0 } from "@auth0/auth0-react";

// Componentes internos.
import { NavBar } from "../components/navigation/desktop/nav-bar";
import { PageLayout } from "../components/page-layout.js";

export const CallbackPage = () => {
  const { error } = useAuth0();

  if (error) {
    return (
      <PageLayout>
        <div className="content-layout">
          <h1 id="page-title" className="content__title">
            Error
          </h1>
          <div className="content__body">
            <p id="page-description">
              <span>{error.message}</span>
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <div className="page-layout">
      <NavBar />
      <div className="page-layout__content" />
    </div>
  );
};
