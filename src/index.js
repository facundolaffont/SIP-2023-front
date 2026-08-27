// Componentes externos.
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

// Componentes internos.
import { App } from "./app";
import { Auth0ProviderWithHistory } from "./auth0-provider-with-history";
import CourseProvider from "./contexts/course/course-provider";
import SpreadsheetProvider from "./contexts/spreadsheet/spreadsheet-provider";

// Estilos.
import "./styles/styles.css";

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithHistory>
        <SpreadsheetProvider>
          <CourseProvider>
            <App />
          </CourseProvider>
        </SpreadsheetProvider>
      </Auth0ProviderWithHistory>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);
