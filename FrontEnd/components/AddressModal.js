// FrontEnd/components/AddressModal.js
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useStore } from "react-redux";
import { loadStripe } from "@stripe/stripe-js";
import { fetchWithAuth } from "../lib/api";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const debounce = (fn, ms = 350) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};
const mem = new Map();
async function suggestBAN(q, limit = 5) {
  const key = `${q}|${limit}`;
  if (mem.has(key)) return mem.get(key);
  const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
    q
  )}&limit=${limit}`;
  const r = await fetch(url);
  const j = await r.json();
  const items = (j.features || []).map((f) => ({
    label: f.properties.label,
    line1: f.properties.name || "",
    postcode: f.properties.postcode || "",
    city: f.properties.city || "",
    country: "FR",
  }));
  mem.set(key, items);
  return items;
}

export default function AddressModal({ open, onClose, defaultEmail }) {
  const dispatch = useDispatch();
  const store = useStore();

  const [step, setStep] = useState("form");
  const [email, setEmail] = useState(defaultEmail || "");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [shipping, setShipping] = useState({
    line1: "",
    line2: "",
    postcode: "",
    city: "",
    country: "FR",
  });
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState({
    line1: "",
    line2: "",
    postcode: "",
    city: "",
    country: "FR",
  });

  const [banQ, setBanQ] = useState("");
  const [banSug, setBanSug] = useState([]);
  const runSuggest = useMemo(
    () =>
      debounce(async (q) => {
        if (q && q.trim().length >= 3) setBanSug(await suggestBAN(q, 5));
        else setBanSug([]);
      }, 300),
    []
  );
  useEffect(() => {
    runSuggest(banQ);
  }, [banQ]);

  if (!open) return null;

  const applySuggestion = (s) => {
    setShipping((prev) => ({
      ...prev,
      line1: s.line1,
      postcode: s.postcode,
      city: s.city,
      country: s.country,
    }));
    setBanSug([]);
    setBanQ(s.label);
  };

  async function validateAndCheckout() {
    setErrorMsg("");

    const _shipping = {
      line1: (shipping.line1 || "").trim(),
      line2: (shipping.line2 || "").trim(),
      postcode: (shipping.postcode || "").trim().replace(/\s+/g, ""),
      city: (shipping.city || "").trim(),
      country: (shipping.country || "FR").trim(),
    };
    const _billing = billingSame
      ? _shipping
      : {
          line1: (billing.line1 || "").trim(),
          line2: (billing.line2 || "").trim(),
          postcode: (billing.postcode || "").trim().replace(/\s+/g, ""),
          city: (billing.city || "").trim(),
          country: (billing.country || "FR").trim(),
        };

    if (
      !firstName ||
      !lastName ||
      !phone ||
      !_shipping.line1 ||
      !_shipping.city ||
      !_shipping.postcode
    ) {
      setErrorMsg("Merci de remplir tous les champs obligatoires (*)");
      return;
    }

    try {
      setStep("loading");

      const payload = {
        q: banQ && banQ.trim().length >= 5 ? banQ.trim() : undefined,
        shipping: _shipping,
        billing: _billing,
      };

      const resp = await fetch(`${API_URL}/shipping/validate-address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const v = await resp.json();
      if (!v.success)
        throw new Error(v.error || "Validation d'adresse impossible");

      const shippingData = v.isValid ? v.normalized : _shipping;
      const billingData = v.isValid ? v.normalized : _billing;

      const res = await fetchWithAuth("/payments/checkout", {
        method: "POST",
        body: {
          customer_email: email.trim() || undefined,
          phone: phone.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          delivery_notes: deliveryNotes.trim() || undefined,
          shipping: shippingData,
          billing: billingData,
        },
        getState: store.getState,
        dispatch,
      });

      console.log("[CHECKOUT RES]", res);

      const data = res?.data ?? res;
      const checkoutUrl = data?.url || data?.sessionUrl || data?.session?.url;

      if (res?.ok && data?.success && checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error(data?.error || "Création de session Stripe échouée");
      }

    } catch (e) {
      console.error(e);
      alert(e.message || "Erreur");
      setStep("form");
    }
  }

  return (
    <div 
      data-component="AddressModalBackdrop"
      style={styles.backdrop} 
      onClick={onClose}
    >
      <div 
        data-component="AddressModalContent"
        style={styles.modal} 
        onClick={(e) => e.stopPropagation()}
      >
        <h3 data-component="AddressModalTitle">Adresse de livraison</h3>

        {/* Identité */}
        <div 
          data-component="IdentitySection"
          style={styles.row}
        >
          <input
            data-component="FirstNameInput"
            data-field-name="firstName"
            placeholder="Prénom *"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            data-component="LastNameInput"
            data-field-name="lastName"
            placeholder="Nom *"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        {/* Téléphone */}
        <input
          data-component="PhoneInput"
          data-field-name="phone"
          placeholder="Téléphone *"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        {/* Autocomplete BAN */}
        <div data-component="AddressAutocompleteSection">
          <input
            data-component="AddressAutocompleteInput"
            data-field-name="address_autocomplete"
            placeholder="Commencez à taper votre adresse… *"
            value={banQ}
            onChange={(e) => setBanQ(e.target.value)}
          />
          {banSug.length > 0 && (
            <ul 
              data-component="AddressSuggestionsList"
              style={styles.suggest}
            >
              {banSug.map((s, i) => (
                <li 
                  key={i}
                  data-component="AddressSuggestionItem"
                  data-suggestion-index={i}
                  onClick={() => applySuggestion(s)}
                >
                  {s.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Adresse livraison */}
        <div 
          data-component="ShippingAddressSection"
          style={styles.grid}
        >
          <input
            data-component="ShippingLine1Input"
            data-field-name="shipping_line1"
            placeholder="Adresse (ligne 1) *"
            value={shipping.line1}
            onChange={(e) =>
              setShipping({ ...shipping, line1: e.target.value })
            }
          />
          <input
            data-component="ShippingLine2Input"
            data-field-name="shipping_line2"
            placeholder="Complément (ligne 2)"
            value={shipping.line2}
            onChange={(e) =>
              setShipping({ ...shipping, line2: e.target.value })
            }
          />
          <input
            data-component="ShippingPostcodeInput"
            data-field-name="shipping_postcode"
            placeholder="Code postal *"
            value={shipping.postcode}
            onChange={(e) =>
              setShipping({ ...shipping, postcode: e.target.value })
            }
          />
          <input
            data-component="ShippingCityInput"
            data-field-name="shipping_city"
            placeholder="Ville *"
            value={shipping.city}
            onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
          />
        </div>

        {errorMsg && (
          <p 
            data-component="ErrorMessage"
            style={{ color: "red", fontSize: 14, marginTop: 4 }}
          >
            {errorMsg}
          </p>
        )}

        {/* Notes livraison */}
        <textarea
          data-component="DeliveryNotesInput"
          data-field-name="delivery_notes"
          placeholder="Instructions de livraison (optionnel)"
          value={deliveryNotes}
          onChange={(e) => setDeliveryNotes(e.target.value)}
        />

        {/* Facturation */}
        <label
          data-component="BillingSameCheckboxLabel"
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <input
            data-component="BillingSameCheckbox"
            type="checkbox"
            checked={billingSame}
            onChange={() => setBillingSame((v) => !v)}
          />
          <span data-component="BillingSameCheckboxText">
            Utiliser cette adresse pour la facturation
          </span>
        </label>

        {!billingSame && (
          <>
            <h4 
              data-component="BillingAddressSectionTitle"
              style={{ marginTop: 10 }}
            >
              Adresse de facturation
            </h4>
            <div 
              data-component="BillingAddressSection"
              style={styles.grid}
            >
              <input
                data-component="BillingLine1Input"
                data-field-name="billing_line1"
                placeholder="Adresse (ligne 1)"
                value={billing.line1}
                onChange={(e) =>
                  setBilling({ ...billing, line1: e.target.value })
                }
              />
              <input
                data-component="BillingPostcodeInput"
                data-field-name="billing_postcode"
                placeholder="Code postal"
                value={billing.postcode}
                onChange={(e) =>
                  setBilling({ ...billing, postcode: e.target.value })
                }
              />
              <input
                data-component="BillingCityInput"
                data-field-name="billing_city"
                placeholder="Ville"
                value={billing.city}
                onChange={(e) =>
                  setBilling({ ...billing, city: e.target.value })
                }
              />
            </div>
          </>
        )}

        <div 
          data-component="AddressModalActions"
          style={styles.actions}
        >
          <button 
            data-component="AddressModalCancelButton"
            onClick={onClose} 
            disabled={step === "loading"}
          >
            Annuler
          </button>
          <button 
            data-component="AddressModalSubmitButton"
            onClick={validateAndCheckout} 
            disabled={step === "loading"}
          >
            {step === "loading"
              ? "Vérification…"
              : "Continuer vers le paiement"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    width: 600,
    maxWidth: "95vw",
    background: "#fff",
    borderRadius: 10,
    padding: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,.2)",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 8,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    margin: "8px 0",
  },
  suggest: {
    listStyle: "none",
    padding: 0,
    margin: "6px 0",
    border: "1px solid #eee",
    borderRadius: 6,
    maxHeight: 160,
    overflow: "auto",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
  },
};