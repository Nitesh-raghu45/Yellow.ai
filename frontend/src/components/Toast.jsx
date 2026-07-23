import { useState } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  return (
    <div className={`toast toast-${type}`} onAnimationEnd={onClose}>
      {type === 'success' ? '✓' : '✗'} {message}
    </div>
  );
}

// Toast hook
export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };

  const ToastContainer = () =>
    toast ? (
      <Toast
        key={toast.id}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(null)}
      />
    ) : null;

  return { showToast, ToastContainer };
}
