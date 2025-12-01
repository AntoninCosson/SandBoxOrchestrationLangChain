// pages/ReservationSuccess.js
import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

export default function ReservationSuccess() {
  const [status, setStatus] = useState("Validation du paiement…");

  useEffect(() => {
    async function confirmPayment() {
      try {
        const url = new URL(window.location.href);
        const reservationId = url.searchParams.get("reservationId");

        if (!reservationId) {
          setStatus("Erreur : aucun reservationId fourni.");
          return;
        }

        const res = await fetch(`${API_BASE}/payment-confirmed`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reservationId }),
        });

        const data = await res.json();

        if (data.success) {
          setStatus("Paiement confirmé ✔️");

          localStorage.setItem("paymentConfirmed", reservationId);
        } else {
          setStatus("Erreur lors de la confirmation du paiement.");
        }
      } catch (err) {
        console.error("[ReservationSuccess] error:", err);
        setStatus("Erreur interne lors de la confirmation.");
      }
    }

    confirmPayment();
  }, []);

  const handleBack = () => {
    window.close();
  };

  return (
    <div style={{ padding: 40, textAlign: "center", color: "white" }}>
      <h1>{status}</h1>

      <button
        style={{
          marginTop: 20,
          padding: "10px 20px",
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
        }}
        onClick={handleBack}
      >
        Retourner au site
      </button>
    </div>
  );
}
