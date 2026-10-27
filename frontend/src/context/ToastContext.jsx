import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { BadgeCheck, AlertCircle } from "lucide-react";

const ToastContext = createContext(null);

export const UserToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("UserToast must be used within a ToastProvider");
  }

  return context;
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const timeoutRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToast({
      show: true,
      message,
      type,
    });

    timeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
      timeoutRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}

      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-lg transition-all duration-300 transform
          ${
            toast.show
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0 pointer-events-none"
          }
          ${
            toast.type === "success"
              ? "bg-slate-900 text-white"
              : "bg-red-600 text-white"
          }`}
      >
        {toast.type === "success" ? (
          <BadgeCheck className="h-5 w-5 text-emerald-400" />
        ) : (
          <AlertCircle className="h-5 w-5 text-white" />
        )}

        <p className="text-sm font-medium">{toast.message}</p>
      </div>
    </ToastContext.Provider>
  );
};
