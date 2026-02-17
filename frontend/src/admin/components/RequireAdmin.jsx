// src/admin/components/RequireAdmin.jsx
import { Navigate } from "react-router-dom";

function decodeJwt(token) {
  try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
}

export default function RequireAdmin({ children }) {
  const t = localStorage.getItem("adminToken");
  if (!t) return <Navigate to="/admin/login" replace />;

  const p = decodeJwt(t);
  const expired = !p || (p.exp && p.exp * 1000 < Date.now());
  const isAdmin = p?.role === "admin";

  if (expired || !isAdmin) {
    localStorage.removeItem("adminToken");
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
