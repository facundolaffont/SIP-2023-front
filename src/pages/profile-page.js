import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect } from "react";
import { CodeSnippet } from "../components/code-snippet";
import { PageLayout } from "../components/page-layout";
import { useState } from "react";

import jwt from 'jwt-decode'

export const ProfilePage = () => {
  const { user, getAccessTokenSilently } = useAuth0();

  const [userPermissions, setUserPermissions] = useState([])

  useEffect(() => {
    let isMounted = true;

    const getPermissions = async () => {
      const accessToken = await getAccessTokenSilently();
      const permissions = jwt(accessToken).permissions;

      if (!isMounted) {
        return;
      }

      if (permissions) {
        setUserPermissions(permissions);
      }
    };

    getPermissions();

    return () => {
      isMounted = false;
    };
  }, [getAccessTokenSilently]);

  if (!user) {
    return null;
  }

  return (
    <PageLayout>
      <div className="content-layout">
        <h1 id="page-title" className="content__title">
          Profile Page
        </h1>
        <div className="content__body">
          <p id="page-description">
            <span>
              You can use the <strong>ID Token</strong> to get the profile
              information of an authenticated user.
            </span>
            <span>
              <strong>Only authenticated users can access this page.</strong>
            </span>
          </p>
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
                {userPermissions}
              </div>
            </div>
            <div className="profile__details">
              <CodeSnippet
                title="Decoded ID Token"
                code={JSON.stringify(user, null, 2)}
              />              
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
