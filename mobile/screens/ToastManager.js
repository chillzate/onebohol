// ============================================
// ZAVARA TOASTMANAGER.JS - v3.0
// ============================================
import {
  useState,
  useRef,
  useCallback,
  useContext,
  createContext,
  useEffect,
} from 'react';
import Toast from './Toast';

// ============================================
// CONSTANTS
// ============================================
const MAX_QUEUE = 5; // Never stack more than 5 toasts

// ============================================
// CONTEXT
// ============================================
const ToastContext = createContext(null);

// Module-level ref - persists across renders
let _showToast = null;

// ============================================
// TOAST PROVIDER
// ============================================
export function ToastProvider({ children }) {
  const [toastConfig, setToastConfig] = useState({
    visible:  false,
    type:     'info',
    title:    '',
    message:  '',
    duration: 3000,
  });

  const queue     = useRef([]);
  const isShowing = useRef(false);

  // ── PROCESS QUEUE ───────────────────────────
  const processQueue = useCallback(() => {
    if (queue.current.length === 0) {
      isShowing.current = false;
      return;
    }

    const next = queue.current.shift();
    isShowing.current = true;

    setToastConfig({
      visible:  true,
      type:     next.type     || 'info',
      title:    next.title    || '',
      message:  next.message  || '',
      duration: next.duration || 3000,
    });
  }, []);

  // ── SHOW TOAST ──────────────────────────────
  const showToastInternal = useCallback((
    type,
    title,
    message,
    duration = 3000
  ) => {
    // Enforce max queue limit
    if (queue.current.length >= MAX_QUEUE) {
      queue.current = queue.current.slice(-2);
    }

    queue.current.push({ type, title, message, duration });

    if (!isShowing.current) {
      processQueue();
    }
  }, [processQueue]);

  // ── HANDLE HIDE ─────────────────────────────
  const handleHide = useCallback(() => {
    setToastConfig(prev => ({ ...prev, visible: false }));
    isShowing.current = false;

    // Small delay before next toast
    setTimeout(() => {
      processQueue();
    }, 350);
  }, [processQueue]);

  // ── REGISTER GLOBAL ─────────────────────────
  // useEffect ensures cleanup on unmount
  useEffect(() => {
    _showToast = showToastInternal;
    return () => {
      _showToast = null;
    };
  }, [showToastInternal]);

  return (
    <ToastContext.Provider value={showToastInternal}>
      {children}
      <Toast
        visible={toastConfig.visible}
        type={toastConfig.type}
        title={toastConfig.title}
        message={toastConfig.message}
        duration={toastConfig.duration}
        onHide={handleHide}
      />
    </ToastContext.Provider>
  );
}

// ============================================
// PUBLIC API
// ============================================

// Main function - use anywhere
export const showToast = (
  type,
  title,
  message,
  duration = 3000
) => {
  if (_showToast) {
    _showToast(type, title, message, duration);
  } else {
    // Provider not mounted yet - try again
    setTimeout(() => {
      if (_showToast) {
        _showToast(type, title, message, duration);
      }
    }, 500);
  }
};

// Convenience methods (like Shopee's toast API)
export const showSuccess = (title, msg, dur) =>
  showToast('success', title, msg, dur);

export const showError = (title, msg, dur) =>
  showToast('error', title, msg, dur);

export const showWarning = (title, msg, dur) =>
  showToast('warning', title, msg, dur);

export const showInfo = (title, msg, dur) =>
  showToast('info', title, msg, dur);

// Hook for components
export const useToast = () => {
  const ctx = useContext(ToastContext);
  return ctx || showToast;
};