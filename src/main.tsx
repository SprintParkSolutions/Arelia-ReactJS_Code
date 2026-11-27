import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import { PortalBackConfirmation } from "./components/auth/PortalBackConfirmation";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "*",
    element: (
      <>
        <App />
        <PortalBackConfirmation />
      </>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
