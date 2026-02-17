import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_MS = 25 * 60 * 1000; // 25 minutes (Show warning)

const AutoLogout = () => {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const timerRef = useRef(null);

  const isLoggedIn = () => {
    return !!localStorage.getItem("token");
  };

  const logout = useCallback(() => {
    // Check if we are already logged out (or on login page) to avoid loops
    if (!isLoggedIn() || window.location.pathname === "/Login") return;

    console.warn("🔒 AutoLogout: Session expired or user logged out. Path:", window.location.pathname);
    // Clear storage
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("userProfile");
    localStorage.removeItem("designer");
    localStorage.removeItem("reseller");
    localStorage.removeItem("buyer");
    localStorage.removeItem("userInfo");

    setShowWarning(false);
    navigate("/Login", { replace: true });
    toast.error("You have been logged out due to inactivity.");
  }, [navigate]);

  const checkActivity = useCallback(() => {
    if (!isLoggedIn() || window.location.pathname === "/Login") return;

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    if (timeSinceLastActivity >= TIMEOUT_MS) {
      logout();
    } else if (timeSinceLastActivity >= WARNING_MS) {
      if (!showWarning) setShowWarning(true);
    }
  }, [logout, showWarning]);

  // Reset timer on activity (only if warning is NOT shown)
  const handleActivity = useCallback(() => {
    if (!showWarning && isLoggedIn()) {
      lastActivityRef.current = Date.now();
    }
  }, [showWarning]);

  const stayLoggedIn = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
  }, []);

  // Reset activity on login
  const logInStatus = isLoggedIn();
  useEffect(() => {
    if (logInStatus) {
      stayLoggedIn();
    }
  }, [logInStatus, stayLoggedIn]);

  useEffect(() => {
    // Events to listen for
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];

    const onEvent = () => handleActivity();

    events.forEach((e) => window.addEventListener(e, onEvent));
    window.addEventListener("authUpdated", stayLoggedIn);

    // Check every second
    timerRef.current = setInterval(checkActivity, 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onEvent));
      window.removeEventListener("authUpdated", stayLoggedIn);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handleActivity, checkActivity, stayLoggedIn]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 text-center borderBorder-gray-100 animate-in fade-in zoom-in duration-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Session About to Expire
        </h2>
        <p className="text-gray-600 mb-8">
          You will be logged out due to inactivity in 5 minutes. Click 'Stay
          Logged In' to continue your session.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={stayLoggedIn}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors shadow-sm"
          >
            Stay Logged In
          </button>
          <button
            onClick={logout}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition-colors"
          >
            Log Out Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoLogout;
