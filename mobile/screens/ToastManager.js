// ============================================
// ZAVARA TOAST MANAGER - COMPLETE FIXED v2.1
// ============================================
import {
  useState,
  useRef,
  useCallback,
  useContext,
  createContext,
} from 'react';
import Toast from './Toast';

// 🔧 FIX: Use React Context instead of module variable
// This prevents hot-reload issues
const ToastContext = createContext(null);

// Internal queue to prevent toast override
let toastQueue = [];
let isShowing  = false;

// 🔧 FIX: Module-level ref that persists properly
let _showToast = null;

// ============================================
// TOAST PROVIDER
// ============================================
export function ToastProvider({ children }) {
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    type: 'success',
    title: '',
    message: '',
    duration: 3000,
  });

  // 🔧 FIX: Proper function reference
  const showToastInternal = useCallback((
    type,
    title,
    message,
    duration = 3000
  ) => {
    // Add to queue
    toastQueue.push({ type, title, message, duration });

    // Process queue if not already showing
    if (!isShowing) {
      processQueue(setToastConfig);
    }
  }, []);

  // Register globally
  _showToast = showToastInternal;

  const handleHide = useCallback(() => {
    setToastConfig(prev => ({ ...prev, visible: false }));
    isShowing = false;

    // 🆕 Process next in queue after hide animation
    setTimeout(() => {
      if (toastQueue.length > 0) {
        processQueue(setToastConfig);
      }
    }, 400);
  }, []);

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
// QUEUE PROCESSOR
// ============================================
function processQueue(setToastConfig) {
  if (toastQueue.length === 0) return;

  const next = toastQueue.shift();
  isShowing = true;

  setToastConfig({
    visible: true,
    type: next.type,
    title: next.title,
    message: next.message,
    duration: next.duration || 3000,
  });
}

// ============================================
// PUBLIC API - USE ANYWHERE IN YOUR APP
// ============================================

// 🔧 FIX: Safe global function
export const showToast = (
  type,
  title,
  message,
  duration = 3000
) => {
  if (_showToast) {
    _showToast(type, title, message, duration);
  } else {
    // Fallback: queue it for when provider is ready
    toastQueue.push({ type, title, message, duration });
    console.warn(
      'showToast called before ToastProvider mounted'
    );
  }
};

// 🆕 Convenience methods
export const showSuccess = (title, message, duration) =>
  showToast('success', title, message, duration);

export const showError = (title, message, duration) =>
  showToast('error', title, message, duration);

export const showWarning = (title, message, duration) =>
  showToast('warning', title, message, duration);

export const showInfo = (title, message, duration) =>
  showToast('info', title, message, duration);

// 🆕 Hook for components (optional)
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Return fallback if used outside provider
    return showToast;
  }
  return ctx;
};