import User from "../models/User.js";
import Designer from "../models/Designer.js";
import Reseller from "../models/Reseller.js";
import Admin from "../models/Admin.js";

/**
 * Checks if the user has been inactive for more than 30 minutes.
 * If so, returns 401. Otherwise updates lastActivity.
 * Should be used after authentication middleware that populates req.user.
 */
export const checkSessionTimeout = async (req, res, next) => {
  if (!req.user) {
    return next();
  }

  // Admin exclusion: Admins should never auto-logout
  if (req.user.role === "admin") {
    return next();
  }

  const now = Date.now();
  // Default to 30 mins (1800000 ms) if not set
  const TIMEOUT = parseInt(process.env.SESSION_TIMEOUT_MS) || 30 * 60 * 1000;

  // If lastActivity is undefined (legacy users or first login), treat as active (now)
  const lastActivityVal = req.user.lastActivity || req.user.lastLogin || now;
  const lastActivityTime = new Date(lastActivityVal).getTime();

  // Check timeout
  if (now - lastActivityTime > TIMEOUT) {
    console.log(
      `❌ Session timeout for user ${req.user.email} (Role: ${req.user.role})`,
    );
    return res
      .status(401)
      .json({
        error: "Session expired due to inactivity. Please log in again.",
      });
  }

  // Update lastActivity if it's been more than 1 minute since last update
  // This prevents hitting the DB on every single request
  // Update lastActivity if it's been more than 1 minute since last update
  // This prevents hitting the DB on every single request
  if (now - lastActivityTime > 60 * 1000) {
    await updateUserActivity(req.user);
  }

  next();
};

/**
 * Updates the lastActivity field for the user in the database.
 * @param {Object} user - The user object from req.user
 */
export const updateUserActivity = async (user) => {
  if (!user) return;

  try {
    const { role } = user;
    const id = user._id || user.id;
    const update = { lastActivity: new Date() };

    switch (role) {
      case "buyer":
        await User.findByIdAndUpdate(id, update);
        break;
      case "designer":
        await Designer.findByIdAndUpdate(id, update);
        break;
      case "reseller":
        await Reseller.findByIdAndUpdate(id, update);
        break;
      case "admin":
        // Admin activity is tracked but timeouts are exempt
        await Admin.findByIdAndUpdate(id, update);
        break;
    }
  } catch (err) {
    console.error("⚠️ Error updating lastActivity:", err.message);
    // Don't throw, just log
  }
};
