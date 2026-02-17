import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  MapPin,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  Upload,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion"; // Used in JSX animations
import Header from "./Header";
import api from "../api/axios";
import { useDialog } from "../context/DialogContext";
import { useToast, ToastContainer } from "./Toast";

// Helper for image compression (reused logic)
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const MAX = 800;
        if (width > height) {
          if (width > MAX) {
            height *= MAX / width;
            width = MAX;
          }
        } else {
          if (height > MAX) {
            width *= MAX / height;
            height = MAX;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) =>
            resolve(new File([blob], file.name, { type: "image/jpeg" })),
          "image/jpeg",
          0.8
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const dialog = useDialog();
  const { toasts, addToast, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile State
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    address: "",
    bio: "",
    paymentMethod: "",
    paymentDetails: {},
    logo: "", // url
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  // Address Book state removed - now using single address field in profile

  useEffect(() => {
    const r = localStorage.getItem("role");
    if (!r) {
      navigate("/login");
      return;
    }
    setRole(r);

    // Address Book removed - using single address field in profile

    // Load Profile
    fetchProfile(r);
  }, [navigate]);

  const fetchProfile = async (r) => {
    setLoading(true);
    try {
      let res;
      if (r === "buyer") res = await api.get("/user/profile");
      else if (r === "designer") res = await api.get("/designer/profile");
      else if (r === "reseller") res = await api.get("/reseller/profile");

      console.log("Profile response:", res?.data); // Debug log

      if (res?.data) {
        const data = res.data.user || res.data.designer || res.data.reseller;
        console.log("Extracted data:", data); // Debug log

        if (data) {
          setProfile({
            fullName: data.fullName || "",
            email: data.email || "",
            phone: data.phone || "",
            location: data.location || "",
            address: data.address || "",
            bio: data.bio || "",
            paymentMethod: data.paymentMethod || "",
            paymentDetails: data.paymentDetails || {},
            payoutStatus: data.payoutStatus || "pending",
            payoutRejectionReason: data.payoutRejectionReason || "",
            logo: data.logo || data.profileImage || "", // Support both logo and profileImage
          });

          // Handle both logo (designer/reseller) and profileImage (buyer)
          const imageUrl = data.logo || data.profileImage;
          if (imageUrl)
            setLogoPreview(
              imageUrl.startsWith("http")
                ? imageUrl
                : `http://localhost:5000${imageUrl}`
            );
        } else {
          console.error("No data found in response");
        }
      }
    } catch (err) {
      console.error("Failed to load profile", err);
      console.error("Error response:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    try {
      const compressed = await compressImage(file);
      setLogoFile(compressed);
    } catch {
      dialog.alert("Error processing image.", { title: "Error" });
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("fullName", profile.fullName);

      // Send address directly from profile
      if (profile.address) {
        formData.append("address", profile.address);
      }

      const phoneRegex = /^03\d{9}$/;
      if (!phoneRegex.test(profile.phone)) {
        setSaving(false);
        return addToast(
          "Please enter a valid 11-digit phone number (e.g., 03123456789)",
          "error"
        );
      }
      formData.append("phone", profile.phone);
      if (role !== "buyer") {
        formData.append("location", profile.location);
        formData.append("bio", profile.bio);
      }
      if (logoFile) formData.append("logo", logoFile);

      if (role === "reseller" || role === "designer") {
        formData.append("paymentMethod", profile.paymentMethod);
        if (profile.paymentMethod.includes("Bank")) {
          formData.append("bankName", profile.paymentDetails.bankName || "");
          formData.append(
            "bankAccountTitle",
            profile.paymentDetails.bankAccountTitle || ""
          );
          formData.append(
            "bankAccountNumber",
            profile.paymentDetails.bankAccountNumber || ""
          );
          formData.append("bankIban", profile.paymentDetails.bankIban || "");
        } else {
          formData.append(
            "accountName",
            profile.paymentDetails.accountName || ""
          );
          formData.append(
            "accountNumber",
            profile.paymentDetails.accountNumber || ""
          );
        }
      }

      let res;
      // All roles now use FormData for consistency
      if (role === "buyer")
        res = await api.put("/user/profile", formData);
      else if (role === "designer")
        res = await api.put("/designer/profile", formData);
      else if (role === "reseller")
        res = await api.put("/reseller/profile", formData);

      if (res?.data?.success || res?.status === 200) {
        addToast("Profile saved successfully!", "success");
        // update local storage for header sync
        const key = role; // "buyer", "designer", "reseller"
        const existing = JSON.parse(localStorage.getItem(key) || "{}");
        const updated = {
          ...existing,
          ...(res.data.user || res.data.designer || res.data.reseller),
        };
        localStorage.setItem(key, JSON.stringify(updated));

        setSaved(true);
        setTimeout(() => {
          // window.location.reload(); // Reload handles header update, but smoother to just let toast finish?
          // Actually, header might need update.
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || "Failed to save profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Address Book logic removed - using single address field in profile

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 bg-white rounded-xl shadow-sm border h-fit p-2">
            <button
              onClick={() => setActiveTab("account")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "account"
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <User size={18} /> Account Information
            </button>

          </aside>

          {/* Content */}
          <main className="flex-1 bg-white rounded-xl shadow-sm border p-6 md:p-8 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === "account" && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={saveProfile} className="space-y-6">
                    <div className="flex items-center gap-6 mb-6">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border-2 border-green-100">
                          {logoPreview ? (
                            <img
                              src={logoPreview}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                              <span className="text-3xl font-bold text-green-700">
                                {(
                                  profile.fullName?.[0] ||
                                  profile.email?.[0] ||
                                  "U"
                                ).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 bg-green-600 text-white p-2 rounded-full cursor-pointer hover:bg-green-700 shadow-sm">
                          <Upload size={14} />
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleLogoChange}
                          />
                        </label>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">
                          {profile.fullName || "Your Name"}
                        </h2>
                        <p className="text-sm text-gray-500 capitalize">
                          {role}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profile.fullName}
                          onChange={(e) =>
                            setProfile({ ...profile, fullName: e.target.value })
                          }
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email (Read Only)
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="text"
                          value={profile.phone}
                          onChange={(e) =>
                            setProfile({ ...profile, phone: e.target.value })
                          }
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
                          required
                        />
                      </div>



                      {role !== "buyer" && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bio / Description
                          </label>
                          <textarea
                            rows={3}
                            value={profile.bio}
                            onChange={(e) =>
                              setProfile({ ...profile, bio: e.target.value })
                            }
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
                          />
                        </div>
                      )}

                      {/* Address Field - For all roles */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Address
                        </label>
                        <textarea
                          rows={2}
                          value={profile.address}
                          onChange={(e) =>
                            setProfile({ ...profile, address: e.target.value })
                          }
                          placeholder="Enter your full residential address"
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
                        />

                      </div>
                    </div>




                    {/* Payout Details Section - Editable for both Designers and Resellers */}
                    {(role === "designer" || role === "reseller") && (
                      <div className="border-t pt-6 mt-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <CreditCard size={20} /> Payout Details
                          </h3>
                          {profile.payoutStatus && (
                            <div>
                              {profile.payoutStatus === "verified" ? (
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full border border-green-200 flex items-center gap-1">
                                  <CheckCircle size={12} /> Verified
                                </span>
                              ) : profile.payoutStatus === "rejected" ? (
                                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold uppercase rounded-full border border-red-200 flex items-center gap-1">
                                  <AlertCircle size={12} /> Rejected
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold uppercase rounded-full border border-yellow-200">
                                  Pending Verification
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {profile.payoutStatus === "rejected" &&
                          profile.payoutRejectionReason && (
                            <div className="mb-4 bg-red-50 border border-red-100 rounded-lg p-3">
                              <p className="text-sm text-red-700 font-medium">
                                Rejection Reason:
                              </p>
                              <p className="text-sm text-red-600 mt-1">
                                {profile.payoutRejectionReason}
                              </p>
                            </div>
                          )}

                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4">
                          {/* Payment Method Selector */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Payment Method
                            </label>
                            <select
                              value={profile.paymentMethod || ""}
                              onChange={(e) =>
                                setProfile({
                                  ...profile,
                                  paymentMethod: e.target.value,
                                  // Clear details if switching, or keep? Better to keep in state but clear on submit/render if needed. 
                                  // Actually let's just keep them in state to prevent data loss.
                                })
                              }
                              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
                            >
                              <option value="">Select Payment Method</option>
                              <option value="JazzCash">JazzCash</option>
                              <option value="EasyPaisa">EasyPaisa</option>
                              <option value="Bank Transfer">Bank Transfer</option>
                            </select>
                          </div>

                          {/* Conditional Inputs */}
                          {(profile.paymentMethod === "JazzCash" ||
                            profile.paymentMethod === "EasyPaisa") && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Account Name
                                </label>
                                <input
                                  type="text"
                                  value={profile.paymentDetails?.accountName || ""}
                                  onChange={(e) =>
                                    setProfile({
                                      ...profile,
                                      paymentDetails: {
                                        ...profile.paymentDetails,
                                        accountName: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="e.g. John Doe"
                                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Mobile Number
                                </label>
                                <input
                                  type="text"
                                  value={profile.paymentDetails?.accountNumber || ""}
                                  onChange={(e) =>
                                    setProfile({
                                      ...profile,
                                      paymentDetails: {
                                        ...profile.paymentDetails,
                                        accountNumber: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="03XXXXXXXXX"
                                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
                                />
                              </div>
                            </div>
                          )}

                          {profile.paymentMethod === "Bank Transfer" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Bank Name
                                </label>
                                <input
                                  type="text"
                                  value={profile.paymentDetails?.bankName || ""}
                                  onChange={(e) =>
                                    setProfile({
                                      ...profile,
                                      paymentDetails: {
                                        ...profile.paymentDetails,
                                        bankName: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="e.g. HBL"
                                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Account Title
                                </label>
                                <input
                                  type="text"
                                  value={profile.paymentDetails?.bankAccountTitle || ""}
                                  onChange={(e) =>
                                    setProfile({
                                      ...profile,
                                      paymentDetails: {
                                        ...profile.paymentDetails,
                                        bankAccountTitle: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="e.g. John Doe"
                                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Account Number
                                </label>
                                <input
                                  type="text"
                                  value={profile.paymentDetails?.bankAccountNumber || ""}
                                  onChange={(e) =>
                                    setProfile({
                                      ...profile,
                                      paymentDetails: {
                                        ...profile.paymentDetails,
                                        bankAccountNumber: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="Account Number"
                                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  IBAN
                                </label>
                                <input
                                  type="text"
                                  value={profile.paymentDetails?.bankIban || ""}
                                  onChange={(e) =>
                                    setProfile({
                                      ...profile,
                                      paymentDetails: {
                                        ...profile.paymentDetails,
                                        bankIban: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="PK..."
                                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-4">
                      <motion.button
                        type="submit"
                        disabled={saving || saved}
                        layout
                        whileTap={{ scale: 0.95 }}
                        className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                          saved
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {saved ? (
                            <motion.span
                              key="saved"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle size={18} /> Saved!
                            </motion.span>
                          ) : saving ? (
                            <motion.span
                              key="saving"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              Saving...
                            </motion.span>
                          ) : (
                            <motion.span
                              key="save"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="flex items-center gap-2"
                            >
                              <Save size={18} /> Save Changes
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
