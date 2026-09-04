import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import '@i18n';
import '@assets/styles/global.css';

import App from "./App";

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error(
    "[main.tsx]: Root element #root was not found in index.html. " +
      'Make sure <div id="root"></div> exists in your HTML template.',
  );
}

createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
);
