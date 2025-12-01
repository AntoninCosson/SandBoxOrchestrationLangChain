// components/ChatBox.js - Version CLEAN (pas de boutons)
import { agentStream } from "../lib/agent";
import { useEffect, useRef, useState } from "react";
import { useStore } from "react-redux";

export default function Chatbox() {
  const store = useStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [ctx, setCtx] = useState({
    reservationId: "",
    date: "",
    time: "",
  });

  const messagesEndRef = useRef(null);
  const scrollRef = useRef(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
  const MAX_CHARS = 400;

  // Load welcome message on mount
  useEffect(() => {
    const loadWelcome = async () => {
      const state = store.getState();
      const token = state.user?.accessToken;
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE}/mcp/welcome`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) return;

        const data = await res.json();
        if (data.success) {
          setMessages([{
            role: "assistant",
            text: data.message,
          }]);
        }
      } catch (e) {
        console.error("[ChatBox] Welcome error:", e);
      }
    };

    loadWelcome();
  }, [store, API_BASE]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleChange(e) {
    const val = e.target.value;
    if (val.length > MAX_CHARS) return;
    setInput(val);
  }

  async function addReservationToCart() {
    try {
      const token = store.getState().user.accessToken;
      const res = await fetch(`${API_BASE}/shop/cart/add-reservation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reservationId: ctx.reservationId,
          date: ctx.date,
          time: ctx.time,
        }),
      });

      const data = await res.json();
      if (data.success) {
        store.dispatch({
          type: "shop/setCartFromServer",
          payload: data.cart,
        });
        setMessages((prev) => [...prev, {
          role: "system",
          text: "Ajouté au panier 🛒. Vous pouvez payer depuis la boutique.",
        }]);
      } else {
        setMessages((prev) => [...prev, {
          role: "system",
          text: `Erreur: ${data.error || data.message || "Impossible d'ajouter au panier"}`,
        }]);
      }
    } catch (e) {
      setMessages((prev) => [...prev, {
        role: "system",
        text: `Erreur réseau: ${e.message}`,
      }]);
    }
  }

  const stripeUrlRegex = /https:\/\/checkout\.stripe\.com\/\S*/;

  function renderMessageText(msg) {
    const text = msg.text || "";
    const match = text.match(stripeUrlRegex);

    if (!match) {
      return text;
    }

    const url = match[0];
    const before = text.slice(0, match.index);
    const after = text.slice(match.index + url.length);

    return (
      <>
        {before && <span>{before}</span>}
        <br />
        <a
          data-component="StripeCheckoutLink"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.stripeBtn}
        >
          Payer la réservation 💳
        </a>
        <button 
          data-component="AddReservationToCartButton"
          style={styles.cartBtn} 
          onClick={() => addReservationToCart()}
        >
          Ajouter au panier 🛒
        </button>
        {after && (
          <>
            <br />
            <span>{after}</span>
          </>
        )}
      </>
    );
  }

  async function onSend(e) {
    e?.preventDefault?.();
    if (isSending || quotaExceeded) return;

    const text = input.trim();
    if (!text) return;

    // Add user message
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");

    try {
      setIsSending(true);
      if (quotaExceeded) setQuotaExceeded(false);

      // Build history
      const history = messages.map((m) => ({
        role: m.role,
        content: m.text || "",
      }));

      // Add placeholder for assistant message
      const assistantMsgIndex = messages.length + 1;
      setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

      // Stream response
      const result = await agentStream(
        [...history, { role: "user", content: text }],
        { getState: store.getState },
        (event) => {
          if (event.type === "token") {
            // Update in real-time
            setMessages((prev) => {
              const updated = [...prev];
              updated[assistantMsgIndex] = {
                role: "assistant",
                text: event.data.partial,
              };
              return updated;
            });
          }
        }
      );

      // Finalize with full response
      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantMsgIndex] = {
          role: result.role,
          text: result.content || result.message,
        };
        return updated;
      });

    } catch (e) {
      if (e?.response?.status === 429 || e?.message?.includes("quota")) {
        setQuotaExceeded(true);
        setMessages((prev) => [...prev, {
          role: "system",
          text: "⚠️ Quota atteint. Réessayez demain.",
        }]);
      } else {
        setMessages((prev) => [...prev, {
          role: "system",
          text: `Erreur: ${e.message}`,
        }]);
      }
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div 
      data-component="ChatBoxContainer"
      style={styles.wrap}
    >
      <div 
        data-component="ChatBoxHeader"
        style={styles.header}
      >
        <div 
          data-component="ChatBoxStatusDot"
          style={styles.dot} 
        />
        <div 
          data-component="ChatBoxTitle"
          style={{ fontWeight: 600 }}
        >
          Assistant IA
        </div>
      </div>

      <div 
        ref={scrollRef} 
        data-component="ChatBoxMessagesContainer"
        style={styles.messages}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            data-component={`ChatMessage`}
            data-message-index={i}
            data-message-role={m.role}
            style={m.role === "user" ? styles.msgUser : styles.msgAssistant}
          >
            {renderMessageText(m)}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form 
        data-component="ChatBoxInputForm"
        onSubmit={onSend} 
        style={styles.inputRow}
      >
        <input
          data-component="ChatBoxInput"
          data-field-name="message"
          style={styles.input}
          value={input}
          onChange={handleChange}
          placeholder="Votre message…"
          disabled={isSending || quotaExceeded}
        />
        <button
          data-component="ChatBoxSendButton"
          style={styles.btn}
          type="submit"
          disabled={isSending || quotaExceeded}
        >
          {quotaExceeded ? "Quota atteint" : "Envoyer"}
        </button>
      </form>

      <div 
        data-component="ChatBoxCharacterCounter"
        style={styles.hint}
      >
        {input.length}/{MAX_CHARS} caractères
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    color: "#e8ecf3",
    fontFamily: "ui-sans-serif, system-ui",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderBottom: "1px solid #202538",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#6ee7b7",
    boxShadow: "0 0 8px #6ee7b7",
  },
  messages: {
    flex: 1,
    padding: 12,
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  msgUser: {
    alignSelf: "flex-end",
    background: "#2a2f42",
    border: "1px solid #323a55",
    borderRadius: 12,
    padding: "10px 12px",
    maxWidth: "85%",
  },
  msgAssistant: {
    alignSelf: "flex-start",
    background: "#1a1f2e",
    border: "1px solid #232a41",
    borderRadius: 12,
    padding: "10px 12px",
    maxWidth: "85%",
  },
  inputRow: {
    display: "flex",
    gap: 8,
    padding: 10,
    borderTop: "1px solid #202538",
    background: "#10131b",
  },
  input: {
    flex: 1,
    background: "#0d1119",
    color: "#e8ecf3",
    border: "1px solid #232a41",
    borderRadius: 10,
    padding: 12,
    outline: "none",
  },
  btn: {
    background: "#6ee7b7",
    color: "#052014",
    border: 0,
    padding: "10px 14px",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
  },
  stripeBtn: {
    display: "inline-block",
    marginTop: 8,
    padding: "8px 14px",
    borderRadius: 999,
    textDecoration: "none",
    fontWeight: 600,
    border: "1px solid #38bdf8",
    background: "linear-gradient(90deg, #0ea5e9, #22c55e)",
    color: "#0b1120",
    boxShadow: "0 0 10px rgba(34,197,94,0.4)",
    cursor: "pointer",
  },
  cartBtn: {
    marginTop: 10,
    padding: "10px 14px",
    borderRadius: 10,
    background: "#facc15",
    border: 0,
    color: "#1a1a1a",
    fontWeight: 700,
    cursor: "pointer",
  },
  hint: { fontSize: 12, opacity: 0.7, padding: "4px 10px 10px" },
};