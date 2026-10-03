import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "@fontsource/noto-sans-devanagari/devanagari-400.css";
import "@fontsource/noto-sans-devanagari/devanagari-700.css";
import App from "./App.jsx";
import AuthProvider from "./context/AuthProvider.jsx";
import "./i18n.js";

axios.defaults.withCredentials = true;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
