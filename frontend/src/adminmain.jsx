import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { DialogProvider } from "./context/DialogContext"; // Import DialogProvider
import "./index.css";
import AdminApp from "./AdminApp";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DialogProvider>
      <BrowserRouter>
        <AdminApp />
      </BrowserRouter>
    </DialogProvider>
  </StrictMode>
);
