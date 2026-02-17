import { useEffect, useState, useCallback } from "react";
import {
  CreditCard,
  History,
  TrendingUp,
  DollarSign,
  Loader2,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";
import api from "../../api/axios";

const currency = (n) =>
  `Rs ${Number(n || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

export default function SellerWalletView({ role, profile }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadWallet = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const endpoint =
        role === "designer" ? "/designer/wallet" : "/reseller/wallet";
      const { data } = await api.get(endpoint);
      setData(data);
    } catch (e) {
      console.error("Wallet error:", e);
      setErr(e?.response?.data?.error || "Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Crunching your earnings...</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-3xl flex flex-col items-center text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Oops! Something went wrong
        </h3>
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
      <div className="flex flex-col md:flex-row gap-6">
        {/* Balance Card */}
        <div className="flex-1 relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-green-700 p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wider">
                Withdrawable Balance
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {currency(data?.balance)}
            </h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold border border-white/30">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              Earnings after 10% Platform Fee
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 font-bold">
              <History className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">
              Total Payouts
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {data?.transactions?.length || 0}
            </p>
          </div>
          {/* Payout Information Card */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              {profile?.payoutStatus === "verified" ? (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full border border-green-200">
                  Verified
                </span>
              ) : profile?.payoutStatus === "rejected" ? (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-full border border-red-200">
                  Rejected
                </span>
              ) : (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase rounded-full border border-yellow-200">
                  Pending
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">
              Payout Method
            </p>
            <p className="text-lg font-bold text-gray-900 truncate">
              {profile?.paymentMethod || "Not Setup"}
            </p>
            {profile?.payoutStatus === "rejected" &&
              profile?.payoutRejectionReason && (
                <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded-lg border border-red-100">
                  Reason: {profile.payoutRejectionReason}
                </p>
              )}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            Transaction History
          </h3>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Released Payouts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Amount Released
                </th>
                <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
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
                        <span className="text-sm font-semibold text-gray-900 capitalize">
                          Sale Payout
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-gray-500">
                      {new Date(tx.date).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-emerald-600">
                        {tx.amount > 0 ? "+" : ""}
                        {currency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                        <CreditCard className="w-3 h-3" />
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <ShoppingBag className="w-12 h-12 text-gray-200" />
                      <p className="text-gray-400 font-medium">
                        No payouts released yet.
                      </p>
                      <p className="text-xs text-gray-400">
                        Funds are released by Admin once orders are delivered.
                      </p>
                    </div>
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
