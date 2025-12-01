import React from "react";
import { useDispatch } from "react-redux";
import { logout } from "../reducers/user";
import { setCartFromServer, setCartLis, clearCart } from "../reducers/shop";

import loginstyle from "../styles/Login.module.css";
import Modalstyle from "../styles/ModalLogout.module.css";

function ModalLogout({ show, onClose }) {
  const dispatch = useDispatch();

  if (!show) return null;

  const handleLogout = () => {
    localStorage.removeItem("guestCart");
    dispatch(clearCart());
    dispatch(logout());
    onClose();
  };

  return (
    <div data-component="LogoutModalBackdrop" className={Modalstyle.logoutcontainer}>
      <div data-component="LogoutModalContent" className={Modalstyle.logoutDiv}>
        <div
          data-component="LogoutButton"
          className={Modalstyle.logout}
          onClick={() => {
            handleLogout();
            onClose();
          }}
        >
          Logout
        </div>

        <button 
          data-component="LogoutModalCloseButton" 
          className={Modalstyle.closeLogout} 
          onClick={onClose}
        >
          X
        </button>
      </div>
    </div>
  );
}

export default ModalLogout;