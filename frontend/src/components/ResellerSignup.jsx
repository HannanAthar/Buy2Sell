import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Upload,
  CheckCircle,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Landmark,
  Building,
} from "lucide-react";
import axios from "../api/axios.js";
import SignupTabs from "./SignupTabs.jsx";
import Header from "./Header.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { hasXSS } from "../utils/security";

// Reusable Input Component with Inline Error
const InputField = ({ icon: _FieldIcon, name, error, ...props }) => (
  <div className="relative group">
    <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-emerald-600 transition-colors">
      <_FieldIcon size={18} />
    </div>
    <input
      name={name}
      {...props}
      className={`w-full pl-10 pr-4 py-2.5 bg-white/50 border ${error
          ? "border-red-500 focus:ring-red-200"
          : "border-gray-200 hover:border-emerald-400 focus:ring-emerald-500/20 focus:border-emerald-500"
        } rounded-lg outline-none focus:ring-2 transition-all duration-300 placeholder:text-gray-400 font-medium text-base sm:text-sm`}
    />
    {error && (
      <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>
    )}
  </div>
);

const ResellerSignup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    bio: "",
    location: "",
    paymentMethod: "",
    accountName: "",
    accountNumber: "",
    bankName: "",
    bankAccountTitle: "",
    bankAccountNumber: "",
    bankIban: "",
    logo: null,
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState("");

  // Particle animation
  useEffect(() => {
    const loadParticles = async () => {
      if (typeof window !== "undefined" && !window.particlesJS) {
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js";
        script.onload = () => {
          initializeParticles();
        };
        script.onerror = () => { };
        document.head.appendChild(script);
      } else {
        initializeParticles();
      }
    };
    const initializeParticles = () => {
      if (window.particlesJS) {
        window.particlesJS("particles-background-reseller", {
          particles: {
            number: { value: 60, density: { enable: true, value_area: 800 } },
            color: { value: "#10b981" }, // Emerald 500
            shape: { type: "circle" },
            opacity: { value: 0.3, random: true },
            size: { value: 3, random: true },
            line_linked: {
              enable: true,
              distance: 150,
              color: "#10b981",
              opacity: 0.2,
              width: 1,
            },
            move: { enable: true, speed: 1.5, random: true },
          },
          interactivity: {
            detect_on: "canvas",
            events: {
              onhover: { enable: true, mode: "grab" },
              resize: true,
            },
            modes: { grab: { distance: 140, line_linked: { opacity: 0.5 } } },
          },
          retina_detect: true,
        });
      }
    };
    loadParticles();
    return () => {
      if (window.pJSDom && window.pJSDom.length > 0) {
        window.pJSDom[0].pJS.fn.vendors.destroypJS();
        window.pJSDom = [];
      }
    };
  }, []);

  const validateField = (name, value) => {
    let error = "";
    if (typeof value === "string" && hasXSS(value)) {
      return "Invalid characters detected.";
    }
    switch (name) {
      case "fullName":
        if (!value.trim()) error = "Full Name is required";
        break;
      case "email":
        if (!value.trim()) error = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(value)) error = "Invalid email address";
        break;
      case "password":
        if (!value) error = "Password is required";
        else if (value.length < 8)
          error = "Password must be at least 8 characters";
        break;
      case "confirmPassword":
        if (!value) error = "Confirm Password is required";
        else if (value !== formData.password) error = "Passwords do not match";
        break;
      case "phone":
        if (!value.trim()) error = "Phone number is required";
        else if (!/^03\d{9}$/.test(value))
          error = "Phone number must start with 03 and be 11 digits total";
        break;
      case "address":
        if (!value.trim()) error = "Full Address is required";
        break;
      case "bio":
        if (!value.trim()) error = "Bio is required";
        break;
      case "paymentMethod":
        if (!value) error = "Please select a payment method";
        break;
      case "accountName":
        if (
          (formData.paymentMethod === "JazzCash" ||
            formData.paymentMethod === "EasyPaisa") &&
          !value.trim()
        )
          error = "Account Name is required";
        break;
      case "accountNumber":
        if (
          (formData.paymentMethod === "JazzCash" ||
            formData.paymentMethod === "EasyPaisa") &&
          !/^\d{10,14}$/.test(value)
        )
          error = "Enter a valid wallet number (10–14 digits)";
        break;
      case "bankName":
        if (formData.paymentMethod === "BankAccount" && !value.trim())
          error = "Bank Name is required";
        break;
      case "bankAccountTitle":
        if (formData.paymentMethod === "BankAccount" && !value.trim())
          error = "Account Title is required";
        break;
      case "bankAccountNumber":
        if (
          formData.paymentMethod === "BankAccount" &&
          !/^\d{8,24}$/.test(value)
        )
          error = "Enter a valid bank account number (8–24 digits)";
        break;
      case "bankIban":
        if (
          formData.paymentMethod === "BankAccount" &&
          value &&
          !/^PK\d{2}[A-Z0-9]{20}$/.test(value.toUpperCase())
        )
          error = "Invalid Pakistan IBAN format";
        break;
      case "agreeTerms":
        if (!value) error = "You must accept the Terms & Conditions";
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, type, value, checked, files } = e.target;
    const val =
      type === "checkbox" ? checked : type === "file" ? files[0] : value;

    setFormData((prev) => {
      const newData = { ...prev, [name]: val };
      // Validating confirm password if password changes
      if (name === "password") {
        if (newData.confirmPassword) {
          setErrors((prevErr) => ({
            ...prevErr,
            confirmPassword:
              newData.confirmPassword !== val ? "Passwords do not match" : "",
          }));
        }
      }
      return newData;
    });

    const error = validateField(name, val);
    setErrors((prev) => ({ ...prev, [name]: error }));
    if (errorMsg) setErrorMsg("");
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    Object.keys(formData).forEach((key) => {
      if (key === "logo") return;
      if (
        (key === "accountName" || key === "accountNumber") &&
        formData.paymentMethod !== "JazzCash" &&
        formData.paymentMethod !== "EasyPaisa"
      )
        return;
      if (
        key.startsWith("bank") &&
        key !== "bankIban" &&
        formData.paymentMethod !== "BankAccount"
      )
        return;
      // Added missing strict check for BankAccount fields
      if (formData.paymentMethod === "BankAccount" && (key === "bankName" || key === "bankAccountTitle" || key === "bankAccountNumber")) {
        // These are required, fall through to validateField
      } else if (key === "bankIban" && formData.paymentMethod !== "BankAccount")
        return;

      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setErrorMsg("Please fix the errors below.");
      return;
    }

    // Double check XSS on submission
    const allValues = Object.values(formData).filter(
      (v) => typeof v === "string"
    );
    if (allValues.some((v) => hasXSS(v))) {
      setErrorMsg("Security blocked: Invalid input detected.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const d = new FormData();
    [
      "fullName",
      "email",
      "password",
      "confirmPassword",
      "phone",
      "address",
      "bio",
      "location",
      "paymentMethod",
    ].forEach((k) => formData[k] && d.append(k, formData[k]));
    // Only append logo if it exists
    if (formData.logo) {
      d.append("logo", formData.logo);
    }

    if (
      formData.paymentMethod === "JazzCash" ||
      formData.paymentMethod === "EasyPaisa"
    ) {
      d.append("accountName", formData.accountName);
      d.append("accountNumber", formData.accountNumber);
    } else if (formData.paymentMethod === "BankAccount") {
      d.append("bankName", formData.bankName);
      d.append("bankAccountTitle", formData.bankAccountTitle);
      d.append("bankAccountNumber", formData.bankAccountNumber);
      if (formData.bankIban) d.append("bankIban", formData.bankIban);
    }

    try {
      console.log(
        "Submitting registration to:",
        axios.defaults.baseURL + "/reseller/register/reseller"
      );

      const response = await axios({
        method: "post",
        url: "/reseller/register/reseller",
        data: d,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        validateStatus: function (status) {
          // Accept any status code from 200-299 as success
          return status >= 200 && status < 300;
        },
      });

      console.log("✅ Registration successful:", response.data);

      setSuccess(true);
      navigate("/Login", { replace: true });
    } catch (err) {
      console.error("❌ Registration error:", {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status,
      });

      if (err.code === "ERR_NETWORK" && !err.response) {
        setErrorMsg(
          "Registration may have succeeded. Please check your email or try logging in."
        );
      } else if (err.response) {
        setErrorMsg(
          err.response.data?.error ||
          err.response.data?.message ||
          "Registration failed"
        );
      } else {
        setErrorMsg(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const pm = formData.paymentMethod;




  return (
    <div className="min-h-screen bg-[#f8fafc] overflow-x-hidden relative">
      <Header />

      {/* Background Elements */}
      <div
        id="particles-background-reseller"
        className="fixed inset-0 pointer-events-none z-0"
      />
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="min-h-screen flex items-center justify-center p-4 py-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg mx-4 sm:mx-0" // Added mx-4 for mobile spacing
        >
          <div className="bg-white/70 backdrop-blur-2xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 relative overflow-hidden">
            {/* Top Gloss Effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />

            <div className="mb-8">
              <SignupTabs />
              <div className="mt-8 text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                  Become A Reseller
                </h2>
                <p className="text-gray-500 font-medium">
                  Turn Pre-Loved Luxury Into Profit
                </p>
              </div>
            </div>

            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50/50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <InputField
                  icon={User}
                  name="fullName"
                  error={errors.fullName}
                  onChange={handleChange}
                  value={formData.fullName}
                  placeholder="Full Name"
                  required
                />

                <InputField
                  icon={Mail}
                  name="email"
                  error={errors.email}
                  type="email"
                  onChange={handleChange}
                  value={formData.email}
                  placeholder="Email Address"
                  required
                />

                <InputField
                  icon={Phone}
                  name="phone"
                  error={errors.phone}
                  type="tel"
                  onChange={handleChange}
                  value={formData.phone}
                  placeholder="Phone (03...)"
                  title="Please enter a valid 11-digit phone number"
                  pattern="^03\d{9}$"
                  maxLength="11"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {" "}
                  {/* Stack on mobile */}
                  <div className="relative group">
                    <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-emerald-600">
                      <CreditCard size={18} />{" "}
                      {/* Generic lock icon replacement */}
                    </div>
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      onChange={handleChange}
                      value={formData.password}
                      placeholder="Password"
                      className={`w-full pl-10 pr-10 py-2.5 bg-white/50 border ${errors.password
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-200 hover:border-emerald-400 focus:ring-emerald-500/20 focus:border-emerald-500"
                        } rounded-lg outline-none focus:ring-2 transition-all text-base sm:text-sm`}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1 ml-1">
                        {errors.password}
                      </p>
                    )}
                  </div>
                  <div className="relative group">
                    <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-emerald-600">
                      <CreditCard size={18} />
                    </div>
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      onChange={handleChange}
                      value={formData.confirmPassword}
                      placeholder="Confirm"
                      className={`w-full pl-10 pr-10 py-2.5 bg-white/50 border ${errors.confirmPassword
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-200 hover:border-emerald-400 focus:ring-emerald-500/20 focus:border-emerald-500"
                        } rounded-lg outline-none focus:ring-2 transition-all text-base sm:text-sm`}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1 ml-1">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <InputField
                  icon={MapPin}
                  name="address"
                  error={errors.address}
                  onChange={handleChange}
                  value={formData.address}
                  placeholder="Full Business/Store Address"
                  required
                />

                <div className="relative group">
                  <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-emerald-600">
                    <FileText size={18} />
                  </div>
                  <textarea
                    name="bio"
                    onChange={handleChange}
                    value={formData.bio}
                    placeholder="Tell us a bit about yourself..."
                    className={`w-full pl-10 pr-4 py-2.5 bg-white/50 border ${errors.bio
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-200 hover:border-emerald-400 focus:ring-emerald-500/20 focus:border-emerald-500"
                      } rounded-lg outline-none focus:ring-2 transition-all resize-none h-24 text-sm`}
                    required
                  />
                  {errors.bio && (
                    <p className="text-red-500 text-xs mt-1 ml-1">
                      {errors.bio}
                    </p>
                  )}
                </div>

                {/* Logo Upload - Styled */}
                <div className="p-4 bg-gray-50/50 border border-dashed border-gray-300 rounded-xl hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group">
                  <label className="flex flex-col items-center cursor-pointer">
                    <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-emerald-600 mb-2 group-hover:scale-110 transition-transform">
                      <Upload size={20} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">
                      {formData.logo ? formData.logo.name : "Upload Store Logo"}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1">
                      Optional • Max 2MB
                    </span>
                    <input
                      name="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="border-t border-gray-100 my-2"></div>

                <div className="relative group">
                  <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-emerald-600">
                    <CreditCard size={18} />
                  </div>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 bg-white/50 border ${errors.paymentMethod
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-200 hover:border-emerald-400 focus:ring-emerald-500/20 focus:border-emerald-500"
                      } rounded-lg outline-none focus:ring-2 transition-all appearance-none cursor-pointer`}
                    required
                  >
                    <option value="">Select Payout Method</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="BankAccount">Bank Account</option>
                  </select>
                  {errors.paymentMethod && (
                    <p className="text-red-500 text-xs mt-1 ml-1">
                      {errors.paymentMethod}
                    </p>
                  )}
                </div>

                <AnimatePresence>
                  {(pm === "JazzCash" || pm === "EasyPaisa") && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      <InputField
                        icon={User}
                        name="accountName"
                        error={errors.accountName}
                        onChange={handleChange}
                        value={formData.accountName}
                        placeholder="Account Name"
                        required
                      />
                      <InputField
                        icon={CreditCard}
                        name="accountNumber"
                        error={errors.accountNumber}
                        onChange={handleChange}
                        value={formData.accountNumber}
                        placeholder="Wallet Number"
                        required
                      />
                    </motion.div>
                  )}

                  {pm === "BankAccount" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <InputField
                        icon={Landmark}
                        name="bankName"
                        error={errors.bankName}
                        onChange={handleChange}
                        value={formData.bankName}
                        placeholder="Bank Name"
                        required
                      />
                      <InputField
                        icon={User}
                        name="bankAccountTitle"
                        error={errors.bankAccountTitle}
                        onChange={handleChange}
                        value={formData.bankAccountTitle}
                        placeholder="Account Title"
                        required
                      />
                      <InputField
                        icon={Building}
                        name="bankAccountNumber"
                        error={errors.bankAccountNumber}
                        onChange={handleChange}
                        value={formData.bankAccountNumber}
                        placeholder="Account Number"
                        required
                      />
                      <InputField
                        icon={FileText}
                        name="bankIban"
                        error={errors.bankIban}
                        onChange={handleChange}
                        value={formData.bankIban}
                        placeholder="IBAN (Optional)"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col gap-1">
                  <div
                    className={`flex items-center gap-3 p-3 bg-gray-50/50 rounded-lg ${errors.agreeTerms ? "border border-red-300" : ""
                      }`}
                  >
                    <input
                      name="agreeTerms"
                      type="checkbox"
                      id="agreeTerms"
                      onChange={handleChange}
                      checked={formData.agreeTerms}
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                      required
                    />
                    <label
                      htmlFor="agreeTerms"
                      className="text-xs text-gray-600 cursor-pointer select-none"
                    >
                      I accept the{" "}
                      <span className="text-emerald-600 font-semibold hover:underline">
                        Terms & Conditions
                      </span>{" "}
                      and{" "}
                      <span className="text-emerald-600 font-semibold hover:underline">
                        Privacy Policy
                      </span>
                    </label>
                  </div>
                  {errors.agreeTerms && (
                    <p className="text-red-500 text-xs ml-1">
                      {errors.agreeTerms}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Account...
                    </span>
                  ) : (
                    "Create Reseller Account"
                  )}
                </button>

                <p className="text-center text-sm text-gray-500 mt-4">
                  Already have an account?{" "}
                  <Link
                    to="/Login"
                    className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResellerSignup;
