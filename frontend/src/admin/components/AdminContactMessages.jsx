import { useEffect, useState, useCallback } from "react";
import {
  Mail,
  Trash2,
  CheckCircle2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from "lucide-react";
import { useDialog } from "../../context/DialogContext";
import api from "../../api/axios";
import SlideOver from "./SlideOver";

export default function AdminContactMessages() {
  const dialog = useDialog();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);


  const [selectedMessage, setSelectedMessage] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const params = { page: pageNum, limit: 20 };
      if (status !== "all") params.status = status;

      const { data } = await api.get("/admin/contact", { params });

      setItems(data.data || []);

      setPages(data.pagination?.pages || 1);
      setPage(data.pagination?.page || 1);
    } catch (error) {
      console.error("Failed to load messages:", error);
      dialog.alert("Failed to load messages", { title: "Error" });
    } finally {
      setLoading(false);
    }
  }, [status, dialog]);

  useEffect(() => {
    load(1);
  }, [load, status]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/admin/contact/${id}/status`, {
        status: newStatus,
      });

      // Update local state
      setItems((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, status: newStatus } : item
        )
      );

      if (selectedMessage && selectedMessage._id === id) {
        setSelectedMessage((prev) => ({ ...prev, status: newStatus }));
      }

      dialog.alert(`Message marked as ${newStatus}`, { title: "Success" });
    } catch (error) {
      console.error("Failed to update status:", error);
      dialog.alert("Failed to update status", { title: "Error" });
    }
  };

  const handleDelete = async (id) => {
    const confirm = await dialog.confirm(
      "Are you sure you want to delete this message?",
      {
        title: "Delete Message",
        isDestructive: true,
      }
    );

    if (!confirm) return;

    try {
      await api.delete(`/admin/contact/${id}`);
      setItems((prev) => prev.filter((item) => item._id !== id));
      if (detailOpen) setDetailOpen(false);
      dialog.alert("Message deleted successfully", { title: "Success" });
      load(page); // Reload to adjust pagination if needed
    } catch (error) {
      console.error("Failed to delete message:", error);
      dialog.alert("Failed to delete message", { title: "Error" });
    }
  };

  const openDetails = (message) => {
    // If it's unread, mark as read automatically?
    // Maybe better to let admin decide or do it on open.
    // Let's stick to manual or explicit actions for now, or maybe auto-mark read if desired.
    // For now, just open details.
    setSelectedMessage(message);
    setDetailOpen(true);
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case "unread":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
            Unread
          </span>
        );
      case "read":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
            Read
          </span>
        );
      case "replied":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
            Replied
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            {s}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--primary-green)] via-[var(--dark-green)] to-[var(--accent-blue)] rounded-3xl p-8 shadow-xl text-white">
        <div className="flex items-center gap-3">
          <Mail className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Contact Messages</h1>
            <p className="text-emerald-50 opacity-90">
              Manage user inquiries and feedback
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center gap-4">
          <label className="font-semibold text-gray-700">
            Filter by Status:
          </label>
          <div className="flex gap-2">
            {["all", "unread", "read", "replied"].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  status === s
                    ? "bg-[var(--primary-green)] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-gray-600">
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Message Preview</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-8">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  No messages found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item._id}
                  className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(item.createdAt).toLocaleDateString()}{" "}
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{item.email}</td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                    {item.message}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openDetails(item)}
                      className="text-[var(--dark-green)] hover:text-[var(--primary-green)] font-medium text-xs px-3 py-1 bg-[var(--emerald-50)] rounded-lg hover:bg-[var(--emerald-100)] transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && pages > 1 && (
        <div className="flex justify-center gap-4 mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-2 border rounded-lg disabled:opacity-50"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="py-2 px-4 bg-gray-100 rounded-lg font-medium">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 border rounded-lg disabled:opacity-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Detail SlideOver */}
      <SlideOver
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Message Details"
        footer={
          <div className="flex justify-between w-full">
            {selectedMessage && (
              <button
                onClick={() => handleDelete(selectedMessage._id)}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50"
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
            <button
              onClick={() => setDetailOpen(false)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedMessage && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Sent on</span>
                <span className="text-sm font-medium">
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span>{getStatusBadge(selectedMessage.status)}</span>
              </div>
              {selectedMessage.ipAddress && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">IP Address</span>
                  <span className="text-sm font-mono text-gray-600">
                    {selectedMessage.ipAddress}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <div className="text-lg font-semibold">
                {selectedMessage.name}
              </div>
              <div className="text-[var(--primary-green)]">
                {selectedMessage.email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <div className="p-4 bg-white border border-gray-200 rounded-xl text-gray-700 whitespace-pre-wrap leading-relaxed">
                {selectedMessage.message}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <button
                onClick={() => handleStatusUpdate(selectedMessage._id, "read")}
                disabled={selectedMessage.status === "read"}
                className="flex items-center justify-center gap-2 py-3 border border-[var(--emerald-100)] bg-[var(--emerald-50)] text-[var(--dark-green)] rounded-xl hover:bg-[var(--emerald-100)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark as Read
              </button>
              <button
                onClick={() =>
                  handleStatusUpdate(selectedMessage._id, "replied")
                }
                disabled={selectedMessage.status === "replied"}
                className="flex items-center justify-center gap-2 py-3 border border-green-200 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark as Replied
              </button>
              <a
                href={`mailto:${selectedMessage.email}`}
                className="col-span-2 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 shadow-lg"
              >
                Reply via Email
              </a>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
