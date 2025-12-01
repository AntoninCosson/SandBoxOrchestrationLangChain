// components/ModalChatBox.jsx
import React, { useEffect } from "react";

export default function Modal({ open, onClose, children }) {
  useEffect(() => {
    function onKey(e) { 
      if (e.key === "Escape") onClose?.(); 
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-component="ChatModalBackdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Chat de réservation"
      style={styles.backdrop}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div data-component="ChatModalContent" style={styles.panel}>
        <button 
          data-component="ChatModalCloseButton"
          style={styles.close} 
          onClick={onClose} 
          aria-label="Fermer"
        >
          ×
        </button>
        <div data-component="ChatModalChildren">
          {children}
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
  },
  panel: {
    width: "min(92vw, 420px)", height: "min(88vh, 640px)",
    background: "linear-gradient(180deg,#171b26 0%, #12151d 100%)",
    border: "1px solid #222739", borderRadius: 16, position: "relative",
    boxShadow: "0 18px 60px rgba(0,0,0,.45)", overflow: "hidden"
  },
  close: {
    position: "absolute", top: 8, right: 10, width: 34, height: 34,
    borderRadius: 8, border: "1px solid #2b3146", background: "#0e1320",
    color: "#c9d4f3", cursor: "pointer", fontSize: 18
  }
};