// FrontEnd/components/CartView.js
import { useEffect, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { useRouter } from "next/router";
import { fetchWithAuth } from "../lib/api";
import { setCartFromServer, setCartFromGuest } from "../reducers/shop";

import AddressModal from "./AddressModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function CartView({ onClose }) {
  const router = useRouter();
  const { thanks, session_id } = router.query || {};
  const dispatch = useDispatch();
  const store = useStore();
  const isLogged = useSelector((s) => s.user.connected);
  const user = useSelector((s) => s.user);
  const cart = useSelector((s) => s.shop.cartList);

  const [showAddr, setShowAddr] = useState(false);

  const subTotal = cart.reduce(
    (s, p) => s + (Number(p.price) || 0) * (Number(p.quantity) || 0),
    0
  );

  //
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    if (!thanks || !session_id) return;
    (async () => {
      try {
        const r = await fetch(`${API_URL}/payments/session/${session_id}`);
        const data = await r.json();
        if (data.success) setSummary(data);
      } catch (e) {}
    })();
  }, [thanks, session_id]);

  if (thanks) {
    return (
      <div data-component="CartViewThankYouContainer" style={{ padding: 24 }}>
        <h2 data-component="ThankYouTitle">Merci pour votre commande 🎉</h2>
        {summary ? (
          <>
            {summary.customer_email && (
              <p data-component="ReceiptEmailNotice">
                Un reçu a été envoyé à <b data-component="ReceiptEmail">{summary.customer_email}</b>.
              </p>
            )}
            <div data-component="OrderSummarySection" style={{ marginTop: 12 }}>
              <div 
                data-component="SummaryRow"
                data-row-type="subtotal"
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span data-component="SubtotalLabel">Sous-total</span>
                <b data-component="SubtotalAmount">{summary.amount_subtotal.toFixed(2)} €</b>
              </div>
              <div 
                data-component="SummaryRow"
                data-row-type="shipping"
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span data-component="ShippingLabel">
                  Livraison{" "}
                  {summary.shipping_option
                    ? `(${summary.shipping_option})`
                    : ""}
                </span>
                <b data-component="ShippingAmount">{summary.shipping.toFixed(2)} €</b>
              </div>
              <div
                data-component="SummaryRow"
                data-row-type="total"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 8,
                  fontSize: 18,
                }}
              >
                <span data-component="TotalLabel">Total payé</span>
                <b data-component="TotalAmount">{summary.amount_total.toFixed(2)} €</b>
              </div>
            </div>
            <ul 
              data-component="OrderItemsList"
              style={{ listStyle: "none", padding: 0, marginTop: 16 }}
            >
              {summary.items.map((it, i) => (
                <li
                  key={i}
                  data-component="OrderItem"
                  data-item-index={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 80px 60px 100px",
                    gap: 12,
                    padding: "6px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div data-component="OrderItemName">{it.name}</div>
                  <div data-component="OrderItemPrice">{it.unit_amount.toFixed(2)} €</div>
                  <div data-component="OrderItemQuantity">× {it.quantity}</div>
                  <div data-component="OrderItemSubtotal" style={{ textAlign: "right" }}>
                    {it.subtotal.toFixed(2)} €
                  </div>
                </li>
              ))}
            </ul>
            <div data-component="ThankYouActionsContainer" style={{ marginTop: 20, display: "flex", gap: 12 }}>
              <button 
                data-component="ReturnHomeButton"
                onClick={() => router.push("/")}
              >
                Retour à l'accueil
              </button>
            </div>
          </>
        ) : (
          <p data-component="LoadingMessage">Chargement du récap…</p>
        )}
      </div>
    );
  }

  // ===== Panier classique =====
  const updateQty = async (prod, qty) => {
    const q = Math.max(0, qty | 0);
    if (isLogged) {
      const res = await fetchWithAuth(`/shop/cart/${prod._id}`, {
        method: "PATCH",
        body: { quantity: q },
        getState: store.getState,
        dispatch,
      });
      if (res.ok && res.data?.success) {
        const ui = res.data.cart
          .filter((i) => i?.productId)
          .map((i) => ({ ...i.productId, quantity: i.quantity }));
        dispatch(setCartFromServer(ui));
      }
    } else {
      const key = "guestCart";
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      const i = arr.findIndex(
        (it) => String(it.productId) === String(prod._id)
      );
      if (i >= 0) {
        if (q <= 0) arr.splice(i, 1);
        else arr[i].quantity = q;
        localStorage.setItem(key, JSON.stringify(arr));
      }
      const byId = new Map(cart.map((p) => [String(p._id || p.id), p]));
      const ui = arr
        .map((it) => ({
          ...byId.get(String(it.productId)),
          quantity: it.quantity,
        }))
        .filter(Boolean);
      dispatch(setCartFromGuest(ui));
    }
  };

  const handleCheckout = async () => {
    if (!isLogged) return alert("Connecte-toi pour payer.");
    const res = await fetchWithAuth("/payments/checkout", {
      method: "POST",
      getState: store.getState,
      dispatch,
    });
    if (res.ok && res.data?.success) {
      window.location.href = res.data.url;
    } else {
      alert(res.data?.error || "Impossible de démarrer le paiement");
    }
  };

  return (
    <div data-component="CartViewContainer" style={{ padding: 24 }}>
      <h2 data-component="CartViewTitle">Mon panier</h2>
      {cart.length === 0 ? (
        <p data-component="EmptyCartMessage">Votre panier est vide.</p>
      ) : (
        <>
          <ul 
            data-component="CartItemsList"
            style={{ listStyle: "none", padding: 0 }}
          >
            {cart.map((p, i) => (
              <li
                key={p._id || i}
                data-component="CartItem"
                data-product-id={p._id || p.id}
                data-item-index={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 100px 90px 110px",
                  gap: 12,
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div data-component="CartItemInfo">
                  <div 
                    data-component="CartItemName"
                    style={{ fontWeight: 600 }}
                  >
                    {p.name}
                  </div>
                  {p.size && (
                    <div 
                      data-component="CartItemSize"
                      style={{ opacity: 0.7, fontSize: 12 }}
                    >
                      {p.size}
                    </div>
                  )}
                </div>
                <div data-component="CartItemPrice">
                  {p.price} €
                </div>
                <div data-component="CartItemQuantityContainer">
                  <select
                    data-component="QuantitySelector"
                    data-product-id={p._id || p.id}
                    value={p.quantity}
                    onChange={(e) => updateQty(p, parseInt(e.target.value, 10))}
                  >
                    {Array.from({ length: 11 }, (_, k) => k).map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div 
                  data-component="CartItemLineTotal"
                  style={{ textAlign: "right" }}
                >
                  {(p.price * p.quantity).toFixed(2)} €
                </div>
              </li>
            ))}
          </ul>

          <div
            data-component="CartSummarySection"
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 16,
              fontSize: 18,
            }}
          >
            <div data-component="SubtotalLabel">Sous-total</div>
            <strong data-component="SubtotalAmount">{subTotal.toFixed(2)} €</strong>
          </div>

          <div 
            data-component="CartActionsContainer"
            style={{ display: "flex", gap: 12, marginTop: 20 }}
          >
            {onClose && (
              <button 
                data-component="ContinueShoppingButton"
                onClick={onClose}
              >
                Continuer mes achats
              </button>
            )}
            <button 
              data-component="GoToCheckoutButton"
              onClick={() => setShowAddr(true)}
            >
              Aller au paiement
            </button>

            {showAddr && (
              <AddressModal
                open={showAddr}
                onClose={() => setShowAddr(false)}
                defaultEmail={user?.email || ""}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}