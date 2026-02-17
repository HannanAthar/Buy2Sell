import { Link, useLocation } from "react-router-dom";

const SignupTabs = () => {
  const location = useLocation();

  return (
    <div className="flex justify-between mb-4 text-xs sm:text-sm font-semibold bg-white/70 p-2 rounded-t-xl">
      <Link
        to="/Reseller-Signup"
        className={`w-1/2 text-center ${
          location.pathname === "/Reseller-Signup"
            ? "underline font-bold"
            : "text-gray-700"
        }`}
      >
        Reseller Sign-Up
      </Link>
      <Link
        to="/Designer-Signup"
        className={`w-1/2 text-center ${
          location.pathname === "/Designer-Signup"
            ? "underline font-bold"
            : "text-gray-700"
        }`}
      >
        Designer Sign-Up
      </Link>
    </div>
  );
};

export default SignupTabs;
