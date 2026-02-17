import { useEffect, useMemo, useState } from "react";
import {
  Users as UsersIcon,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  Save,
  MapPin,
  Home,
} from "lucide-react";
import api from "../../api/axios";
import SlideOver from "./SlideOver";
import ConfirmModal from "../../components/common/ConfirmModal";

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  return `http://localhost:5000${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    address: "",
    bio: "",
    isVerified: false,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [deleteModal, setDeleteModal] = useState({ open: false });

  const loadUsers = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/admin/users");
      setUsers(Array.isArray(data) ? data : data?.users || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return users.filter((u) =>
      [u.fullName, u.email, u.phone]
        .filter(Boolean)
        .some((val) => val.toLowerCase().includes(s))
    );
  }, [users, q]);

  const openDetails = (u) => {
    setFocus(u);
    setFormErr("");
    setFormData({
      fullName: u.fullName || "",
      email: u.email || "",
      phone: u.phone || "",
      location: u.location || "",
      address: u.address || "",
      bio: u.bio || "",
      isVerified: u.isVerified ?? false,
      isActive: u.isActive ?? true,
    });
    setOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    if (!focus) return;
    setSaving(true);
    setFormErr("");
    try {
      if (!formData.fullName || !formData.email) {
        setFormErr("Name and email are required.");
        setSaving(false);
        return;
      }

      await api.put(`/admin/users/${focus._id}`, formData);
      await loadUsers();

      const updated = users.find((u) => u._id === focus._id);
      setFocus(updated || focus);
    } catch (e) {
      setFormErr(e?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const _handleToggleActive = async () => {
    if (!focus) return;
    const next = !formData.isActive;
    setSaving(true);
    setFormErr("");
    try {
      await api.put(`/admin/users/${focus._id}`, {
        ...formData,
        isActive: next,
      });
      await loadUsers();
      const updated = users.find((u) => u._id === focus._id);
      setFormData((prev) => ({ ...prev, isActive: next }));
      setFocus(updated || focus);
    } catch (e) {
      setFormErr(e?.response?.data?.message || "Status update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!focus) return;
    setDeleteModal({ open: true });
  };

  const confirmDeleteUser = async () => {
    if (!focus) return;
    setDeleting(true);
    setFormErr("");
    try {
      await api.delete(`/admin/users/${focus._id}`);
      setOpen(false);
      setFocus(null);
      await loadUsers();
      setDeleteModal({ open: false });
    } catch (e) {
      setFormErr(e?.response?.data?.message || "Delete failed");
      // Close modal on error or keep itopen? I will close it to show error in panel.
      setDeleteModal({ open: false });
    } finally {
      setDeleting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-200" />
            <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin absolute top-0 left-0" />
          </div>
          <p className="text-gray-600 font-medium">Loading users…</p>
        </div>
      </div>
    );

  if (err)
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-8 shadow-xl text-white">
          <h1 className="text-3xl font-bold">Users</h1>
        </div>
        <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700">
          <p className="font-bold text-lg">{err}</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-3">
              <UsersIcon className="w-5 h-5" />
              <span className="text-sm font-semibold">User Management</span>
            </div>
            <h1 className="text-4xl font-bold mb-2 text-white">
              Platform Users
            </h1>
            <p className="text-green-50 opacity-90">
              Monitor and manage all registered users
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
            <input
              className="pl-12 pr-4 py-3 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-md text-white placeholder-white/60 focus:ring-4 focus:ring-white/40 focus:bg-white/20 focus:border-white/50 transition-all w-80 shadow-lg"
              placeholder="Search name, email, phone…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-1 max-w-md">
        <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-xl border border-gray-100/50 hover:shadow-2xl transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <UsersIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Users
              </p>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {users.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table (same style as designers & resellers) */}
      <div className="rounded-2xl border border-gray-100/50 overflow-hidden bg-white shadow-xl">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-green-50/30 border-b-2 border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-gray-700 font-semibold w-1/3">
                User
              </th>
              <th className="px-4 py-3 text-left text-gray-700 font-semibold w-1/2">
                Contact
              </th>
              <th className="px-4 py-3 text-right text-gray-700 font-semibold w-auto">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {filtered.map((u) => (
              <tr
                key={u._id}
                className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 border-b border-gray-50 last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                      {getImageUrl(u.profileImage) ? (
                        <img
                          src={getImageUrl(u.profileImage)}
                          alt={u.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center font-bold text-green-700">
                          {u.fullName?.[0]?.toUpperCase() ||
                            u.email?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{u.fullName}</p>
                      <p className="text-xs text-gray-400">
                        ID: {u._id.slice(-8)}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="h-4 w-4" />
                      {u.email}
                    </div>
                    {u.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        {u.phone}
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openDetails(u)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}

            {!filtered.length && (
              <tr>
                <td colSpan={3} className="py-12 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SlideOver */}
      <SlideOver
        open={open}
        onClose={() => {
          if (!saving && !deleting) {
            setOpen(false);
            setFocus(null);
            setFormErr("");
          }
        }}
        title={focus ? focus.fullName || focus.email : "User Details"}
        footer={
          <div className="flex justify-between items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-red-200 text-red-700 rounded-xl hover:bg-red-500 hover:text-white transition-all"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-semibold shadow-sm hover:shadow-md"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        }
      >
        {focus && (
          <div className="space-y-6">
            {/* User Header */}
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-100 rounded-2xl shadow-lg">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-xl bg-white">
                {getImageUrl(focus.profileImage) ? (
                  <img
                    src={getImageUrl(focus.profileImage)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-green-700">
                      {formData.fullName?.[0]?.toUpperCase() ||
                        formData.email?.[0]?.toUpperCase() ||
                        "U"}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <p className="font-bold text-lg">{formData.fullName}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {formData.email}
                </p>
                {formData.phone && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {formData.phone}
                  </p>
                )}

                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Home className="h-3 w-3" /> <strong>Address:</strong> {formData.address || "Not Provided"}
                </p>
                <div className="text-sm text-gray-500 mt-2 italic">
                  <strong>Bio:</strong> {formData.bio ? `"${formData.bio}"` : "Not Provided"}
                </div>
              </div>
            </div>

            {formErr && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {formErr}
              </div>
            )}

            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-emerald-500"
                />
              </div>
              

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  placeholder="Full residential address (e.g. House #123, Street ABC...)"
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleFormChange}
                  placeholder="Tell us about the user..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>
          </div>
        )}
      </SlideOver>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete user "${
          focus?.fullName || focus?.email
        }"? This cannot be undone.`}
        confirmText="Delete User"
        isDestructive={true}
        isLoading={deleting}
      />
    </div>
  );
}
