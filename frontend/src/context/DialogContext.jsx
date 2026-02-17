import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import ConfirmModal from "../components/common/ConfirmModal";

const DialogContext = createContext(null);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};

export const DialogProvider = ({ children }) => {
  const [dialogs, setDialogs] = useState([]);

  // We need a ref to keep track of the resolve function for the current dialog
  // However, since we might stack dialogs (rare but possible), using an array ID based approach is safer.
  // For simplicity, we'll implement a single active dialog for now, or a stack if needed.
  // Let's go with a queue/stack system to be robust.

  const createDialog = (type, message, options = {}) => {
    return new Promise((resolve) => {
      const id = Date.now() + Math.random();
      const newDialog = {
        id,
        type,
        message,
        ...options, // title, confirmText, cancelText, isDestructive, etc.
        resolve,
        isOpen: true,
      };
      setDialogs((prev) => {
        return [...prev, newDialog];
      });
    });
  };

  const confirm = useCallback((message, options = {}) => {
    return createDialog("confirm", message, {
      title: "Confirm Action",
      confirmText: "Confirm",
      cancelText: "Cancel",
      isDestructive: false,
      ...options,
    });
  }, []);

  const alert = useCallback((message, options = {}) => {
    return createDialog("alert", message, {
      title: "Alert",
      confirmText: "OK",
      isDestructive: false,
      ...options,
    });
  }, []);

  // internal helper to close a specific dialog
  const closeDialog = (id, result) => {
    setDialogs((prev) => {
      const dialog = prev.find((d) => d.id === id);
      if (dialog && dialog.resolve) {
        dialog.resolve(result);
      }
      return prev.filter((d) => d.id !== id);
    });
  };

  // Listen for global events (for non-React files like storage.js)
  useEffect(() => {
    const handleGlobalDialog = (e) => {
      const { type, message, options } = e.detail || {};
      if (type === "alert") {
        alert(message, options);
      } else if (type === "confirm") {
        // Confirm from outside might be tricky to return promise,
        // but for now we only need alert for storage.js.
        // If we needed confirm, we'd need to pass a callback in detail or use some other mechanism.
        // For alerts, it's fire and forget (or just blocking UI until closed).
        confirm(message, options);
      }
    };

    window.addEventListener("buy2sell:dialog", handleGlobalDialog);
    return () =>
      window.removeEventListener("buy2sell:dialog", handleGlobalDialog);
  }, [alert, confirm]);

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {dialogs.map((dialog) => (
        <ConfirmModal
          key={dialog.id}
          isOpen={dialog.isOpen}
          title={dialog.title}
          message={dialog.message}
          confirmText={dialog.confirmText}
          cancelText={dialog.cancelText}
          isDestructive={dialog.isDestructive}
          // specific props for alert mode
          showCancel={dialog.type !== "alert"}
          onConfirm={() => closeDialog(dialog.id, true)}
          onClose={() => closeDialog(dialog.id, false)}
          // If it's an alert, clicking backdrop (onClose) should probably resolve true (acknowledged)
          // or we can handle it inside ConfirmModal to treat close as "confirm" for alerts.
          // For now, let's say alert returns true always when closed.
        />
      ))}
    </DialogContext.Provider>
  );
};
