import React, { useEffect, useState, useMemo } from "react";
import { Loader2, TrendingUp, Users, Shirt, Briefcase, Package, DollarSign, ShoppingCart, Calendar } from "lucide-react";
import api from "../../api/axios";
import { toast } from 'react-hot-toast';

/* Enhanced bar chart with gradient */
function Bar({ label, value, max, color = "emerald" }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  
  const colorClasses = {
    emerald: "from-emerald-400 to-emerald-600",
    blue: "from-blue-400 to-blue-600",
    purple: "from-purple-400 to-purple-600",
    orange: "from-orange-400 to-orange-600",
    teal: "from-teal-400 to-teal-600"
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-bold text-gray-900">{value}</span>
      </div>
      <div className="h-3 rounded-full bg-gray-100 overflow-hidden shadow-inner">
        <div 
          className={`h-full bg-gradient-to-r ${colorClasses[color] || colorClasses.emerald} transition-all duration-500 rounded-full shadow-sm`}
          style={{ width: `${pct}%` }} 
        />
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState("sales");
  const [loading, setLoading] = useState(true);
  
  // Sales Data State
  const [salesReport, setSalesReport] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [salesLoading, setSalesLoading] = useState(false);

  // Inventory Data State
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);


  // Existing Analytics Fetch (Inventory) function
  const fetchInventoryData = async () => {
      try {
        const [s, p] = await Promise.all([
          api.get("/admin/dashboard/stats"),
          api.get("/admin/products", { params: { page: 1, limit: 500 } }),
        ]);
        setStats(s.data);
        setProducts(p.data.items || []);
      } catch (e) {
        // setErr("Failed to load inventory data");
        console.error(e);
      }
  };

  // New Sales Report Fetch
  const fetchSalesReport = React.useCallback(async () => {
    try {
      setSalesLoading(true);
      const { data } = await api.get(`/admin/reports/sales?period=${period}`);
      setSalesReport(data);
      
      const topProd = await api.get(`/admin/reports/top-products`);
      if(topProd.data.success) setTopProducts(topProd.data.topProducts);
    } catch (error) {
      console.error("Report fetch error:", error);
      toast.error("Failed to load sales report");
    } finally {
      setSalesLoading(false);
    }
  }, [period]);

  useEffect(() => {
    const init = async () => {
        setLoading(true);
        await Promise.all([fetchInventoryData(), fetchSalesReport()]);
        setLoading(false);
    };
    init();
  }, [fetchSalesReport]);

  // Re-fetch sales when period changes
  useEffect(() => {
    fetchSalesReport();
  }, [fetchSalesReport, period]);

  const breakdown = useMemo(() => {
    if(!products.length) return null;
    const byType = { sale: 0, rent: 0 };
    const bySeller = { Designer: 0, Reseller: 0 };
    const byCategory = {};
    
    for (const p of products) {
      byType[p.listingType] = (byType[p.listingType] || 0) + 1;
      bySeller[p.sellerType] = (bySeller[p.sellerType] || 0) + 1;
      byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    }
    return { byType, bySeller, byCategory };
  }, [products]);

  if (loading && !salesReport && !stats) return (
    <div className="min-h-[60vh] grid place-items-center">
      <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-3xl p-8 shadow-xl text-white flex justify-between items-center">
        <div>
            <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            </div>
            <p className="text-emerald-50 opacity-90">Comprehensive insights into your business performance</p>
        </div>
        <div className="bg-white/20 p-1 rounded-xl flex gap-2">
            <button 
                onClick={() => setActiveTab("sales")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'sales' ? 'bg-white text-emerald-600 shadow' : 'text-white hover:bg-white/10'}`}
            >
                Sales & Revenue
            </button>
            <button 
                onClick={() => setActiveTab("inventory")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'inventory' ? 'bg-white text-emerald-600 shadow' : 'text-white hover:bg-white/10'}`}
            >
                Inventory & Users
            </button>
        </div>
      </div>

      {activeTab === 'sales' && (
          <div className="space-y-6">
              {/* Period Selector */}
              <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm w-fit">
                    {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
                        <button 
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-lg capitalize text-sm font-medium transition-all ${
                                period === p 
                                ? 'bg-emerald-500 text-white shadow' 
                                : 'bg-transparent text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
              </div>

              {salesLoading ? (
                  <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
              ) : salesReport && (
                <>
                    {/* Key Metrics */}
                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="bg-white p-6 rounded-2xl shadow border border-blue-100">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
                                    <h3 className="text-3xl font-bold text-gray-900 mt-1">
                                        Rs. {salesReport.summary?.totalRevenue?.toLocaleString()}
                                    </h3>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><DollarSign size={24} /></div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow border border-green-100">
                             <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Total Orders</p>
                                    <h3 className="text-3xl font-bold text-gray-900 mt-1">
                                        {salesReport.summary?.totalOrders}
                                    </h3>
                                </div>
                                <div className="p-3 bg-green-50 rounded-xl text-green-600"><ShoppingCart size={24} /></div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow border border-purple-100">
                             <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Avg Order Value</p>
                                    <h3 className="text-3xl font-bold text-gray-900 mt-1">
                                        Rs. {Math.round(salesReport.summary?.averageOrderValue || 0).toLocaleString()}
                                    </h3>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><TrendingUp size={24} /></div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Table */}
                    <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 font-bold text-lg text-gray-800">Sales Timeline</div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 font-medium uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Date/Period</th>
                                        <th className="px-6 py-4">Revenue</th>
                                        <th className="px-6 py-4">Orders</th>
                                        <th className="px-6 py-4">Avg Value</th>
                                        <th className="px-6 py-4">Items Sold</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {salesReport.report.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{row._id}</td>
                                            <td className="px-6 py-4 text-emerald-600 font-semibold">Rs. {row.totalSales.toLocaleString()}</td>
                                            <td className="px-6 py-4">{row.orderCount}</td>
                                            <td className="px-6 py-4">Rs. {Math.round(row.averageOrderValue).toLocaleString()}</td>
                                            <td className="px-6 py-4">{row.productsSold}</td>
                                        </tr>
                                    ))}
                                    {salesReport.report.length === 0 && (
                                        <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No sales data for this period</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 font-bold text-lg text-gray-800">Top Selling Products</div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 font-medium uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Product Name</th>
                                        <th className="px-6 py-4">Units Sold</th>
                                        <th className="px-6 py-4">Total Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {topProducts.map((prod, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900 max-w-sm truncate" title={prod.productName}>
                                                {prod.productName}
                                            </td>
                                            <td className="px-6 py-4">{prod.totalSold}</td>
                                            <td className="px-6 py-4 font-semibold text-gray-900">Rs. {prod.totalRevenue.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
              )}
          </div>
      )}

      {activeTab === 'inventory' && breakdown && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Topline Stats */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: "Buyers", value: stats?.buyers || 0, icon: Users, color: "from-blue-500 to-blue-600" },

                        { label: "Products", value: stats?.products || 0, icon: Package, color: "from-emerald-500 to-emerald-600" },
                    ].map(({ label, value, icon: Icon, color }) => ( // eslint-disable-line no-unused-vars
                    <div key={label} className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5`}></div>
                        <div className="relative flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
                            <p className="text-3xl font-bold text-gray-900">{value}</p>
                        </div>
                        <div className={`rounded-2xl p-3 bg-gradient-to-br ${color} shadow-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        </div>
                    </div>
                    ))}
                </div>

                {/* Breakdown Charts */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full"></div>
                        <p className="font-bold text-lg text-gray-900">Listings by Type</p>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(breakdown.byType).map(([k, v], i) => (
                        <Bar key={k} label={k.toUpperCase()} value={v} max={Math.max(...Object.values(breakdown.byType), 1)} color={i === 0 ? "emerald" : "teal"} />
                        ))}
                    </div>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                        <p className="font-bold text-lg text-gray-900">Products by Seller</p>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(breakdown.bySeller).map(([k, v], i) => (
                        <Bar key={k} label={k} value={v} max={Math.max(...Object.values(breakdown.bySeller), 1)} color={i === 0 ? "purple" : "orange"} />
                        ))}
                    </div>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                        <p className="font-bold text-lg text-gray-900">Top Categories</p>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(breakdown.byCategory)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 8)
                        .map(([k, v], i) => (
                            <Bar key={k} label={k} value={v} max={Math.max(...Object.values(breakdown.byCategory), 1)} color={["blue", "emerald", "purple", "orange", "teal"][i % 5]} />
                        ))}
                    </div>
                    </div>
                </div>
          </div>
      )}
    </div>
  );
}