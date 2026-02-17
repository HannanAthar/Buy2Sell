# Auto-Logout Feature Documentation

This feature implements automatic user logout after 30 minutes of inactivity.

## Configuration

The inactivity timeout is configured via environment variables.

1.  **Backend**: `backend/.env`

    ```bash
    SESSION_TIMEOUT_MS=1800000  # 30 minutes (Default)
    ```

2.  **Frontend**: `frontend/.env`
    ```bash
    VITE_SESSION_TIMEOUT_MS=1800000  # 30 minutes (Default)
    ```

**Note:** Ensure both values are synchronized.

## Feature Scope

- **Included Roles**: Reseller, Designer, Buyer/User.
- **Excluded Roles**: **Admin** users are NEVER automatically logged out.

## Files Changed/Created

- **Frontend**:

  - `frontend/src/hooks/useIdleLogout.js` (New): Handles idle detection and client-side logout.
  - `frontend/src/components/AutoLogout.jsx` (New): Component to mount the hook.
  - `frontend/src/App.jsx` (Modified): Mounts `AutoLogout` globally.

- **Backend**:
  - `backend/middlewares/sessionTimeout.js` (New): Server-side middleware to check activity timestamp.
  - `backend/middlewares/authMiddleware.js` (Modified): Calls session timeout check after authentication.
  - `backend/models/User.js`, `Designer.js`, `Reseller.js` (Modified): Added `lastActivity` field.

## Manual Verification

To verify functionality in the future (without waiting 30 mins):

1.  Change the environment variables to a shorter duration (e.g., `60000` for 1 minute).
2.  Restart servers.
3.  Log in as a non-admin user and wait.
4.  Admin users should remain logged in indefinitely.

## Notes

- **Token Expiry**: The JWT token itself has a separate expiry (7 days). This feature enforces inactivity logout _within_ that validity period.
- **Logout Endpoint**: The "Logout" action clears client-side storage.
