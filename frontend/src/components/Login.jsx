// src/Login.jsx
import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  User,
  Lock,
  Mail,
  Phone,
  CheckCircle,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axios.js";
import Header from "./Header.jsx";
import { hasXSS } from "../utils/security";
import { motion } from "framer-motion";

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [success, setSuccess] = useState(false);
  const [particlesLoaded, setParticlesLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const r = (localStorage.getItem("role") || "").trim().toLowerCase(); // Use 'r' for consistency with the provided snippet
    if (token && r) {
      // If token and role exist, user is logged in
      if (r === "designer") navigate("/designer/dashboard");
      else if (r === "reseller") navigate("/reseller/dashboard");
      else if (r === "buyer") navigate("/buyer-dashboard");
    }
  }, [navigate]);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    showPassword: false,
    userType: "user",
    error: "",
    loading: false,
  });

  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    agreeTerms: false,
    showPassword: false,
    showConfirmPassword: false,
    error: "",
    loading: false,
  });

  // Particles.js effect
  useEffect(() => {
    const loadParticles = async () => {
      try {
        if (typeof window !== "undefined" && !window.particlesJS) {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js";
          script.onload = () => {
            initializeParticles();
            setParticlesLoaded(true);
          };
          script.onerror = () => {
            console.error("Failed to load particles.js");
            setParticlesLoaded(true);
          };
          document.head.appendChild(script);
        } else {
          initializeParticles();
          setParticlesLoaded(true);
        }
      } catch (error) {
        console.error("Error loading particles:", error);
        setParticlesLoaded(true);
      }
    };

    const initializeParticles = () => {
      if (window.particlesJS) {
        window.particlesJS("particles-background", {
          particles: {
            number: { value: 60, density: { enable: true, value_area: 800 } },
            color: { value: "#10b981" },
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
            events: { onhover: { enable: true, mode: "grab" }, resize: true },
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

  useEffect(() => {
    if (!particlesLoaded) {
      const style = document.createElement("style");
      style.textContent = `
        @keyframes fallbackGlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .fallback-bg {
          background: linear-gradient(-45deg, #ffffff, #f0f0f0, #e0f0e0, #f0f0ff);
          background-size: 400% 400%;
          animation: fallbackGlow 15s ease infinite;
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [particlesLoaded]);

  const handleLoginChange = (field, value) => {
    setLoginData((prev) => ({ ...prev, [field]: value }));
    if (loginData.error) setLoginData((prev) => ({ ...prev, error: "" }));
  };

  const handleRegisterChange = (field, value) => {
    setRegisterData((prev) => ({ ...prev, [field]: value }));
    if (registerData.error) setRegisterData((prev) => ({ ...prev, error: "" }));
  };

  const handleLogin = async (e) => {
    e?.preventDefault();

    // XSS Validation
    if (hasXSS(loginData.email) || hasXSS(loginData.password)) {
      setLoginData((prev) => ({
        ...prev,
        error: "Invalid input detected. Please remove special characters.",
      }));
      return;
    }

    setLoginData((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const res = await axios.post(`/auth/login/${loginData.userType}`, {
        email: loginData.email,
        password: loginData.password,
      });

      const token = res.data?.token || "";
      const role = (res.data?.role || "").toLowerCase();
      const user = res.data?.user || {};

      // Normalize user fields that we often need
      const id = user.id || user._id || user.userId || "";
      const fullName = user.fullName || user.name || "";
      const brandName = user.brandName || fullName || "";
      const email = user.email || loginData.email || "";

      // Core auth state
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("email", email);

      // Unified profile (useful everywhere)
      const profile = { ...user, id, fullName, brandName, email, role };
      localStorage.setItem("userProfile", JSON.stringify(profile));

      // Set userInfo for Header consistency
      localStorage.setItem(
        "userInfo",
        JSON.stringify({ token, role, user: profile })
      );

      // Role-specific storage (so components can read a single key)
      if (role === "designer") {
        localStorage.setItem(
          "designer",
          JSON.stringify({ id, fullName, brandName, email })
        );
        localStorage.removeItem("buyer");
        localStorage.removeItem("reseller");
      } else if (role === "reseller") {
        localStorage.setItem(
          "reseller",
          JSON.stringify({ id, fullName, email })
        );
        localStorage.removeItem("designer");
        localStorage.removeItem("buyer");
      } else {
        // Treat as buyer/user
        localStorage.setItem("buyer", JSON.stringify({ id, fullName, email }));
        localStorage.removeItem("designer");
        localStorage.removeItem("reseller");
      }

      // Trigger header and other components to update
      window.dispatchEvent(new Event("authUpdated"));
      window.dispatchEvent(new Event("storage")); // For cross-tab if needed

      const redirectUrl = localStorage.getItem("redirectAfterLogin");
      if (redirectUrl) {
        localStorage.removeItem("redirectAfterLogin");
        navigate(redirectUrl);
      } else {
        switch (role) {
          case "designer":
            navigate("/designer/dashboard");
            break;
          case "reseller":
            navigate("/reseller/dashboard");
            break;
          case "buyer":
            navigate("/buyer-dashboard");
            break;
          default:
            navigate("/");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginData((prev) => ({
        ...prev,
        error:
          err.response?.data?.error ||
          "Login failed. Please check your credentials.",
      }));
    } finally {
      setLoginData((prev) => ({ ...prev, loading: false }));
    }
  };

  const validateRegisterForm = () => {
    // XSS Validation for Registration
    if (
      hasXSS(registerData.fullName) ||
      hasXSS(registerData.email) ||
      hasXSS(registerData.password) ||
      hasXSS(registerData.phone)
    ) {
      return setErr("Invalid input detected. No scripts allowed.");
    }

    if (!registerData.fullName.trim()) return setErr("Full name is required");
    if (!registerData.email.trim()) return setErr("Email is required");
    if (!registerData.password) return setErr("Password is required");
    if (registerData.password.length < 8)
      return setErr("Password must be at least 8 characters long");
    if (registerData.password !== registerData.confirmPassword)
      return setErr("Passwords do not match");
    if (!registerData.phone.trim()) return setErr("Phone number is required");
    if (!/^03\d{9}$/.test(registerData.phone))
      return setErr(
        "Please enter a valid 11-digit phone number (e.g., 03123456789)"
      );
    if (!registerData.agreeTerms)
      return setErr("You must agree to the terms and conditions");
    return true;

    function setErr(msg) {
      setRegisterData((prev) => ({ ...prev, error: msg }));
      return false;
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    if (!validateRegisterForm()) return;
    setRegisterData((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const submitData = {
        fullName: registerData.fullName,
        email: registerData.email,
        password: registerData.password,
        confirmPassword: registerData.confirmPassword,
        phone: registerData.phone,
        agreeToTerms: "true",
      };
      await axios.post("/user/register", submitData, {
        headers: { "Content-Type": "application/json" },
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsRegister(false);
        setRegisterData({
          fullName: "",
          email: "",
          password: "",
          confirmPassword: "",
          phone: "",
          agreeTerms: false,
          showPassword: false,
          showConfirmPassword: false,
          error: "",
          loading: false,
        });
      }, 3000);
    } catch (err) {
      console.error("User registration error:", err);
      let errorMessage = "Registration failed";
      if (err.response?.data?.error) errorMessage = err.response.data.error;
      else if (err.response?.status === 500)
        errorMessage = "Server error. Please try again later.";
      else if (err.code === "ERR_NETWORK")
        errorMessage =
          "Cannot connect to server. Please check if backend is running.";
      setRegisterData((prev) => ({ ...prev, error: errorMessage }));
    } finally {
      setRegisterData((prev) => ({ ...prev, loading: false }));
    }
  };

  const SocialButton = ({ icon }) => (
    <a
      href="#"
      className="w-10 h-10 border-2 border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors mx-1"
    >
      <i className={`bx ${icon} text-lg`}></i>
    </a>
  );

  if (success) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="min-h-screen flex items-center justify-center relative">
          <div className="absolute inset-0 bg-white"></div>
          <div className="relative z-10 w-full max-w-md bg-white/90 p-8 rounded-xl shadow-lg text-center mx-4">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Registration Successful!
            </h2>
            <p className="text-gray-600 mb-4">
              Your account has been created successfully.
            </p>
            <p className="text-sm text-gray-500">
              Switching to login form in 3 seconds...
            </p>
            <button
              onClick={() => {
                setSuccess(false);
                setIsRegister(false);
              }}
              className="mt-4 bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors"
            >
              Go to Login Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] overflow-hidden relative font-sans">
      <Header />
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div
          id="particles-background"
          className={`fixed inset-0 pointer-events-none z-0 ${
            !particlesLoaded ? "fallback-bg" : ""
          }`}
        />
        <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`login-container relative w-full max-w-[850px] h-[550px] bg-white/70 backdrop-blur-2xl rounded-[30px] shadow-[0_0_30px_rgba(0,0,0,0.2)] border border-white/60 overflow-hidden mx-4 ${
            isRegister ? "active" : ""
          }`}
        >
          {/* Login Form */}
          <div className="form-box login">
            <form className="w-full h-full flex items-center justify-center px-12">
              <div className="w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
                  Login
                </h1>
                {loginData.error && (
                  <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
                    {loginData.error}
                  </div>
                )}



                <div className="space-y-4">
                  <div className="input-box group">
                    <input
                      type="email"
                      value={loginData.email}
                      onChange={(e) =>
                        handleLoginChange("email", e.target.value)
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      placeholder="Email Address"
                      required
                      className="transition-transform duration-200 focus:scale-[1.02] origin-left"
                    />
                    <Mail className="input-icon group-focus-within:text-emerald-500 transition-colors" />
                  </div>

                  <div className="input-box group">
                    <input
                      type={loginData.showPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) =>
                        handleLoginChange("password", e.target.value)
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      placeholder="Password"
                      required
                      className="transition-transform duration-200 focus:scale-[1.02] origin-left"
                    />
                    <Lock className="input-icon group-focus-within:text-emerald-500 transition-colors" />
                    <button
                      type="button"
                      onClick={() =>
                        handleLoginChange(
                          "showPassword",
                          !loginData.showPassword
                        )
                      }
                      className="password-toggle"
                    >
                      {loginData.showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div className="forgot-link text-right mb-4">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={loginData.loading}
                    className="login-btn w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {loginData.loading ? "Signing in..." : "Login"}
                  </button>

                  {/* Social login removed for security - placeholder buttons posed phishing risk */}

                  {/* Mobile Mobile Toggle Link */}
                  <div className="mt-6 text-center lg:hidden">
                    <p className="text-sm text-gray-600">
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setIsRegister(true)}
                        className="text-emerald-600 font-bold hover:underline"
                      >
                        Sign Up
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Register Form */}
          <div className="form-box register">
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="w-full max-w-xs mx-auto">
                <h1 className="text-3xl font-bold text-center mb-3 text-gray-800">
                  Registration
                </h1>
                {registerData.error && (
                  <div className="bg-red-100 text-red-600 p-2 rounded-lg mb-2 text-xs text-center">
                    {registerData.error}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="input-box">
                    <input
                      type="text"
                      value={registerData.fullName}
                      onChange={(e) =>
                        handleRegisterChange("fullName", e.target.value)
                      }
                      placeholder="Full Name"
                      required
                      className="text-sm"
                    />
                    <User className="input-icon" size={16} />
                  </div>

                  <div className="input-box">
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={(e) =>
                        handleRegisterChange("email", e.target.value)
                      }
                      placeholder="Email"
                      required
                      className="text-sm"
                    />
                    <Mail className="input-icon" size={16} />
                  </div>

                  <div className="input-box">
                    <input
                      type="tel"
                      value={registerData.phone}
                      onChange={(e) =>
                        handleRegisterChange("phone", e.target.value)
                      }
                      placeholder="03123456789"
                      pattern="^03\d{9}$"
                      maxLength="11"
                      title="Please enter a valid 11-digit phone number (e.g., 03123456789)"
                      required
                      className="text-sm"
                    />
                    <Phone className="input-icon" size={16} />
                  </div>

                  <div className="input-box">
                    <input
                      type={registerData.showPassword ? "text" : "password"}
                      value={registerData.password}
                      onChange={(e) =>
                        handleRegisterChange("password", e.target.value)
                      }
                      placeholder="Password"
                      required
                      className="text-sm"
                    />
                    <Lock className="input-icon" size={16} />
                    <button
                      type="button"
                      onClick={() =>
                        handleRegisterChange(
                          "showPassword",
                          !registerData.showPassword
                        )
                      }
                      className="password-toggle"
                    >
                      {registerData.showPassword ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </button>
                  </div>

                  <div className="input-box">
                    <input
                      type={
                        registerData.showConfirmPassword ? "text" : "password"
                      }
                      value={registerData.confirmPassword}
                      onChange={(e) =>
                        handleRegisterChange("confirmPassword", e.target.value)
                      }
                      placeholder="Confirm Password"
                      required
                      className="text-sm"
                    />
                    <Lock className="input-icon" size={16} />
                    <button
                      type="button"
                      onClick={() =>
                        handleRegisterChange(
                          "showConfirmPassword",
                          !registerData.showConfirmPassword
                        )
                      }
                      className="password-toggle"
                    >
                      {registerData.showConfirmPassword ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </button>
                  </div>

                  <div className="terms-box flex items-center mt-1 mb-1">
                    <input
                      type="checkbox"
                      checked={registerData.agreeTerms}
                      onChange={(e) =>
                        handleRegisterChange("agreeTerms", e.target.checked)
                      }
                      className="mr-2 w-3 h-3"
                      required
                    />
                    <label className="text-xs text-gray-600">
                      I agree with terms
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={registerData.loading}
                    className="register-btn w-full h-8 bg-emerald-500 text-white rounded text-sm font-semibold disabled:opacity-50"
                  >
                    {registerData.loading ? "Creating..." : "Register"}
                  </button>

                  {/* Social registration removed for security - placeholder buttons posed phishing risk */}

                  {/* Mobile Toggle Link */}
                  <div className="mt-4 text-center lg:hidden">
                    <p className="text-sm text-gray-600">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setIsRegister(false)}
                        className="text-emerald-600 font-bold hover:underline"
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Box */}
          <div className="toggle-box">
            <div className="toggle-panel toggle-left">
              <h1 className="text-4xl font-bold mb-4">Hello, Welcome!</h1>
              <p className="mb-8 text-lg">Don't have an account?</p>
              <button
                onClick={() => setIsRegister(true)}
                className="toggle-btn px-10 py-3 border-2 border-white rounded-lg text-white hover:bg-white hover:text-emerald-600 transition-transform duration-300 font-semibold"
              >
                Sign Up
              </button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
              <p className="mb-8 text-lg">Already have an account?</p>
              <button
                onClick={() => setIsRegister(false)}
                className="toggle-btn px-10 py-3 border-2 border-white rounded-lg text-white hover:bg-white hover:text-emerald-600 transition-transform duration-300 font-semibold"
              >
                Sign In
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Styles (unchanged from your version) */}
      <style jsx global>{`
          width: 100%;
          max-width: 850px;
          height: 600px;
          border-radius: 30px;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          margin: 0 20px;
        }
        @media (max-width: 1024px) {
          .login-container {
            height: auto;
            min-height: 600px;
          }
          .login-container .toggle-box {
            display: none;
          }
          .form-box {
             width: 100% !important;
          }
          .form-box.login, .form-box.register {
             position: relative !important;
             width: 100% !important;
             right: auto !important;
             transform: none !important;
             visibility: visible !important;
             height: auto !important;
             padding: 40px 20px !important;
          }
          .form-box.register {
             display: none;
          }
          .login-container.active .form-box.login {
             display: none;
          }
          .login-container.active .form-box.register {
             display: flex;
          }
        }
        .form-box.register {
          visibility: hidden;
          position: absolute;
          right: 0;
          width: 50%;
          height: 100%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1;
          transition: 0.6s ease-in-out 1.2s, visibility 0s 1s;
        }
        .form-box.register .w-full.max-w-xs {
          width: 100%;
          max-width: 280px;
          margin: 0 auto;
        }
        .form-box.register .space-y-2 {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .form-box.register .input-box {
          position: relative;
          margin: 2px 0;
          width: 100%;
        }
        .form-box.register .input-box input {
          width: 100%;
          padding: 8px 35px 8px 12px;
          background: #eee;
          border-radius: 6px;
          border: none;
          outline: none;
          font-size: 12px;
          color: #333;
          font-weight: 500;
        }
        .form-box.register .input-box input::placeholder {
          color: #888;
          font-weight: 400;
          font-size: 14px;
        }
        .form-box.register .input-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          height: 14px;
          width: 14px;
          color: #333;
        }
        .form-box.register .password-toggle {
          position: absolute;
          right: 30px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 2px;
        }
        .form-box.register .register-btn {
          width: 100%;
          height: 42px;
          background: #10b981;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 15px;
          color: #fff;
          font-weight: 600;
        }
        .form-box.register .social-icons {
          display: flex;
          justify-content: center;
          gap: 4px;
        }
        .form-box.register .social-icon {
          display: inline-flex;
          padding: 4px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 12px;
          color: #333;
          text-decoration: none;
        }
        @media screen and (max-width: 650px) {
          .form-box.register {
            bottom: 0;
            width: 100%;
            height: 70%;
            padding: 15px;
          }
          .form-box.register .w-full.max-w-sm {
            max-width: 280px;
          }
          .form-box.register .input-box input {
            padding: 10px 40px 10px 12px;
            font-size: 14px;
          }
          .form-box.register .input-icon {
            right: 12px;
            font-size: 16px;
          }
          .form-box.register .password-toggle {
            right: 35px;
          }
        }
        .form-box {
          position: absolute;
          right: 0;
          width: 50%;
          height: 100%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          z-index: 1;
          transition: 0.6s ease-in-out 1.2s, visibility 0s 1s;
        }
        .login-container.active .form-box {
          right: 50%;
        }
        .form-box.register {
          visibility: hidden;
        }
        .login-container.active .form-box.register {
          visibility: visible;
        }
        .form-box form {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .input-box {
          position: relative;
          margin: 20px 0;
          width: 100%;
        }
        .input-box input {
          width: 100%;
          padding: 15px 50px 15px 20px;
          background: #f1f1f1;
          border-radius: 8px;
          border: none;
          outline: none;
          font-size: 16px;
          color: #333;
          font-weight: 500;
        }
        .input-box input::placeholder {
          color: #888;
          font-weight: 400;
        }
        .input-icon {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          height: 20px;
          width: 20px;
          color: #666;
        }
        .password-toggle {
          position: absolute;
          right: 45px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 5px;
        }
        .forgot-link {
          margin: -10px 0 15px;
        }
        .forgot-link a {
          font-size: 14.5px;
          color: #666;
          text-decoration: none;
        }
        .forgot-link a:hover {
          color: #333;
        }
        .login-btn,
        .register-btn {
          width: 100%;
          height: 48px;
          background: #10b981;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 16px;
          color: #fff;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .login-btn:hover,
        .register-btn:hover {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        .social-icons {
          display: flex;
          justify-content: center;
        }
        .social-icons a {
          display: inline-flex;
          padding: 8px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 18px;
          color: #666;
          text-decoration: none;
          margin: 0 5px;
          transition: all 0.3s ease;
        }
        .social-icons a:hover {
          border-color: #10b981;
          color: #10b981;
          transform: translateY(-2px);
        }
        .toggle-box {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        .toggle-box::before {
          content: "";
          position: absolute;
          left: -250%;
          width: 300%;
          height: 100%;
          background: linear-gradient(to right, #10b981, #059669);
          border-radius: 150px;
          z-index: 2;
          transition: 1.8s ease-in-out;
        }
        .login-container.active .toggle-box::before {
          left: 50%;
        }
        .toggle-panel {
          position: absolute;
          width: 50%;
          height: 100%;
          color: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 2;
          padding: 40px;
          text-align: center;
        }
        .toggle-panel.toggle-left {
          left: 0;
          transition: 1.2s ease-in-out;
        }
        .login-container.active .toggle-panel.toggle-left {
          left: -50%;
          transition-delay: 0.6s;
        }
        .toggle-panel.toggle-right {
          right: -50%;
          transition: 1.2s ease-in-out;
          transition-delay: 0.6s;
        }
        .login-container.active .toggle-panel.toggle-right {
          right: 0;
          transition-delay: 1.2s;
        }
        .toggle-btn {
          width: 160px;
          height: 46px;
          background: transparent;
          border: 2px solid #fff;
          box-shadow: none;
        }
        .toggle-btn:hover {
          background: #fff;
          color: #059669;
        }
        @media screen and (max-width: 768px) {
          .login-container {
            height: auto;
            min-height: 700px;
            border-radius: 20px;
          }
          .form-box {
            width: 100%;
            height: 100%;
            position: relative;
            padding: 20px;
            transition: none;
            right: auto;
            bottom: auto;
            top: auto;
            display: flex; /* Default flex */
          }
          /* On mobile, we hide the non-active form completely */
          .form-box.login {
            display: flex;
          }
          .form-box.register {
            display: none;
            width: 100%;
            height: 100%;
            position: relative;
            visibility: visible;
          }

          /* Active states for mobile - override desktop sliding */
          .login-container.active .form-box.login {
            display: none;
          }
          .login-container.active .form-box.register {
            display: flex;
            right: auto;
          }

          /* Hide the fancy toggle box on mobile */
          .toggle-box {
            display: none;
          }

          /* Adjust inputs for mobile */
          .input-box input {
            padding: 12px 45px 12px 15px;
            font-size: 16px; /* Prevent Zoom */
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
