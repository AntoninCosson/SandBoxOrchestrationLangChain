import { useRef, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../reducers/user";
import { useStore } from "react-redux";
import { fetchWithAuth } from "../lib/api";
import {
  setCartFromGuest,
  removeFromCartByIndex,
  setCartFromServer,
} from "../reducers/shop";

import homeStyles from "../styles/Home.module.css";
import loginstyle from "../styles/Login.module.css";
import loginStyles from "../styles/Login.module.css";

import { removeFromCart } from "../reducers/shop";

import Shop from "./Shop";
import WhereIsChairButton from "./WhereIsChairButton";
import ChairSavage from "./ChairSavage";
import ChairGame from "./ChairGame";
import ModalLogout from "./ModalLogout";
import ModalSign from "./ModalSign";
import CartView from "./CartView";
import Modal from "./ModalChatBox";
import Chatbox from "./ChatBox";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faCartShopping } from "@fortawesome/free-solid-svg-icons";

function HomeButtons() {
  const store = useStore();
  const shopRef = useRef(null);
  const portfolioRef = useRef(null);
  const chairRef = useRef(null);

  const [areButtonHomesVisible, setAreButtonHomesVisible] = useState(true);
  const [isChairVisible, setIsChairVisible] = useState(false);
  const [showWhereIsChairBtn, setShowWhereIsChairBtn] = useState(true);
  const [isChairSavageClicked, setisChairSavageClicked] = useState(false);
  const [signin, setSignin] = useState(false);
  const [signup, setSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isShopClicked, setIsShopClicked] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const [clickCount, setClickCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const isLogged = useSelector((state) => state.user.connected);
  const user = useSelector((state) => state.user);
  const cart = useSelector((state) => state.shop.cartList);
  const products = useSelector((state) => state.shop.products);
  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      if (!isLogged) {
        const guest = JSON.parse(localStorage.getItem("guestCart") || "[]");
        const byId = new Map(products.map((p) => [String(p._id || p.id), p]));
        const uiCart = guest
          .map((it) => {
            const p = byId.get(String(it.productId));
            return p ? { ...p, quantity: it.quantity } : null;
          })
          .filter(Boolean);
        dispatch(setCartFromGuest(uiCart));
        return;
      }
      try {
        const res = await fetchWithAuth("/shop/cart", {
          getState: store.getState,
          dispatch,
        });
        if (res.ok && res.data?.success) {
          const uiCart = res.data.cart
            .filter((i) => i?.productId)
            .map((i) => ({ ...i.productId, quantity: i.quantity }));
          dispatch(setCartFromServer(uiCart));
        }
      } catch (e) {
        // no-op
      }
    })();
  }, [isLogged, dispatch, store]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleRevealChair = () => {
    setIsChairVisible(true);
    setShowWhereIsChairBtn(false);
  };

  const handle5ClickToGame = () => {
    setisChairSavageClicked(true);
    setAreButtonHomesVisible(false);
  };

  const handleShowLogin = () => {
    setShowLogin(true);
  };

  const formatEUR = (n) =>
    (Number(n) || 0).toLocaleString("fr-FR", {
      style: "currency",
      currency: "EUR",
    });

  const subTotal = (cart || []).reduce((sum, p) => {
    const price = Number(p.price) || 0;
    const qty = Number(p.quantity) || 0;
    return sum + price * qty;
  }, 0);

  const totalItems = (cart || []).reduce(
    (sum, p) => sum + (Number(p.quantity) || 0),
    0
  );

  const handleDeleteOneCart = async (prod, idx) => {
    if (!isLogged) {
      const key = "guestCart";
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      const i = arr.findIndex(
        (it) => String(it.productId) === String(prod._id)
      );
      if (i >= 0) {
        arr.splice(i, 1);
        localStorage.setItem(key, JSON.stringify(arr));
      }
      dispatch(removeFromCartByIndex({ index: idx }));
      return;
    }

    const res = await fetchWithAuth(`/shop/cart/${prod._id}`, {
      method: "DELETE",
      getState: store.getState,
      dispatch,
    });
    if (res.ok && res.data?.success) {
      const uiCart = (res.data.cart || [])
        .filter((i) => i?.productId)
        .map((i) => ({ ...i.productId, quantity: i.quantity }));
      dispatch(setCartFromServer(uiCart));
    }
  };

  return (
    <div data-component="Home" className={homeStyles.body}>
      {/* ===== HEADER ===== */}
      <div data-component="HomeHeader" className={homeStyles.header}>
        <div data-component="HeaderButtonBlock" className={homeStyles.headerBtnBlock}>
          {isLogged && (
            <h2 data-component="UserUsername" className={homeStyles.Displayusername}>
              @{user.username}
            </h2>
          )}

          <FontAwesomeIcon
            icon={faUser}
            data-component="UserLoginButton"
            className={homeStyles.btnConnect}
            onClick={() => handleShowLogin()}
          />

          <div
            data-component="CartButtonContainer"
            className={homeStyles.btnCartDiv}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <FontAwesomeIcon
              icon={faCartShopping}
              data-component="CartIcon"
              className={homeStyles.btnCart}
            />
            <div data-component="CartItemCount" className={homeStyles.btnCartCount}>
              {cart.length}
            </div>
          </div>
        </div>

        {/* ===== CART DROPDOWN ===== */}
        <div
          data-component="CartDropdownTrigger"
          className={homeStyles.cartWrapper}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />

        <div
          data-component="CartDropdownContent"
          className={`${homeStyles.btnCartHover} ${isHovered ? homeStyles.show : ""}`}
        >
          <div
            data-component="CartItemsListContainer"
            className={homeStyles.cartWrapper2}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div data-component="CartItemsScrollable" className={homeStyles.overflow}>
              {cart.map((data, i) => (
                <div key={i} data-component="CartItemEntry">
                  <div data-component="CartItemRow" className={homeStyles.cartContainer}>
                    <div data-component="CartItemDetails">
                      <div data-component="CartItemName" className={homeStyles.nameInCart}>
                        {data.name}
                      </div>
                      <div data-component="CartItemSize" className={homeStyles.sizeInCart}>
                        {data.size}
                      </div>
                      <div data-component="CartItemPrice" className={homeStyles.priceInCart}>
                        {data.price}€
                      </div>
                    </div>
                    <div data-component="CartItemQuantityInfo">
                      <div data-component="CartItemQuantityBadge" className={homeStyles.sizeInCart}>
                        Qty: {data.quantity}
                      </div>
                    </div>
                    <div data-component="CartItemDeleteWrapper" className={homeStyles.btnDeleteWraper}>
                      <div
                        data-component="CartItemDeleteButton"
                        className={homeStyles.btnDelete}
                        onClick={() => handleDeleteOneCart(data, i)}
                      >
                        x
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== CART FOOTER ===== */}
          <div data-component="CartDropdownFooter" className={homeStyles.cartFooter}>
            <div
              data-component="CartSummarySection"
              className={homeStyles.cartWrapper3}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div data-component="CartSubtotalRow" className={homeStyles.subtotalRow}>
                <span data-component="CartSubtotalLabel">
                  Sous-total ({totalItems} {totalItems > 1 ? "articles" : "article"})
                </span>
                <strong data-component="CartSubtotalAmount">
                  {formatEUR(subTotal)}
                </strong>
              </div>

              <div
                data-component="ViewFullCartButton"
                onClick={() => {
                  setIsCartOpen(true);
                  setShowLogin(false);
                  setSignin(false);
                  setSignup(false);
                  setAreButtonHomesVisible(false);
                  setShowWhereIsChairBtn(false);
                  setIsShopClicked(false);
                  setIsChairVisible(false);
                  setisChairSavageClicked(false);
                }}
                className={homeStyles.GotoCart}
              >
                Voir mon panier
              </div>
            </div>
          </div>
        </div>

        {/* ===== AUTH MODALS ===== */}
        <div data-component="AuthModalContainer" className={loginstyle.logsWraper}>
          {isLogged && showLogin && !isChairSavageClicked && (
            <ModalLogout
              show={showLogin}
              onClose={() => setShowLogin(false)}
              onHide={() => setShowLogin(false)}
            />
          )}

          <div data-component="SignInSignUpModalWrapper" className={homeStyles.SignInUpBody}>
            {showLogin && !isLogged && !isChairSavageClicked && (
              <ModalSign
                show={showLogin}
                onClose={() => setShowLogin(false)}
                onHide={() => setShowLogin(false)}
                setSignin={setSignin}
                setSignup={setSignup}
                signin={signin}
                signup={signup}
              />
            )}
          </div>
        </div>
      </div>
      {/* FIN HEADER */}

      {/* ===== MAIN BUTTONS (PORTFOLIO / SHOP / CHAT) ===== */}
      {areButtonHomesVisible && (
        <div data-component="HomeMainButtonsSection" className={homeStyles.bigButtons}>
          <div data-component="PortfolioButtonContainer" ref={portfolioRef} className={homeStyles.divPortfolio}>
            <button
              data-component="PortfolioButton"
              className={homeStyles.svgButton}
              onClick={() => alert("Prout !")}
            >
              <img
                data-component="PortfolioButtonIcon"
                className={homeStyles.Portfolio}
                src="/EcrisIcon/homePORTFOLIO.svg"
                alt="Portfolio"
              />
            </button>
          </div>

          <div data-component="ShopButtonContainer" className={homeStyles.divShop}>
            <button data-component="ShopButtonWrapper" className={homeStyles.svgButton}>
              <img
                ref={shopRef}
                data-component="ShopButton"
                className={homeStyles.Shop}
                src="/EcrisIcon/home-SHOP.svg"
                alt="Shop"
                onClick={() => {
                  setShowLogin(false);
                  setSignin(false);
                  setSignup(false);
                  setAreButtonHomesVisible(false);
                  setShowWhereIsChairBtn(false);
                  setIsShopClicked(false);
                  setIsChairVisible(false);
                  setisChairSavageClicked(false);
                  setIsShopClicked(true);
                }}
              />
            </button>
          </div>

          <div data-component="ChatButtonContainer" className={homeStyles.divNextGuest}>
            <button
              data-component="ChatOpenButton"
              className={homeStyles.svgButton}
              onClick={() => setChatOpen(true)}
            >
              <img
                data-component="ChatButtonIcon"
                className={homeStyles.NextGuest}
                src="/EcrisIcon/home-NEXTGUEST.svg"
                alt="Prendre RDV"
              />
            </button>
            <Modal open={chatOpen} onClose={() => setChatOpen(false)}>
              <Chatbox />
            </Modal>
          </div>
        </div>
      )}

      {/* ===== SHOP SECTION ===== */}
      {isShopClicked && (
        <div data-component="ShopSection">
          <Shop username={user.username} />
        </div>
      )}

      {/* ===== WHERE IS CHAIR BUTTON ===== */}
      {showWhereIsChairBtn && (
        <div data-component="WhereIsChairSection">
          <WhereIsChairButton
            onReveal={handleRevealChair}
            shopRef={shopRef}
            showWIC={showWhereIsChairBtn}
          />
        </div>
      )}

      {/* ===== CART VIEW MODAL ===== */}
      {isCartOpen && (
        <div data-component="CartViewModalSection">
          <CartView onClose={() => setIsCartOpen(false)} />
        </div>
      )}

      {/* ===== CHAIR SAVAGE ANIMATION ===== */}
      <div data-component="ChairSavageAnimationSection">
        {isChairVisible && (
          <ChairSavage
            chairRef={chairRef}
            portfolioRef={portfolioRef}
            shopRef={shopRef}
            onFinish={handle5ClickToGame}
          />
        )}
      </div>

      {/* ===== CHAIR GAME ===== */}
      <div data-component="ChairGameSection">
        {isChairSavageClicked && <ChairGame />}
      </div>
    </div>
  );
}

export default HomeButtons;