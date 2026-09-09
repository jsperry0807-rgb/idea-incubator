import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@repo/ui";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={null}>
          <App />
        </Suspense>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);
