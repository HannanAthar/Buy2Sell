// src/AdminApp.jsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AdminLayout from "./admin/components/AdminLayout";
import AdminLogin from "./admin/components/AdminLogin";
import RequireAdmin from "./admin/components/RequireAdmin";

// Static imports to ensure reliability
import AdminDashboard from "./admin/components/AdminDashboard";
import AdminUserManagement from "./admin/components/AdminUserManagement";
import AdminDesignerManagement from "./admin/components/AdminDesignerManagement";
import AdminResellerManagement from "./admin/components/AdminResellerManagement";
import AdminProductManagement from "./admin/components/AdminProductManagement";
import AdminCustomProducts from "./admin/components/AdminCustomProducts";
import AdminCustomProductUpload from "./admin/components/AdminCustomProductUpload";
import AdminCustomProductEdit from "./admin/components/AdminCustomProductEdit";
import AdminAnalytics from "./admin/components/AdminAnalytics";
import AdminOrderManagement from "./admin/components/AdminOrderManagement";
import AdminContactMessages from "./admin/components/AdminContactMessages";
import AdminWalletView from "./admin/components/AdminWalletView";

export default function AdminApp() {
  const location = useLocation();
  console.log("📍 AdminApp Location:", location.pathname);

  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route
          path="users"
          element={
            <RequireAdmin>
              <AdminUserManagement />
            </RequireAdmin>
          }
        />
        <Route
          path="designers"
          element={
            <RequireAdmin>
              <AdminDesignerManagement />
            </RequireAdmin>
          }
        />
        <Route
          path="resellers"
          element={
            <RequireAdmin>
              <AdminResellerManagement />
            </RequireAdmin>
          }
        />
        <Route
          path="products"
          element={
            <RequireAdmin>
              <AdminProductManagement />
            </RequireAdmin>
          }
        />
        <Route
          path="orders"
          element={
            <RequireAdmin>
              <AdminOrderManagement />
            </RequireAdmin>
          }
        />
        <Route
          path="messages"
          element={
            <RequireAdmin>
              <AdminContactMessages />
            </RequireAdmin>
          }
        />
        <Route
          path="wallet"
          element={
            <RequireAdmin>
              <AdminWalletView />
            </RequireAdmin>
          }
        />
        <Route
          path="custom-products"
          element={
            <RequireAdmin>
              <AdminCustomProducts />
            </RequireAdmin>
          }
        />
        <Route
          path="custom-products/upload"
          element={
            <RequireAdmin>
              <AdminCustomProductUpload />
            </RequireAdmin>
          }
        />
        <Route
          path="custom-products/edit/:id"
          element={
            <RequireAdmin>
              <AdminCustomProductEdit />
            </RequireAdmin>
          }
        />
        <Route
          path="analytics"
          element={
            <RequireAdmin>
              <AdminAnalytics />
            </RequireAdmin>
          }
        />
      </Route>
       
       {/* 
           If the user hits exactly "/", redirect to /admin 
           (In case they run this app standalone)
       */}
       <Route path="/" element={<Navigate to="/admin" replace />} />

       <Route path="*" element={
         <div className="p-10 text-red-600">
           <h1>404 - Page Not Found (Admin App)</h1>
           <p>Current Path: {location.pathname}</p>
         </div>
       } />
    </Routes>
  );
}
