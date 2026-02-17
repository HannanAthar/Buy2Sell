import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Suspense } from "react";
import {
  LayoutGrid,
  Users,
  Shirt,
  Briefcase,
  PackageSearch,
  BarChart3,
  LogOut,
  Sparkles,
  ShoppingBag,
  Mail,
  CreditCard,
  Palette,
} from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("token");
    navigate("/admin/login", { replace: true });
  };

  const nav = [
    { to: "/admin/dashboard", icon: LayoutGrid, label: "Dashboard" },
    { to: "/admin/users", icon: Users, label: "Users" },
    { to: "/admin/designers", icon: Shirt, label: "Designers" },
    { to: "/admin/resellers", icon: Briefcase, label: "Resellers" },
    { to: "/admin/products", icon: PackageSearch, label: "Products" },
    { to: "/admin/custom-products", icon: Palette, label: "Custom Products" },
    { to: "/admin/orders", icon: ShoppingBag, label: "Orders" },
    { to: "/admin/wallet", icon: CreditCard, label: "Wallet" },
    { to: "/admin/messages", icon: Mail, label: "Messages" },
    { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block shadow-xl">
        {/* Logo Section */}
        <div className="px-6 py-6 border-b border-gray-100">
          <Link to="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Buy2Sell
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Admin Panel
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-200"
                    : "text-gray-700 hover:bg-gray-100 hover:text-emerald-600"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-5 h-5 ${
                      isActive
                        ? ""
                        : "group-hover:scale-110 transition-transform"
                    }`}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Topbar */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            {/* Mobile Logo */}
            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Buy2Sell Admin</span>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-4 ml-auto">
              {localStorage.getItem("adminToken") ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Logged in as Admin
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all font-medium text-gray-700"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <span className="text-sm text-gray-500">Not logged in</span>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-48">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
