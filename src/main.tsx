import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

// Static Pages hosting cannot rewrite a deep route to index.html.
const Router =
  import.meta.env.VITE_HOSTING_TARGET === "github-pages"
    ? HashRouter
    : BrowserRouter;

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
);
