import { useState, useRef, useCallback } from 'react';
import Toast from './Toast';

let toastRef = null;

export function ToastProvider({ children }) {
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  toastRef = useCallback((type, title, message, duration = 3000) => {
    setToastConfig({
      visible: true,
      type,
      title,
      message,
      duration,
    });
  }, []);

  return (
    <>
      {children}
      <Toast
        visible={toastConfig.visible}
        type={toastConfig.type}
        title={toastConfig.title}
        message={toastConfig.message}
        duration={toastConfig.duration}
        onHide={() => setToastConfig(prev => ({
          ...prev, visible: false,
        }))}
      />
    </>
  );
}

// ✅ USE THIS ANYWHERE IN YOUR APP
export const showToast = (type, title, message, duration) => {
  if (toastRef) {
    toastRef(type, title, message, duration);
  }
};