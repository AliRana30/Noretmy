import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { DarkModeContextProvider } from "./context/darkModeContext.jsx";
import axios from 'axios';
import "./index.css";

// Configure axios globally to always include withCredentials
axios.defaults.withCredentials = true;

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <DarkModeContextProvider>
      <App />
    </DarkModeContextProvider>
  </React.StrictMode>
);
