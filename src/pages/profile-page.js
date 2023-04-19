import { useAuth0 } from "@auth0/auth0-react";
import React from "react";
import { PageLayout } from "../components/page-layout";

export const ProfilePage = () => {
  const { user } = useAuth0();

  if (!user) {
    return null;
  }

  return (

  <PageLayout>
  <div class="bienvenida">
  <div class="profile__header">
    <img src={user.picture} alt="Profile" class="profile__avatar" />
  </div>
  <div class="content-layout">
    <h1 id="page-title" class="content__title">Bienvenido, {user.name}!</h1>
    <div class="profile__info">
      <h2>Mis datos</h2>
      <p>Correo electrónico: {user.email}</p>
    </div>
  </div>
</div>




    </PageLayout>



   /* <PageLayout>
      <div className="content-layout">
        <h1 id="page-title" className="content__title">
          Mi perfil
        </h1>
        <div className="content__body">
          <div className="profile-grid">
            <div className="profile__header">
              <img
                src={user.picture}
                alt="Profile"
                className="profile__avatar"
              />
              <div className="profile__headline">
                <h2 className="profile__title">{user.name}</h2>
                <span className="profile__description">{user.email}</span>
              </div>
            </div>
            <div className="profile__details">
              <CodeSnippet
                title="Token ID decodificado"
                code={JSON.stringify(user, null, 2)}
              />
            </div>
          </div>
        </div>
      </div>
    </PageLayout> */
  );
};
