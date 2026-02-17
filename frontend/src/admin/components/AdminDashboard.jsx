import { useEffect, useState } from "react";
import { Users, Shirt, Briefcase, Package, Loader2, TrendingUp, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        console.log("📄 Fetching dashboard stats...");
        console.log("🔑 Current tokens:", {
          adminToken: localStorage.getItem("adminToken")?.substring(0, 20) + "...",
          token: localStorage.getItem("token")?.substring(0, 20) + "..."
        });

        const { data } = await api.get("/admin/dashboard/stats");

        console.log("✅ Dashboard stats received:", data);
        setStats(data);
      } catch (e) {
        console.error("❌ Dashboard error:", e);
        console.error("❌ Error response:", e?.response?.data);
        console.error("❌ Error status:", e?.response?.status);

        setErr(e?.response?.data?.message || e?.response?.data?.error || "Failed to load stats");

        if (e?.response?.status === 403) {
          console.error("🚫 Access forbidden - you may need to login as admin");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-200"></div>
            <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-green-500 animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 text-red-800 rounded-2xl border-2 border-red-200 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">⚠️</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">Error loading dashboard</p>
            <p className="text-sm mt-1 opacity-90">{err}</p>
            <p className="text-xs mt-2 opacity-75">Check browser console (F12) for details</p>
            <button
              onClick={() => nav("/admin/login")}
              className="mt-4 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Buyers", value: stats?.buyers || 0, icon: Users, to: "/admin/users", gradient: "from-green-500 to-emerald-600", lightBg: "from-green-50 to-emerald-50" },
    { label: "Designers", value: stats?.designers || 0, icon: Shirt, to: "/admin/designers", gradient: "from-emerald-500 to-teal-600", lightBg: "from-emerald-50 to-teal-50" },
    { label: "Resellers", value: stats?.resellers || 0, icon: Briefcase, to: "/admin/resellers", gradient: "from-teal-500 to-cyan-600", lightBg: "from-teal-50 to-cyan-50" },
    { label: "Products", value: stats?.products || 0, icon: Package, to: "/admin/products", gradient: "from-green-600 to-emerald-700", lightBg: "from-green-50 to-emerald-100" },
    { label: "Orders", value: stats?.orders || 0, icon: Package, to: "/admin/orders", gradient: "from-emerald-600 to-green-700", lightBg: "from-emerald-50 to-green-100" },
  ];

  return (
    <div className="space-y-8">
      {/* Header with Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-10 shadow-2xl">
        {/* Animated Background Orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></div>
            <span className="text-sm font-medium text-white">System Active</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-white">Admin Dashboard</h1>
          <p className="text-green-50 text-lg opacity-90 max-w-2xl">
            Welcome back! Monitor and manage your Buy2Sell platform in real-time.
          </p>
        </div>
      </div>

      {/* Main Stats Cards with Enhanced Design */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, to, gradient, lightBg }) => (
          <button
            key={label}
            onClick={() => nav(to)}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md border border-gray-100/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-105"
          >
            {/* Gradient Background on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${lightBg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

            {/* Accent Line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`}></div>

            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className={`rounded-xl p-3 bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`rounded-full px-3 py-1 bg-gradient-to-r ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`}>
                  <span className="text-xs font-bold text-gray-700">View</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wide">{label}</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{value}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Listing Stats with Modern Card Design */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-md border border-gray-100 hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-500 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>

          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Sale Listings</p>
              </div>
              <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats?.saleProducts || 0}</p>
              <p className="text-xs text-gray-500 mt-2">Total products for sale</p>
            </div>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <span className="text-3xl">💰</span>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-md border border-gray-100 hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500 to-cyan-500 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>

          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Rent Listings</p>
              </div>
              <p className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">{stats?.rentProducts || 0}</p>
              <p className="text-xs text-gray-500 mt-2">Total products for rent</p>
            </div>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <span className="text-3xl">🏪</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
