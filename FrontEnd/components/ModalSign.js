// ModalSign.js
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { logout } from "../reducers/user";

import loginstyle from "../styles/Login.module.css";
import Login from "./Login";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faXmark } from "@fortawesome/free-solid-svg-icons";

function ModalSign({ show, onClose, setSignin, setSignup, signin, signup }) {
  const dispatch = useDispatch();

  const hideForm = () => {
    console.log("Fermeture login");
    setSignin(false);
    setSignup(false);
  };

  if (!show) return null;

  return (
    <div data-component="SignModalBackdrop" className={loginstyle.login}>
      <div data-component="SignModalContainer" className={loginstyle.container}>
        {!signin && !signup && (
          <FontAwesomeIcon
            icon={faXmark}
            data-component="SignModalCloseButton"
            className={loginstyle.close}
            onClick={() => {
              onClose();
              hideForm();
            }}
          />
        )}

        {/* ===== SIGN UP SECTION ===== */}
        <div data-component="SignUpSectionLabel" className={loginstyle.txt1}>
          New here?
        </div>
        {signup ? (
          <div data-component="SignUpFormContainer">
            <Login
              mode="signup"
              onClose={onClose}
              onHideForm={hideForm}
              onLoginSuccess={() => {
                onClose();
                hideForm();
              }}
            />
          </div>
        ) : (
          <div data-component="SignUpButtonWrapper" className={loginstyle.divBtn}>
            <button
              data-component="SignUpButton"
              className={loginstyle.buttonSignUp}
              onClick={() => {
                setSignup(true);
                setSignin(false);
              }}
            >
              Sign up
            </button>
          </div>
        )}

        {/* ===== SIGN IN SECTION ===== */}
        <div data-component="SignInSectionLabel" className={loginstyle.txt2}>
          Welcome back beauty!
        </div>
        {signin ? (
          <div data-component="SignInFormContainer">
            <Login
              onClose={onClose}
              onHideForm={hideForm}
              mode="login"
              onLoginSuccess={() => {
                onClose();
                hideForm();
              }}
            />
          </div>
        ) : (
          <div data-component="SignInButtonWrapper" className={loginstyle.divBtn2}>
            <button
              data-component="SignInButton"
              className={loginstyle.buttonSignin}
              onClick={() => {
                setSignin(true);
                setSignup(false);
              }}
            >
              Sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ModalSign;