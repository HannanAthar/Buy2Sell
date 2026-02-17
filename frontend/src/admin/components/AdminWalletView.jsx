import { useEffect, useState } from "react";
import { CreditCard, History, TrendingUp, DollarSign, Loader2, AlertCircle, ShoppingBag, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import api from "../../api/axios";

const currency = (n) =>
    `Rs ${Number(n || 0).toLocaleString(undefined, {
        maximumFractionDigits: 0,
    })}`;

export default function AdminWalletView() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const loadWallet = async () => {
        setLoading(true);
        setErr("");
        try {
            const { data } = await api.get("/admin/wallet");
            setData(data);
        } catch (e) {
            console.error("Admin Wallet error:", e);
            setErr(e?.response?.data?.error || "Failed to load wallet data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWallet();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading platform treasury...</p>
            </div>
        );
    }

    if (err) {
        return (
            <div className="p-8 bg-red-50 border border-red-200 rounded-3xl flex flex-col items-center text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Failed to load platform wallet</h3>
                <p className="text-red-700 mb-6">{err}</p>
                <button
                    onClick={loadWallet}
                    className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Main Treasury Card */}
                <div className="flex-[1.5] relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-800 p-10 text-white shadow-2xl border border-white/10">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-green-400/20 rounded-full blur-[100px]"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30">
                                <TrendingUp className="w-6 h-6 text-emerald-200" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest text-emerald-100">Platform Lifetime Revenue</span>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-6 mb-8">
                            <h2 className="text-5xl md:text-6xl font-black">{currency(data?.totalRevenue)}</h2>
                            <div className="pb-2 text-emerald-200 flex items-center gap-1 font-bold">
                                <ArrowUpRight className="w-5 h-5" />
                                <span>10% Commission + Fees</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                                <p className="text-xs font-bold text-emerald-200 uppercase mb-1">Total Payouts to Sellers</p>
                                <p className="text-2xl font-bold">{currency(data?.totalPayouts)}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                                <p className="text-xs font-bold text-emerald-200 uppercase mb-1">Total Orders Processed</p>
                                <p className="text-2xl font-bold">{data?.transactions?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Breakdown Card */}
                <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-xl p-8 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-emerald-600" />
                            Revenue Breakdown
                        </h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                        <ArrowUpRight className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Gross Commission</p>
                                        <p className="text-xs text-gray-500">10% from all released orders</p>
                                    </div>
                                </div>
                                <span className="font-bold text-emerald-600">{currency(data?.totalRevenue)}</span>
                            </div>

                            <div className="flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                        <ArrowDownLeft className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Sellers Share</p>
                                        <p className="text-xs text-gray-500">90% released to sellers</p>
                                    </div>
                                </div>
                                <span className="font-bold text-blue-600">{currency(data?.totalPayouts)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                            <p className="text-xs font-bold text-emerald-800 uppercase mb-2">Status</p>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-bold text-emerald-900 font-mono tracking-tight underline cursor-help" title="Platform is automatically taking 10% commission on every released payment.">Auto-Commission: ACTIVE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction History Overview */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <History className="w-5 h-5 text-emerald-600" />
                        Treasury Ledger
                    </h3>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Released Transactions</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order</th>
                                <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Grand Total</th>
                                <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Sellers Share</th>
                                <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Platform Fee (10%)</th>
                                <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data?.transactions?.length > 0 ? (
                                data.transactions.map((tx, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/80 transition-all">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-xs font-bold">
                                                    #{tx.orderNumber}
                                                </div>
                                                <span className="text-sm font-bold text-gray-900 uppercase tracking-tighter">Fulfillment</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-medium text-gray-700">
                                            {currency(tx.orderTotal)}
                                        </td>
                                        <td className="px-8 py-5 text-sm text-blue-600 font-bold">
                                            -{currency(tx.payouts)}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-sm font-bold text-emerald-600">
                                                +{currency(tx.revenue)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase border border-emerald-200 shadow-sm">
                                                Released
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center text-gray-400">
                                        <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        No released transactions found in ledger.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
