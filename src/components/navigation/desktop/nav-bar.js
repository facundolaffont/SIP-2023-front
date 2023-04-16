import React from "react";
import { NavBarAvatar } from "./nav-bar-avatar";
import { NavBarButtons } from "./nav-bar-buttons";
import { NavBarTabs } from "./nav-bar-tabs";

export const NavBar = () => {
  return (
    <div className="nav-bar__container">
      <nav className="nav-bar">
        <NavBarAvatar />
        <NavBarTabs />
        <NavBarButtons />
      </nav>
    </div>
  );
};
