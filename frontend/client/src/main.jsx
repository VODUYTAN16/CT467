import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { LanguageProvider } from "./contexts/LanguageContext.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next"; // Import I18nextProvider
import i18n from "./i18n/index.js"; // Import the i18n instance (explicit path to avoid resolver issues)

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        {" "}
        {/* Wrap with I18nextProvider */}
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </I18nextProvider>
    </BrowserRouter>
  </StrictMode>
);
